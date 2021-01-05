import React, { useCallback, useContext, useEffect, useState } from 'react';
import { Chat, SocketContext, UserContext } from './Socket'
import { Channel, Socket } from 'phoenix';
import './App.css';
import { User } from './USer';

const TestButton = () => {
  const socket = useContext(SocketContext);
  const user = useContext(UserContext);
  
  const createConversation = (inviteUserIds: number[]) => {
    
  }

  return (
    <div>
      <span>You are logged in as user {user?.username}</span>
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
        <Chat endpoint='ws://localhost:4000/socket' user={user} token={token}>
          <span>You are in chat!</span>
          <TestButton></TestButton>
        </Chat>
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
