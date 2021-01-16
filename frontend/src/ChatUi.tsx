import { Button, Col, Empty, Input, List, message, Row, Typography } from 'antd'
import { create } from 'domain'
import React, { FC, useContext, useState } from 'react'
import { ChatContext, Message } from './Socket'

interface IMessageListProps {
    messages?: Message[]
}

const MessageList: FC<IMessageListProps> = ({ messages }) => {
    if (!messages) return <Empty description={<span>Nothing to display</span>} />
    if (messages.length == 0) {
        return <Empty description={<span>No messages here</span>} />;
    }
    return (
        <>
            {messages?.map(m => (
                <Row key={m.id}>
                    <Typography.Paragraph>{m.user.username}: {m.content.body}</Typography.Paragraph>
                </Row>)
            )}
        </>
    )
}

export const ChatUI: FC<{}> = () => {

    const chat = useContext(ChatContext)
    const [message, setMessage] = useState('')

    if (!chat) {
        return (<span>Error: Chat is not provided</span>)
    }

    const { rooms, currentRoom, setCurrentRoomId, createRoom, sendMessage } = chat;

    return (
        <>
            <Row>
                <Col span={6}>
                    <List
                        dataSource={rooms}
                        renderItem={(r) =>
                            <List.Item actions={(() => r.id != currentRoom?.id ? [
                                <Button onClick={() => setCurrentRoomId(r.id)}>Select</Button>
                            ] : [])()}>
                                <List.Item.Meta title={r.name}></List.Item.Meta>
                            </List.Item>
                        } />
                </Col>
                <Col span={18}>
                    <MessageList messages={currentRoom?.messages} />
                    {currentRoom?.messages &&
                        <>
                            <Row>
                                <Input value={message} onChange={e => setMessage(e.target.value)}></Input>
                                <Button onClick={() => {
                                    if (currentRoom) {
                                        sendMessage(currentRoom, message);
                                        setMessage('')
                                    }
                                }} >Send</Button>
                            </Row>
                        </>}
                </Col>
            </Row>

            <Button onClick={() => createRoom("New room", 'test test', [2])}>Create room</Button>
        </>
    )
}