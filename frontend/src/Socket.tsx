import { createContext, FC, useCallback, useContext, useEffect, useState } from 'react';
import { Channel, Socket } from 'phoenix';
import { User } from './USer';

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
    author: User
    content: { body: string }

}

export interface Room {
    id: number,
    name: string,
    participants: User[],
    messages: Message[]
}

export interface IProvidedChatState {
    rooms: { [id: number]: Room }
    currentRoom: Room | null

    sendMessage(room: Room, messageBody: string): void
    setCurrentRoomId(id: number): void
}

type ChatInvite = { to_room: number }

export const ChatContext = createContext<IProvidedChatState | undefined>(undefined);

export const Chat: FC<{ children?: React.ReactNode }> = ({ children }) => {
    const directChannel = useContext(DirectChannelContext)
    const socket = useContext(SocketContext);

    const [rooms, setRooms] = useState<{ [id: number]: Room }>();
    const [currentRoomId, setCurrentRoomId] = useState<number>();
    const currentRoom = rooms && currentRoomId ? rooms[currentRoomId] : null;
    const [roomChannels, setRoomChannels] = useState<{ [id: number]: Channel }>()

    const getRoom = useCallback((roomId: number) => rooms && roomId in rooms ? rooms[roomId] : null, [rooms]);
    const getRoomChannel = useCallback((roomId: number) => roomChannels && roomId in roomChannels ? roomChannels[roomId] : null, [roomChannels])

    const handleNewMessage = useCallback((roomId: number) => (message: Message) => {
        const handleRoom = getRoom(roomId)
        if (handleRoom) {
            const modifiedRoom = { ...handleRoom, messages: [message, ...handleRoom.messages] };
            setRooms({ ...rooms, [roomId]: modifiedRoom })
        }
    }, [getRoom, rooms])

    const handleInvite = useCallback(({ to_room }: ChatInvite) => {
        let channel = socket?.channel(`room:${to_room}`);
        if (!!channel) {
            channel.join()
                .receive('ok', (room: Room) => {
                    setRooms({ ...rooms, [room.id]: room });

                    channel?.on('new_message', handleNewMessage(room.id))
                    setRoomChannels({ ...roomChannels, [room.id]: channel as Channel });
                });
        }

    }, [socket, roomChannels, rooms, handleNewMessage])

    const subscribeToRoom = useCallback((room: Room) => {
        if (!socket) throw new Error("Socket does not provided")
        let channel = socket.channel(`room:${room.id}`);
        channel.join();
        channel.on('new_message', handleNewMessage(room.id))
        return channel;
    }, [socket, handleNewMessage])

    useEffect(() => {
        console.log("Initilizing chat");

        directChannel?.push("get_my_rooms", {})
            .receive('ok', (rooms: Room[]) => {

                setRooms(rooms.reduce((acc, current) => ({ ...acc, [current.id]: current }),
                    {} as { [id: number]: Room }))
            });
    }, [socket, directChannel])

    useEffect(() => {
        directChannel?.on('invite', handleInvite)
    }, [handleInvite, directChannel])

    useEffect(() => {
        if (!rooms) return;
        setRoomChannels(Object.values(rooms).reduce((acc, r) => ({ ...acc, [r.id]: subscribeToRoom(r) }),
                    {} as { [id: number]: Channel }))
    }, [rooms, subscribeToRoom])

    const sendMessage = useCallback((to: Room, messageBody: string) => {
        const channel = getRoomChannel(to.id);
        channel?.push('new_message', { body: messageBody })
    }, [getRoomChannel])

    return (
        rooms
            ? (<ChatContext.Provider value={{ rooms, currentRoom, sendMessage, setCurrentRoomId }}>
                {children}
            </ChatContext.Provider>)
            : <span>Chat is not loaded</span>
    );
}