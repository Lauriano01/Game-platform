"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  query,
  where,
  onSnapshot,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { useRouter } from "next/navigation";

type Chat = {
  id: string;
  users?: string[];
  lastMessage?: string;
};

export default function MessagesPage() {
  const router = useRouter();

  const [chats, setChats] = useState<Chat[]>([]);
  const [usersMap, setUsersMap] = useState<Record<string, any>>({});
  const [unreadMap, setUnreadMap] = useState<Record<string, boolean>>({});

  const userId: string | undefined = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) {
      return;
    }

    const conversationsRef = collection(db, "conversations");

    const q = query(
      conversationsRef,
      where("users", "array-contains", userId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList: Chat[] = [];

      for (const chatDoc of snapshot.docs) {
        chatList.push({
          id: chatDoc.id,
          ...(chatDoc.data() as any),
        });
      }

      setChats(chatList);

      const newUsersMap: Record<string, any> = {};
      const newUnreadMap: Record<string, boolean> = {};

      for (const chat of chatList) {
        let otherUserId: string | undefined;

        if (chat.users) {
          for (const id of chat.users) {
            if (id !== userId) {
              otherUserId = id;
              break;
            }
          }
        }

        if (otherUserId) {
          const userRef = doc(db, "users", otherUserId);
          const userSnapshot = await getDoc(userRef);

          if (userSnapshot.exists()) {
            newUsersMap[otherUserId] = userSnapshot.data();
          }
        }

        const messagesRef = collection(
          db,
          "conversations",
          chat.id,
          "messages"
        );

        const messagesSnapshot = await getDocs(messagesRef);

        let hasUnreadMessage = false;

        for (const messageDoc of messagesSnapshot.docs) {
          const messageData = messageDoc.data();

          if (
            messageData.senderId !== userId &&
            messageData.seen === false
          ) {
            hasUnreadMessage = true;
            break;
          }
        }

        newUnreadMap[chat.id] = hasUnreadMessage;
      }

      setUsersMap(newUsersMap);
      setUnreadMap(newUnreadMap);
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  const openChat = (chatId: string) => {
    router.push("/chat/" + chatId);
  };

  return (
    <div>
      <h1 className="text-4xl text-center mb-8">
        💬 Mensagens
      </h1>

      {/* BOTÃO VOLTAR PARA HOME */}
      <div className="flex justify-center mb-6">
        <button
          onClick={() => router.push("/home")}
          className="bg-red-600 px-4 py-2 rounded hover:bg-red-700 transition"
        >
          Voltar
        </button>
      </div>

      {!userId && (
        <p className="text-gray-400">
          Precisas estar logado para ver mensagens.
        </p>
      )}

      {chats.length === 0 && userId && (
        <p className="text-gray-400">
          Ainda não tens conversas.
        </p>
      )}

      <div className="space-y-4">
        {chats.map((chat) => {
          let otherUserId: string | undefined;

          if (chat.users) {
            for (const id of chat.users) {
              if (id !== userId) {
                otherUserId = id;
                break;
              }
            }
          }

          const otherUser = usersMap[otherUserId || ""];

          return (
            <div
              key={chat.id}
              onClick={() => openChat(chat.id)}
              className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition flex items-center gap-3"
            >
              <img
                src={
                  otherUser?.profilePic ||
                  "https://via.placeholder.com/40"
                }
                className="w-10 h-10 rounded-full object-cover"
                alt="Foto de perfil"
              />

              <div className="flex-1">
                <p className="font-semibold">
                  Conversa com:{" "}
                  {otherUser?.name || "Utilizador"}
                </p>

                {chat.lastMessage && (
                  <p className="text-sm text-gray-400">
                    {chat.lastMessage}
                  </p>
                )}
              </div>

              {unreadMap[chat.id] && (
                <span
                  className="w-3 h-3 bg-red-500 rounded-full flex-shrink-0"
                  title="Mensagem não lida"
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
