"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { db, auth } from "@/lib/firebase";

import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  setDoc,
  getDoc,
  updateDoc,
} from "firebase/firestore";

export default function ChatPage() {
  const { chatId } = useParams();

  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [chatUser, setChatUser] = useState<any>(null);

  const [showEmoji, setShowEmoji] = useState(false);

  const emojis = ["😂", "❤️", "🔥", "👍", "😢", "😍", "🙏", "😎"];

  // AUTH
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      if (user) setUserId(user.uid);
      else setUserId(null);
    });

    return () => unsub();
  }, []);

  // MESSAGES
  useEffect(() => {
    if (!chatId || !userId) return;

    const q = query(
      collection(db, "conversations", chatId as string, "messages"),
      orderBy("createdAt")
    );

    return onSnapshot(q, async (snapshot) => {
      const loadedMessages = snapshot.docs.map((messageDoc) => ({
        id: messageDoc.id,
        ...messageDoc.data(),
      }));

      setMessages(loadedMessages);

      // Marca como vistas as mensagens recebidas
      // que ainda estavam como seen: false
      const unreadMessages = snapshot.docs.filter((messageDoc) => {
        const data = messageDoc.data();

        return data.senderId !== userId && data.seen === false;
      });

      if (unreadMessages.length > 0) {
        try {
          await Promise.all(
            unreadMessages.map((messageDoc) =>
              updateDoc(
                doc(
                  db,
                  "conversations",
                  chatId as string,
                  "messages",
                  messageDoc.id
                ),
                {
                  seen: true,
                }
              )
            )
          );
        } catch (error) {
          console.error(
            "Erro ao marcar mensagens como vistas:",
            error
          );
        }
      }
    });
  }, [chatId, userId]);

  // BUSCAR NOME DA PESSOA DO CHAT
  useEffect(() => {
    const loadUser = async () => {
      if (!chatId || !userId) return;

      const ids = (chatId as string).split("_");

      const otherUserId = ids.find((id) => id !== userId);

      if (!otherUserId) return;

      const userRef = doc(db, "users", otherUserId);
      const snap = await getDoc(userRef);

      if (snap.exists()) {
        setChatUser(snap.data());
      }
    };

    loadUser();
  }, [chatId, userId]);

  // ONLINE STATUS
  useEffect(() => {
    if (!userId || !chatId) return;

    const statusRef = doc(
      db,
      "conversations",
      chatId as string,
      "status",
      userId
    );

    setDoc(statusRef, {
      online: true,
      lastSeen: serverTimestamp(),
    });

    const interval = setInterval(() => {
      setDoc(statusRef, {
        online: true,
        lastSeen: serverTimestamp(),
      });
    }, 15000);

    return () => {
      setDoc(statusRef, {
        online: false,
        lastSeen: serverTimestamp(),
      });

      clearInterval(interval);
    };
  }, [userId, chatId]);

  // SEND MESSAGE
  const sendMessage = async () => {
    if (!text.trim() || !userId || !chatId) return;

    await addDoc(
      collection(db, "conversations", chatId as string, "messages"),
      {
        text,
        senderId: userId,
        createdAt: serverTimestamp(),
        seen: false,
      }
    );

    setText("");
  };

  // EMOJI
  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">

      {/* HEADER MELHORADO */}
      <div className="p-4 border-b border-gray-700">
        <h1 className="text-xl font-bold">
          💬 {chatUser?.name || "Chat"}
        </h1>

        <p className="text-xs text-green-400">
          🟢 online agora
        </p>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg) => {
          const isMe = msg.senderId === userId;

          return (
            <div
              key={msg.id}
              className={`flex ${
                isMe ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`p-3 rounded-lg max-w-xs ${
                  isMe ? "bg-green-600" : "bg-gray-700"
                }`}
              >
                <div>{msg.text}</div>

                {isMe && (
                  <div className="text-xs text-white/70 text-right">
                    {msg.seen ? "visto ✓✓" : "enviado ✓"}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* EMOJI */}
      {showEmoji && (
        <div className="p-2 flex gap-2 flex-wrap bg-gray-800 border-t border-gray-700">
          {emojis.map((e) => (
            <button
              key={e}
              onClick={() => addEmoji(e)}
              className="text-xl"
            >
              {e}
            </button>
          ))}
        </div>
      )}

      {/* INPUT */}
      <div className="p-4 border-t border-gray-700 flex gap-2 items-center">

        <button
          onClick={() => setShowEmoji(!showEmoji)}
          className="text-xl"
        >
          😊
        </button>

        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="flex-1 p-2 bg-gray-800 rounded"
          placeholder="Escreve mensagem..."
        />

        <button
          onClick={sendMessage}
          className="bg-blue-600 px-4 py-2 rounded"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}