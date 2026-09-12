import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { useAuth, CSRF_HEADERS } from "./AuthContext";

const API_URL    = import.meta.env.VITE_API_URL || "http://localhost:5000";
const InboxContext = createContext();

export function InboxProvider({ children }) {
  const { currentUser } = useAuth();
  const [messages,       setMessages]       = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [unreadCount,    setUnreadCount]    = useState(0);
  const socketRef = useRef(null);
  const soundRef = useRef(null);

  // Sonido de mensaje nuevo: un solo elemento <Audio> reutilizado (resetea el
  // currentTime y arranca; no recarga el archivo en cada mensaje). Si el
  // navegador lo bloquea (autoplay policy) o falla, nunca rompe el flujo.
  const playMessageSound = useCallback(() => {
    try {
      if (!soundRef.current) {
        soundRef.current = new Audio("/sounds/message.wav");
      }
      soundRef.current.currentTime = 0;
      soundRef.current.play().catch(() => {});
    } catch {
      // El sonido nunca debe romper el flujo del mensaje.
    }
  }, []);

  // Chrome/Safari bloquean audio.play() hasta que el usuario interactuó una
  // vez con el sitio. Calentamos el elemento en el primer toque/tecla (a
  // volumen 0, sin blip audible) para que el primer mensaje no quede mudo.
  useEffect(() => {
    const unlock = () => {
      try {
        const a = soundRef.current || new Audio("/sounds/message.wav");
        soundRef.current = a;
        const prevVolume = a.volume;
        a.volume = 0;
        a.play().then(() => { a.pause(); a.currentTime = 0; a.volume = prevVolume; }).catch(() => { a.volume = prevVolume; });
      } catch {
        // sin sonido peor caso; al user la primera interacción no debe fallar
      }
    };
    window.addEventListener("pointerdown", unlock, { once: true });
    window.addEventListener("keydown", unlock, { once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock);
      window.removeEventListener("keydown", unlock);
    };
  }, []);

  // ── FETCH ──────────────────────────────────────────────────────────────────
  // El backend pagina con ?limit=&cursor= (keyset sobre createdAt/id). Acá
  // recorremos las páginas hasta agotar (topado en MAX_MESSAGES para no
  // traer un historial infinito de un golpe) — mismo resultado que antes,
  // pero sin depender de un request gigante.
  const normalizeMessage = (m) => ({
    id:            m.id,
    fromId:        m.fromId,
    fromName:      m.from?.name  || "Usuario",
    fromAvatar:    m.from?.avatar || null,
    toId:          m.toId,
    toName:        m.to?.name    || "Usuario",
    toAvatar:      m.to?.avatar || null,
    propertyId:    m.propertyId,
    propertyTitle: m.property?.title || "",
    text:          m.text,
    replyToId:     m.replyToId,
    createdAt:     m.createdAt,
    read:          m.read,
    visit:         m.visit || null,
  });

  const fetchMessages = useCallback(async () => {
    if (!currentUser) return;
    setLoadingMessages(true);
    try {
      const all = [];
      let cursor;
      for (let i = 0; i < 10; i++) { // 10 páginas × 500 = techo de 5000 mensajes
        const params = new URLSearchParams({ limit: "500" });
        if (cursor) params.set("cursor", cursor);
        const res = await fetch(`${API_URL}/api/messages?${params}`, {
          credentials: "include",
        });
        if (!res.ok) break;
        const data = await res.json();
        all.push(...data.messages.map(normalizeMessage));
        if (!data.pagination?.hasMore || !data.pagination?.nextCursor) break;
        cursor = data.pagination.nextCursor;
      }
      setMessages(all);
    } catch (err) {
      console.error("fetchMessages error:", err);
    } finally {
      setLoadingMessages(false);
    }
  }, [currentUser]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);

  // Calcular no leídos
  useEffect(() => {
    if (!currentUser) return;
    const count = messages.filter((m) => m.toId === currentUser.id && !m.read).length;
    setUnreadCount(count);
  }, [messages, currentUser]);

  // ── WEBSOCKET ───────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) return;

    // El navegador manda la cookie httpOnly sola en el handshake — no hace
    // falta (ni se puede) leer el token en JS para autenticar el socket.
    const socket = io(API_URL, {
      withCredentials: true,
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 2000,
    });

    // Nuevo mensaje entrante — agregarlo al estado inmediatamente
    socket.on("new_message", (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.id);
        if (exists) return prev;
        return [msg, ...prev];
      });
      setUnreadCount((n) => n + 1);
      playMessageSound();
      // Notificación del navegador
      if (Notification.permission === "granted") {
        new Notification(`Nuevo mensaje de ${msg.fromName}`, {
          body: msg.text,
          icon: "/favicon.ico",
        });
      }
    });

    // Confirmación de mensaje enviado (reemplaza el temporal)
    socket.on("message_sent", (msg) => {
      setMessages((prev) => {
        const exists = prev.some((m) => m.id === msg.id);
        if (exists) return prev;
        // Reemplazar el temp si existe
        const withoutTemp = prev.filter((m) => !m.id.startsWith("temp-"));
        return [msg, ...withoutTemp];
      });
    });

    socketRef.current = socket;
    return () => { socket.disconnect(); socketRef.current = null; };
  }, [currentUser, playMessageSound]);

  // ── PEDIR PERMISO NOTIFICACIONES ───────────────────────────────────────────
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  // ── ENVIAR ─────────────────────────────────────────────────────────────────
  const sendMessage = useCallback(async ({ fromId, fromName, fromAvatar, toId, toName, toAvatar, propertyId, propertyTitle, text, replyToId = null }) => {
    const tempMsg = {
      id: `temp-${Date.now()}`,
      fromId, fromName, fromAvatar, toId, toName, toAvatar,
      propertyId, propertyTitle, text, replyToId,
      createdAt: new Date().toISOString(),
      read: false,
    };
    setMessages((prev) => [tempMsg, ...prev]);

    try {
      const res  = await fetch(`${API_URL}/api/messages`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
        body: JSON.stringify({ toId, propertyId, text, replyToId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      const real = {
        id:            data.message.id,
        fromId:        data.message.fromId,
        fromName:      data.message.from?.name  || fromName,
        fromAvatar:    data.message.from?.avatar || fromAvatar || null,
        toId:          data.message.toId,
        toName:        data.message.to?.name    || toName,
        toAvatar:      data.message.to?.avatar   || toAvatar || null,
        propertyId:    data.message.propertyId,
        propertyTitle: data.message.property?.title || propertyTitle,
        text:          data.message.text,
        replyToId:     data.message.replyToId,
        createdAt:     data.message.createdAt,
        read:          false,
      };
      // Reemplazar el temp por el real
      setMessages((prev) => prev.map((m) => m.id === tempMsg.id ? real : m));
      return real;
    } catch (err) {
      console.error("sendMessage error:", err);
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      return null;
    }
  }, []);

  // ── RESPONDER ──────────────────────────────────────────────────────────────
  const replyMessage = useCallback(async ({ originalMsg, fromId, fromName, fromAvatar, text }) => {
    return sendMessage({
      fromId, fromName, fromAvatar,
      toId:          originalMsg.fromId,
      toName:        originalMsg.fromName,
      toAvatar:      originalMsg.fromAvatar,
      propertyId:    originalMsg.propertyId,
      propertyTitle: originalMsg.propertyTitle,
      text,
      replyToId: originalMsg.id,
    });
  }, [sendMessage]);

  // ── MARCAR LEÍDO ───────────────────────────────────────────────────────────
  const markAsRead = useCallback(async (id) => {
    setMessages((prev) => prev.map((m) => m.id === id ? { ...m, read: true } : m));
    setUnreadCount((n) => Math.max(0, n - 1));
    try {
      await fetch(`${API_URL}/api/messages/${id}/read`, {
        method: "PATCH",
        credentials: "include",
        headers: CSRF_HEADERS,
      });
    } catch (err) {
      console.error("markAsRead error:", err);
    }
  }, []);

  // ── ELIMINAR ───────────────────────────────────────────────────────────────
  const deleteMessage = useCallback(async (id) => {
    setMessages((prev) => prev.filter((m) => m.id !== id));
    try {
      await fetch(`${API_URL}/api/messages/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: CSRF_HEADERS,
      });
    } catch (err) {
      console.error("deleteMessage error:", err);
    }
  }, []);

  // ── VISITAS DESDE EL DM ─────────────────────────────────────────────────────
  // Confirmar/cancelar/completar una visita directo desde el hilo. El backend
  // crea el mensaje de DM correspondiente, así que recargamos los mensajes
  // para reflejar el nuevo estado y la confirmación del hilo al instante.
  const updateVisitStatus = useCallback(async (visitId, status) => {
    const res = await fetch(`${API_URL}/api/visits/${visitId}/status`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...CSRF_HEADERS },
      body: JSON.stringify({ status }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "No se pudo actualizar la visita.");
    await fetchMessages();
    return data.visit;
  }, [fetchMessages]);

  // ── HELPERS ────────────────────────────────────────────────────────────────
  const getInbox  = useCallback((userId) => messages.filter((m) => m.toId   === userId), [messages]);
  const getSent   = useCallback((userId) => messages.filter((m) => m.fromId === userId), [messages]);
  const getUnreadCount = useCallback((userId) =>
    messages.filter((m) => m.toId === userId && !m.read).length, [messages]);

  const getConversations = useCallback((userId) => {
    const relevant = messages.filter((m) => m.fromId === userId || m.toId === userId);
    const convMap  = {};
    relevant.forEach((m) => {
      const otherId     = m.fromId === userId ? m.toId       : m.fromId;
      const otherName   = m.fromId === userId ? m.toName     : m.fromName;
      const otherAvatar = m.fromId === userId ? m.toAvatar   : m.fromAvatar;
      const key = `${[userId, otherId].sort().join("-")}-${m.propertyId}`;
      if (!convMap[key]) {
        convMap[key] = { key, otherId, otherName, otherAvatar, propertyId: m.propertyId, propertyTitle: m.propertyTitle, messages: [], unread: 0 };
      }
      convMap[key].messages.push(m);
      if (m.toId === userId && !m.read) convMap[key].unread++;
    });
    return Object.values(convMap).sort(
      (a, b) => new Date(b.messages[0].createdAt) - new Date(a.messages[0].createdAt)
    );
  }, [messages]);

  return (
    <InboxContext.Provider value={{
      messages, loadingMessages, unreadCount,
      fetchMessages, sendMessage, replyMessage,
      markAsRead, deleteMessage, updateVisitStatus,
      getInbox, getSent, getUnreadCount, getConversations,
    }}>
      {children}
    </InboxContext.Provider>
  );
}

export function useInbox() {
  return useContext(InboxContext);
}