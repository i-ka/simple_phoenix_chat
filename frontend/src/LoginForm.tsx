import { Button, Form, Input } from 'antd'
import FormItem from 'antd/lib/form/FormItem';
import React, { FC, useCallback, useContext, useMemo, useState } from 'react'
import { AppContext } from './AppContext'
import { User } from './USer'

interface Props {
    onLoggedIn(user: User, token: string): void
}

const layout = {
    labelCol: { span: 8 },
    wrapperCol: { span: 16 },
};
const tailLayout = {
    wrapperCol: { offset: 8, span: 16 },
};

type FormAction = 'login' | 'register';

export const LoginForm: FC<Props> = ({ onLoggedIn }) => {
    const appContext = useContext(AppContext)

    const [isLoding, setIsLoading] = useState(false);
    const [actionType, setActionType] = useState<FormAction>('login');

    const login = useCallback(({ login, password }) => {
        fetch('http://localhost:4000/api/user/login', {
            method: 'POST',
            body: JSON.stringify({ username: login, password: password }),
            headers: {
                'Content-Type': 'application/json'
            },
        })
            .then(resp => resp.json())
            .then(json => {
                onLoggedIn(json.me, json.token)
            });
    }, [appContext, onLoggedIn])

    const register = useCallback(({ login, password }) => {
        fetch('http://localhost:4000/api/user/register', {
            method: 'POST',
            body: JSON.stringify({ username: login, password: password }),
            headers: {
                'Content-Type': 'application/json'
            },
        })
            .then(resp => resp.json())
            .then(json => {
                onLoggedIn(json.me, json.token)
            });
    }, [appContext, onLoggedIn])

    const header = useMemo(() => {
        switch (actionType) {
            case 'login': return <h2>Login</h2>
            case 'register': return <h2>Register</h2>
        }
    }, [actionType])

    const buttons = useMemo(() => {
        switch (actionType) {
            case 'login':
                return <>
                    <Button type='primary' htmlType='submit'>Login</Button>
                    or <Button type='link' onClick={() => setActionType('register')}>register</Button>
                </>
            case 'register':
                return <>
                    <Button type='primary' htmlType='submit'>Register</Button>
                    or <Button type='link' onClick={() => setActionType('login')}>login</Button>
                </>
        }
    }, [actionType])


    const onSubmit = actionType === 'login' ? login : register;

    return (
        <Form {...layout} onFinish={onSubmit}>
            <Form.Item>
                {header}
            </Form.Item>
            <Form.Item
                label="Login"
                name='login'
                rules={[{ required: true, message: 'Please enter login!' }]}
            >
                <Input />
            </Form.Item>
            <Form.Item
                label="Password"
                name='password'
                rules={[{ required: true, message: 'Please enter password!' }]}
            >
                <Input.Password />
            </Form.Item>
            <FormItem {...tailLayout}>
                {buttons}
            </FormItem>
        </Form>
    )
}