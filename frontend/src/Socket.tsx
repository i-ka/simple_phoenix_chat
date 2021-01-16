import { createContext, FC, useCallback, useContext, useEffect, useReducer, useState } from 'react';
import { Channel, Socket } from 'phoenix';
import { User } from './USer';
import { AppContext } from './AppContext';
import urljoin from 'url-join'

export const SocketContext = createContext<Socket | undefined>(undefined);
export const UserContext = createContext<User | undefined>(undefined);
export const DirectChannelContext = createContext<Channel | undefined>(undefined);

export const TandyrChatConnector: FC<{ token: string, endpoint: string, user: User, children?: React.ReactNode }> =
    ({ token, endpoint, user, children }) => {
        const [socket, setSocket] = useState<Socket>();
        const [directChannel, setDirectChannel] = useState<Channel>();

        useEffect(() => {
            let newSocket = new Socket(endpoint, { params: { token } })
            newSocket.connect();
            setSocket(newSocket);
            return () => {
                if (socket?.isConnected()) {
                    socket.disconnect();
                }
                setSocket(undefined);
            }
        }, [endpoint, token])

        useEffect(() => {
            if (socket?.isConnected) {
                let channel = socket.channel(`direct:${user.id}`);
                channel.join();
                setDirectChannel(channel);
            }
        }, [socket, user])

        return (
            <SocketContext.Provider value={socket}>
                <UserContext.Provider value={user}>
                    <DirectChannelContext.Provider value={directChannel}>
                        {children}
                    </DirectChannelContext.Provider>
                </UserContext.Provider>
            </SocketContext.Provider>
        )
    }

export interface Message {
    id: number,
    user: User
    content: { body: string }

}

export interface Room {
    id: number,
    name: string,
    participants: User[],
    messages?: Message[]
}

export interface IProvidedChatState {
    rooms: Room[]
    currentRoom: Room | null

    sendMessage(room: Room, messageBody: string): void
    setCurrentRoomId(id: number): void
    createRoom(name: string, description: string, usersToInvite: number[]): Promise<void>
}

type ChatInvite = { to_room: number }

export const ChatContext = createContext<IProvidedChatState | undefined>(undefined);

type RoomRegistry = { [id: number]: Room }

interface IChatState {
    rooms: RoomRegistry,
    currentRoomId?: number
}

interface SetRoomsAction {
    type: 'SET_ROOMS'
    payload: Room[]
}

interface UpdateRoomAction {
    type: 'UPSERT_ROOM'
    payload: Room
}

interface NewMessageAction {
    type: 'NEW_MESSAGE'
    payload: { roomId: number, message: Message }
}

interface SetCurrentRoomAction {
    type: 'SET_CURRENT_ROOM'
    payload: number
}

type ChatActions = SetRoomsAction | UpdateRoomAction | NewMessageAction | SetCurrentRoomAction;

const chatReducer = (state: IChatState, action: ChatActions): IChatState => {
    switch (action.type) {
        case 'SET_ROOMS':
            return {
                ...state,
                rooms: action.payload.reduce((acc, r) => ({ ...acc, [r.id]: r }), {})
            }
        case 'UPSERT_ROOM':
            return { ...state, rooms: { ...state.rooms, [action.payload.id]: action.payload } }
        case 'NEW_MESSAGE':
            {
                if (action.payload.roomId in state.rooms) {
                    const room = state.rooms[action.payload.roomId];
                    return {
                        ...state,
                        rooms: {
                            ...state.rooms,
                            [action.payload.roomId]: {
                                ...room,
                                messages: [...(room.messages || []), action.payload.message]
                            }
                        }
                    }
                }
                break;
            }
        case 'SET_CURRENT_ROOM':
            return { ...state, currentRoomId: action.payload }
    }
    return state;
}

export const currentRoom = ({ currentRoomId, rooms }: IChatState) =>
    currentRoomId && currentRoomId in rooms ? rooms[currentRoomId] : null;
export const roomsArray = ({ rooms }: IChatState) => Object.values(rooms)

export const Chat: FC<{ children?: React.ReactNode }> = ({ children }) => {
    const directChannel = useContext(DirectChannelContext)
    const socket = useContext(SocketContext);
    const [chatState, dispatch] = useReducer(chatReducer, { rooms: {} })
    const [roomChannels, setRoomChannels] = useState<{ [id: number]: Channel }>();

    const getRoomChannel = useCallback((roomId: number) =>
        roomChannels && roomId in roomChannels ? roomChannels[roomId] : null, [roomChannels])

    const handleNewMessage = (roomId: number) =>
        (message: Message) => dispatch({ type: 'NEW_MESSAGE', payload: { roomId, message } });

    const handleInvite = useCallback(({ to_room }: ChatInvite) => {
        let channel = socket?.channel(`room:${to_room}`);
        if (!!channel) {
            channel.join()
                .receive('ok', (room: Room) => {
                    dispatch({ type: 'UPSERT_ROOM', payload: room })

                    channel?.on('new_message', handleNewMessage(room.id))
                    setRoomChannels({ ...roomChannels, [room.id]: channel as Channel });
                });
        }

    }, [socket, roomChannels])

    const subscribeToRoom = useCallback((room: Room) =>
        new Promise<{ channel: Channel, room: Room }>((resolve, reject) => {
            if (!socket) throw reject(new Error("Socket does not provided"))
            let channel = socket.channel(`room:${room.id}`);
            channel.join()
                .receive('ok', (room: Room) => {
                    channel.on('new_message', handleNewMessage(room.id))
                    if (!room.messages) room = {...room, messages:[]}
                    resolve({ channel, room })
                }).receive('error', (reason) => reject(reason));
        }), [socket])

    useEffect(() => {
        console.log("Initilizing chat");
        directChannel?.push("get_my_rooms", {})
            .receive('ok', (rooms: Room[]) => {
                Promise.all(rooms.map(async (r) => await subscribeToRoom(r)))
                    .then(rooms => {
                        dispatch(
                            {
                                type: 'SET_ROOMS',
                                payload: rooms.map(r => r.room)
                            });
                        setRoomChannels(rooms.reduce((acc, rc) => ({ ...acc, [rc.room.id]: rc.channel }), {}))
                    })
            });
    }, [socket, directChannel, subscribeToRoom])

    useEffect(() => {
        directChannel?.on('invite', handleInvite)
    }, [handleInvite, directChannel])

    const sendMessage = useCallback((to: Room, messageBody: string) => {
        const channel = getRoomChannel(to.id);
        channel?.push('new_message', { body: messageBody })
    }, [getRoomChannel])

    const createRoom = useCallback((name: string, description: string, usersToInvite: number[]) =>
        new Promise<void>((resolve, reject) => {
            console.log("Creating new chat room")
            directChannel?.push("new_conversation", { name, description, users_to_invite: usersToInvite })
                .receive('ok', (room: Room) => {
                    console.log("Recieve ok")
                    subscribeToRoom(room)
                        .then(({ room, channel }) => {
                            dispatch({ type: 'UPSERT_ROOM', payload: room })
                            setRoomChannels({...roomChannels, [room.id]: channel})
                            resolve()
                        })
                }).receive('error', (reason) => {
                    console.error('Error on creating chat', reason)
                    reject(reason)
                })
        }), [directChannel])

    return (
        chatState.rooms
            ? (<ChatContext.Provider value={{
                rooms: roomsArray(chatState),
                currentRoom: currentRoom(chatState),
                sendMessage,
                createRoom,
                setCurrentRoomId: (id) => dispatch({ type: 'SET_CURRENT_ROOM', payload: id })
            }}>
                {children}
            </ChatContext.Provider>)
            : <span>Chat is not loaded</span>
    );
}