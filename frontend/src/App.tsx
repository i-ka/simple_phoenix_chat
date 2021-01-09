import React, { useCallback, useContext, useEffect, useState } from 'react';
import { TandyrChatConnector, DirectChannelContext, SocketContext, UserContext, Chat } from './Socket'
import { Channel, Socket } from 'phoenix';
import './App.css';
import { User } from './USer';
import { ChatUI } from './ChatUi';

const TestButton = () => {
  const directChannel = useContext(DirectChannelContext);
  const user = useContext(UserContext);
  
  const createConversation = (inviteUserIds: number[]) => {
    directChannel
      ?.push("new_conversation", {name: "test123", users_to_invite: inviteUserIds})
      .receive('ok', c => console.log(c))
      .receive('error', e => console.error(e))
  }

  return (
    <div>
      <span>You are logged in as user {user?.username} your id is {user?.id}</span>
      <button onClick={() => createConversation([2])}>Create channel</button>
    </div>
  )
}

function App() {
  const [login, setLogin] = useState<string>('');
  const [pass, setPass] = useState<string>('');
  const [token, setToken] = useState<string>();
  const [user, setUser] = useState<User>()

  const signIn = useCallback(() => {
    fetch('http://localhost:4000/api/user/login', {
      method: 'POST',
      body: JSON.stringify({ username: login, password: pass }),
      headers: {
        'Content-Type': 'application/json'
      },
    })
      .then(resp => resp.json())
      .then(json => {
        setToken(json.token)
        setUser(json.me)
      });
  }, [login, pass])

  return (
    <div>
      {token && user
        ?
        <TandyrChatConnector endpoint='ws://localhost:4000/socket' user={user} token={token}>
          <Chat>
            <ChatUI></ChatUI>
          </Chat>
        </TandyrChatConnector>
        : <>
          <input value={login} onChange={(e) => setLogin(e.target.value)} />
          <input value={pass} onChange={(e) => setPass(e.target.value)} />
          <button onClick={() => signIn()}>SignIn</button>
        </>
      }
    </div>
  );
}

export default App;
