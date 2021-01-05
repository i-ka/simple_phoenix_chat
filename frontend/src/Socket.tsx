import { createContext, FC, useCallback, useEffect, useState } from 'react';
import { Channel, Socket } from 'phoenix';
import { User } from './USer';

export const SocketContext = createContext<Socket | undefined>(undefined);

export const UserContext = createContext<User | undefined>(undefined);

export const Chat: FC<{ token: string, endpoint: string, user: User, children?: React.ReactNode }> =
    ({ token, endpoint, user, children }) => {
        const [socket, setSocket] = useState<Socket>();
        const [directChannel, setDirectChannel] = useState<Channel>();

        useEffect(() => {
            if (socket?.isConnected()) {
                socket.disconnect();
            }
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
                channel.on('invite', resp => console.log('You were invite into conversation', resp))
                setDirectChannel(channel);
            }
        }, [socket, user])

        return (
            <SocketContext.Provider value={socket}>
                <UserContext.Provider value={user}>
                    {children}
                </UserContext.Provider>
            </SocketContext.Provider>
        )
    }
