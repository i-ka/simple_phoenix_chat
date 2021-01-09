import React, { FC, useContext } from 'react'
import { ChatContext } from './Socket'

export const ChatUI: FC<{}> = () => {

    const chat = useContext(ChatContext)

    if (!chat) {
        return (<span>Error: Chat is not provided</span>)
    }

    const { rooms } = chat;

    return (
        <>
            <ol>
                {Object.entries(rooms).map(([_, r]) => (
                    <li>{r.name}</li>
                ))}
            </ol>
        </>
    )
}