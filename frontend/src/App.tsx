import React, { useCallback, useContext, useEffect, useState } from 'react';
import { TandyrChatConnector, DirectChannelContext, SocketContext, UserContext, Chat } from './Socket'
import { Channel, Socket } from 'phoenix';
import './App.css';
import { User } from './USer';
import { ChatUI } from './ChatUi';
import { AppContext } from './AppContext';
import { LoginForm } from './LoginForm';

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
    <AppContext.Provider value={{baseUrl: "http://localhost:4000/api/user/login"}}>
      <div>
        {token && user
          ?
          <TandyrChatConnector endpoint='ws://localhost:4000/socket' user={user} token={token}>
            <Chat>
              <ChatUI></ChatUI>
            </Chat>
          </TandyrChatConnector>
          : <>
            <LoginForm onLoggedIn={(user, token) => {setUser(user); setToken(token)}}/>
          </>
        }
      </div>
    </AppContext.Provider>

  );
}

export default App;
