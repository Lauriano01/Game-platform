
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
    <div className="min-h-screen bg-gray-100 text-gray-900 px-4 py-6 sm:px-6">
      
      {/* CONTAINER PRINCIPAL */}
      <div className="max-w-2xl mx-auto">

        {/* CABEÇALHO */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-5 py-5 mb-5">
          <div className="flex items-center justify-between gap-4">

            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                💬 Mensagens
              </h1>

              <p className="text-sm text-gray-500 mt-1">
                As tuas conversas
              </p>
            </div>

            {/* BOTÃO VOLTAR PARA HOME */}
            <button
              onClick={() => router.push("/home")}
              className="bg-[#1877F2] text-white px-4 py-2 rounded-xl font-medium hover:bg-[#166FE5] active:scale-95 transition-all shadow-sm"
            >
              Voltar
            </button>

          </div>
        </div>

        {/* SEM LOGIN */}
        {!userId && (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 text-center shadow-sm">
            <div className="text-4xl mb-3">🔐</div>

            <p className="text-gray-600">
              Precisas estar logado para ver mensagens.
            </p>
          </div>
        )}

        {/* SEM CONVERSAS */}
        {chats.length === 0 && userId && (
          <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-sm">
            <div className="text-5xl mb-4">
              💬
            </div>

            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Ainda não tens conversas
            </h2>

            <p className="text-sm text-gray-500">
              Quando começares uma conversa, ela aparecerá aqui.
            </p>
          </div>
        )}

        {/* LISTA DE CONVERSAS */}
        <div className="space-y-3">

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
            const isUnread = unreadMap[chat.id];

            return (
              <div
                key={chat.id}
                onClick={() => openChat(chat.id)}
                className={`group relative bg-white rounded-2xl cursor-pointer border transition-all duration-200 flex items-center gap-4 p-4 shadow-sm hover:shadow-md hover:-translate-y-[1px] ${
                  isUnread
                    ? "border-[#1877F2]/30 bg-blue-50/40"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >

                {/* LINHA AZUL PARA MENSAGEM NÃO LIDA */}
                {isUnread && (
                  <div className="absolute left-0 top-4 bottom-4 w-1 bg-[#1877F2] rounded-r-full" />
                )}

                {/* FOTO */}
                <div className="relative flex-shrink-0">

                  <img
                    src={
                      otherUser?.profilePic ||
                      "https://via.placeholder.com/40"
                    }
                    className={`w-14 h-14 rounded-full object-cover border-2 ${
                      isUnread
                        ? "border-[#1877F2]"
                        : "border-gray-200"
                    }`}
                    alt="Foto de perfil"
                  />

                  {/* INDICADOR DE NÃO LIDA */}
                  {isUnread && (
                    <span className="absolute -right-1 -bottom-1 w-4 h-4 bg-[#1877F2] border-2 border-white rounded-full" />
                  )}

                </div>

                {/* INFORMAÇÕES */}
                <div className="flex-1 min-w-0">

                  <div className="flex items-center justify-between gap-3">

                    <p
                      className={`truncate ${
                        isUnread
                          ? "font-bold text-gray-950"
                          : "font-semibold text-gray-800"
                      }`}
                    >
                      {otherUser?.name || "Utilizador"}
                    </p>

                    {isUnread && (
                      <span className="flex-shrink-0 text-xs font-semibold text-[#1877F2]">
                        Nova
                      </span>
                    )}

                  </div>

                  {chat.lastMessage && (
                    <p
                      className={`text-sm truncate mt-1 ${
                        isUnread
                          ? "font-semibold text-gray-800"
                          : "font-normal text-gray-500"
                      }`}
                    >
                      {chat.lastMessage}
                    </p>
                  )}

                </div>

                {/* SETA */}
                <div className="text-gray-300 group-hover:text-[#1877F2] transition-colors text-xl">
                  ›
                </div>

              </div>
            );
          })}

        </div>

      </div>
    </div>
  );
}
