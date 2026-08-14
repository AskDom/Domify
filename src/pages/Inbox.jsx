import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Seo from "../components/Seo";
import { useInbox } from "../context/InboxContext";
import { useAuth } from "../context/AuthContext";

function Avatar({ name, src, size = "w-10 h-10", text = "text-sm" }) {
  const initial = name?.charAt(0).toUpperCase() || "?";
  const colors  = ["bg-blue-500","bg-emerald-500","bg-violet-500","bg-rose-500","bg-amber-500"];
  const color   = colors[initial.charCodeAt(0) % colors.length];
  if (src) {
    return <img src={src} alt={name} className={`${size} rounded-full object-cover flex-shrink-0`} />;
  }
  return (
    <div className={`${size} ${color} ${text} rounded-full flex items-center justify-center text-white font-bold flex-shrink-0`}>
      {initial}
    </div>
  );
}

function TimeAgo({ date }) {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1)  return <span>ahora</span>;
  if (mins < 60) return <span>hace {mins}m</span>;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return <span>hace {hrs}h</span>;
  return <span>{new Date(date).toLocaleDateString("es-DO", { month: "short", day: "numeric" })}</span>;
}

export default function Inbox() {
  const { currentUser } = useAuth();
  const { getConversations, markAsRead, deleteMessage, sendMessage, fetchMessages, loadingMessages, unreadCount } = useInbox();

  const [selectedKey, setSelectedKey] = useState(null);
  const [replyText,   setReplyText]   = useState("");
  const [sending,     setSending]     = useState(false);
  const [search,      setSearch]      = useState("");
  const [confirmDeleteConv, setConfirmDeleteConv] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef       = useRef(null);

  // Todos los hooks ANTES de cualquier return condicional
  const allConversations = currentUser ? getConversations(currentUser.id) : [];
  const conversations    = allConversations.filter((c) =>
    !search || c.otherName.toLowerCase().includes(search.toLowerCase()) ||
    c.propertyTitle.toLowerCase().includes(search.toLowerCase())
  );
  const selectedConv = conversations.find((c) => c.key === selectedKey) || allConversations.find((c) => c.key === selectedKey);

  // Marcar como leídos al abrir conversación
  useEffect(() => {
    setConfirmDeleteConv(false);
    if (!selectedConv || !currentUser) return;
    selectedConv.messages
      .filter((m) => m.toId === currentUser.id && !m.read)
      .forEach((m) => markAsRead(m.id));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedKey]);

  // Scroll al último mensaje
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [selectedConv?.messages?.length]);

  // Focus en el input al abrir conversación
  useEffect(() => {
    if (selectedKey) setTimeout(() => inputRef.current?.focus(), 100);
  }, [selectedKey]);

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col">
        <Navbar />
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
          <p className="text-5xl">🔒</p>
          <p className="text-gray-600 dark:text-gray-400 font-semibold">Inicia sesión para ver tus mensajes</p>
          <Link to="/" className="text-blue-600 text-sm font-semibold hover:underline">← Volver al inicio</Link>
        </div>
      </div>
    );
  }

  const handleSend = async () => {
    if (!replyText.trim() || !selectedConv || sending) return;
    setSending(true);
    const text = replyText.trim();
    setReplyText("");
    await sendMessage({
      fromId:        currentUser.id,
      fromName:      currentUser.name,
      fromAvatar:    currentUser.avatar,
      toId:          selectedConv.otherId,
      toName:        selectedConv.otherName,
      toAvatar:      selectedConv.otherAvatar,
      propertyId:    selectedConv.propertyId,
      propertyTitle: selectedConv.propertyTitle,
      text,
    });
    setSending(false);
  };

  const sortedMessages = selectedConv
    ? [...selectedConv.messages].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];

  return (
    <div className="h-screen flex flex-col bg-white dark:bg-gray-950 overflow-hidden">
      <Seo title="Mensajes" noindex />
      <Navbar />

      <div className="flex-1 flex overflow-hidden">

        {/* ── SIDEBAR ── */}
        <div className={`w-full md:w-80 lg:w-96 flex flex-col border-r border-gray-100 dark:border-gray-800 ${selectedKey ? "hidden md:flex" : "flex"}`}>

          {/* Header sidebar */}
          <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-xl font-black text-gray-900 dark:text-white">
                Mensajes
                {unreadCount > 0 && (
                  <span className="ml-2 bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </h1>
              <button
                onClick={fetchMessages}
                disabled={loadingMessages}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-400"
              >
                <svg className={`w-4 h-4 ${loadingMessages ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
              </button>
            </div>

            {/* Buscador */}
            <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 rounded-xl px-3 py-2">
              <svg className="w-4 h-4 text-gray-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                type="text"
                placeholder="Buscar conversación..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none w-full"
              />
            </div>
          </div>

          {/* Lista de conversaciones */}
          <div className="flex-1 overflow-y-auto">
            {loadingMessages ? (
              <div className="space-y-1 p-2">
                {[1,2,3].map((i) => (
                  <div key={i} className="flex gap-3 p-3 rounded-xl animate-pulse">
                    <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0"/>
                    <div className="flex-1 space-y-2 py-1">
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3"/>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-1/2"/>
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6 py-12">
                <p className="text-4xl mb-3">💬</p>
                <p className="font-semibold text-gray-700 dark:text-gray-300 text-sm">
                  {search ? "Sin resultados" : "No tienes mensajes"}
                </p>
                <p className="text-gray-400 text-xs mt-1">
                  {search ? "Intenta con otro término" : "Los mensajes de tus propiedades aparecerán aquí"}
                </p>
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {conversations.map((conv) => {
                  const lastMsg  = [...conv.messages].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0];
                  const isActive = conv.key === selectedKey;
                  const hasUnread = conv.unread > 0;
                  return (
                    <motion.button
                      key={conv.key}
                      onClick={() => setSelectedKey(conv.key)}
                      whileHover={{ backgroundColor: "rgba(0,0,0,0.04)" }}
                      className={`w-full flex items-center gap-3 px-3 py-3.5 rounded-2xl text-left transition-all ${
                        isActive
                          ? "bg-gray-100 dark:bg-gray-800"
                          : ""
                      }`}
                    >
                      <div className="relative">
                        <Avatar name={conv.otherName} src={conv.otherAvatar} size="w-12 h-12" />
                        {hasUnread && (
                          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-blue-600 rounded-full border-2 border-white dark:border-gray-950 flex items-center justify-center text-white text-[9px] font-black">
                            {conv.unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className={`text-sm truncate ${hasUnread ? "font-black text-gray-900 dark:text-white" : "font-semibold text-gray-700 dark:text-gray-200"}`}>
                            {conv.otherName}
                          </p>
                          <span className="text-[11px] text-gray-400 flex-shrink-0">
                            <TimeAgo date={lastMsg?.createdAt} />
                          </span>
                        </div>
                        <p className="text-xs text-blue-500 dark:text-blue-400 truncate mt-0.5 font-medium">
                          {conv.propertyTitle}
                        </p>
                        <p className={`text-xs truncate mt-0.5 ${hasUnread ? "text-gray-700 dark:text-gray-300 font-semibold" : "text-gray-400"}`}>
                          {lastMsg?.fromId === currentUser.id ? "Tú: " : ""}{lastMsg?.text}
                        </p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── PANEL DE CHAT ── */}
        <div className={`flex-1 flex flex-col ${!selectedKey ? "hidden md:flex" : "flex"}`}>
          {!selectedConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
              <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-3xl mb-4">
                💬
              </div>
              <p className="font-bold text-gray-700 dark:text-gray-200 text-lg">Tus mensajes</p>
              <p className="text-gray-400 text-sm mt-1 max-w-xs">Selecciona una conversación para ver los mensajes</p>
            </div>
          ) : (
            <>
              {/* Header del chat */}
              <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-950">
                <button
                  onClick={() => setSelectedKey(null)}
                  className="md:hidden w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-500"
                >
                  ←
                </button>
                <Avatar name={selectedConv.otherName} src={selectedConv.otherAvatar} size="w-10 h-10" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-gray-900 dark:text-white text-sm">{selectedConv.otherName}</p>
                  <Link
                    to={`/property/${selectedConv.propertyId}`}
                    className="text-xs text-blue-500 hover:underline truncate block"
                  >
                    {selectedConv.propertyTitle}
                  </Link>
                </div>
                {confirmDeleteConv ? (
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-red-500 text-xs font-medium hidden sm:inline">¿Eliminar?</span>
                    <button
                      onClick={() => {
                        selectedConv.messages.forEach((m) => {
                          if (m.toId === currentUser.id) deleteMessage(m.id);
                        });
                        setSelectedKey(null);
                      }}
                      className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2.5 py-1.5 rounded-lg transition"
                    >
                      Sí
                    </button>
                    <button
                      onClick={() => setConfirmDeleteConv(false)}
                      className="text-xs font-medium text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 px-2 py-1.5 rounded-lg transition"
                    >
                      No
                    </button>
                  </span>
                ) : (
                  <button
                    onClick={() => setConfirmDeleteConv(true)}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition text-gray-400 hover:text-red-500"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto px-5 py-6 space-y-3">
                <AnimatePresence initial={false}>
                  {sortedMessages.map((msg) => {
                    const isMe = msg.fromId === currentUser.id;
                    const isTemp = msg.id?.startsWith("temp-");
                    return (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ duration: 0.2 }}
                        className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : "flex-row"}`}
                      >
                        {!isMe && <Avatar name={msg.fromName} src={msg.fromAvatar} size="w-8 h-8" text="text-xs" />}

                        <div className={`max-w-[72%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-1`}>
                          <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                            isMe
                              ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-tr-md"
                              : "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-md"
                          } ${isTemp ? "opacity-60" : ""}`}>
                            {msg.text}
                          </div>
                          <div className={`flex items-center gap-1.5 ${isMe ? "flex-row-reverse" : ""}`}>
                            <span className="text-[11px] text-gray-400">
                              <TimeAgo date={msg.createdAt} />
                            </span>
                            {isMe && !isTemp && (
                              <svg className="w-3 h-3 text-blue-500" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            )}
                            {isTemp && (
                              <svg className="w-3 h-3 text-gray-400 animate-spin" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"/>
                              </svg>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input */}
              <div className="px-5 py-4 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-950">
                <div className="flex items-end gap-3 bg-gray-100 dark:bg-gray-800 rounded-2xl px-4 py-3">
                  <textarea
                    ref={inputRef}
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
                    }}
                    placeholder="Escribe un mensaje..."
                    rows={1}
                    style={{ resize: "none", maxHeight: 120 }}
                    className="flex-1 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 outline-none leading-relaxed"
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
                    }}
                  />
                  <motion.button
                    onClick={handleSend}
                    disabled={!replyText.trim() || sending}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all disabled:opacity-30"
                    style={{ background: replyText.trim() ? "#111827" : "#d1d5db" }}
                  >
                    <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M12 5l7 7-7 7"/>
                    </svg>
                  </motion.button>
                </div>
                <p className="text-center text-[11px] text-gray-300 dark:text-gray-600 mt-2">
                  Enter para enviar · Shift+Enter para nueva línea
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}