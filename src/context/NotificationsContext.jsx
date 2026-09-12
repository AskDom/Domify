import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth, CSRF_HEADERS } from "./AuthContext";

const API_URL  = import.meta.env.VITE_API_URL || "http://localhost:5000";
const NotificationsContext = createContext();

export function NotificationsProvider({ children }) {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount,   setUnreadCount]    = useState(0);
  const socketRef = useRef(null);

  const fetchNotifications = useCallback(async () => {
    if (!currentUser) return;
    try {
      const res  = await fetch(`${API_URL}/api/notifications`, {
        credentials: "include",
      });
      if (!res.ok) return;
      const data = await res.json();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("fetchNotifications error:", err);
    }
  }, [currentUser]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // ── WEBSOCKET — reusa el mismo socket autenticado que el inbox ──────────────
  useEffect(() => {
    if (!currentUser) return;

    const socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    socket.on("new_notification", (n) => {
      setNotifications((prev) => [{ id: `temp-${Date.now()}`, read: false, ...n }, ...prev]);
      setUnreadCount((c) => c + 1);
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.id]);

  const markAsRead = useCallback(async (id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
    setUnreadCount((c) => Math.max(0, c - 1));
    try {
      await fetch(`${API_URL}/api/notifications/${id}/read`, {
        method: "PATCH",
        credentials: "include",
        headers: CSRF_HEADERS,
      });
    } catch (err) {
      console.error("markAsRead (notification) error:", err);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
    try {
      await fetch(`${API_URL}/api/notifications/read-all`, {
        method: "PATCH",
        credentials: "include",
        headers: CSRF_HEADERS,
      });
    } catch (err) {
      console.error("markAllAsRead error:", err);
    }
  }, []);

  return (
    <NotificationsContext.Provider value={{
      notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead,
    }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
