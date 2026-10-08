import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { io } from 'socket.io-client';
import { getNotifications } from '../services/api';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

const socketOrigin = () => {
  if (import.meta.env.VITE_SOCKET_URL) return import.meta.env.VITE_SOCKET_URL;
  const configuredApi = import.meta.env.VITE_API_BASE_URL;
  if (configuredApi) return configuredApi.replace(/\/api\/v1\/?$/, '');
  return window.location.origin;
};

export const SocketProvider = ({ children }) => {
  const { isAuthenticated, user } = useAuth();
  const [socket, setSocket] = useState(null);
  const [status, setStatus] = useState('disconnected');
  const [notifications, setNotifications] = useState([]);
  const [socketError, setSocketError] = useState('');

  useEffect(() => {
    let active = true;
    if (!isAuthenticated || !user?.id) {
      setSocket(null);
      setStatus('disconnected');
      setNotifications([]);
      return undefined;
    }

    const token = localStorage.getItem('prepverse_token');
    const connection = io(socketOrigin(), {
      autoConnect: false,
      withCredentials: true,
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      reconnectionDelayMax: 10000,
    });
    setSocket(connection);
    setStatus('connecting');
    getNotifications().then((data) => {
      if (active) setNotifications(data.notifications || []);
    }).catch(() => {});

    connection.on('connect', () => { setStatus('connected'); setSocketError(''); });
    connection.on('disconnect', () => setStatus('reconnecting'));
    connection.io.on('reconnect_attempt', () => setStatus('reconnecting'));
    connection.io.on('reconnect', () => { setStatus('connected'); setSocketError(''); });
    connection.on('connect_error', (error) => {
      setStatus('error');
      setSocketError(error.message || 'Realtime connection failed.');
    });
    connection.on('notification:new', (notification) => {
      setNotifications((current) => [notification, ...current.filter((item) => item.id !== notification.id)].slice(0, 50));
    });
    connection.connect();

    return () => {
      active = false;
      connection.removeAllListeners();
      connection.io.removeAllListeners();
      connection.disconnect();
      setSocket(null);
      setStatus('disconnected');
    };
  }, [isAuthenticated, user?.id]);

  const joinRoom = useCallback((roomId) => new Promise((resolve, reject) => {
    if (!socket?.connected) return reject(new Error('Realtime connection is not connected.'));
    socket.emit('room:subscribe', { roomId }, (result) => {
      if (!result?.ok) reject(new Error(result?.error || 'Could not join room presence.'));
      else resolve(result);
    });
  }), [socket]);

  const leaveRoom = useCallback((roomId) => {
    if (socket?.connected) socket.emit('room:unsubscribe', { roomId });
  }, [socket]);

  const dismissNotification = useCallback((notificationId) => {
    setNotifications((current) => current.map((item) => item.id === notificationId ? { ...item, readAt: item.readAt || new Date().toISOString() } : item));
  }, []);

  const value = useMemo(() => ({ socket, status, socketError, notifications, setNotifications, joinRoom, leaveRoom, dismissNotification }),
    [socket, status, socketError, notifications, joinRoom, leaveRoom, dismissNotification]);
  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) throw new Error('useSocket must be used within SocketProvider.');
  return context;
};

export default SocketProvider;
