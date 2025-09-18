import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// Context for providing a Socket.IO client throughout the app. The client
// connects to the server URL defined in the VITE_SERVER_URL environment
// variable or defaults to localhost:5000. The provider handles cleanup
// on unmount.
const SocketContext = createContext(null);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  useEffect(() => {
    // Determine the server URL. `import.meta.env` is replaced at build
    // time by Vite with the values defined in your `.env` files. In
    // development this defaults to `http://localhost:5000`.
    const url = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000';
    const newSocket = io(url, { transports: ['websocket'] });
    setSocket(newSocket);
    return () => {
      newSocket.disconnect();
    };
  }, []);
  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  return useContext(SocketContext);
};