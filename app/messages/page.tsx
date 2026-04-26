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
  const [usersMap, setUsersMap] = useState<any>({}); // cache de nomes
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    const q = query(
      collection(db, "conversations"),
      where("users", "array-contains", userId)
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const data: Chat[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      }));

      setChats(data);

      // buscar dados do outro usuário
      const newMap: any = {};

      for (const chat of data) {
        const otherUserId = chat.users?.find((u) => u !== userId);

        if (otherUserId && !usersMap[otherUserId]) {
          const userRef = doc(db, "users", otherUserId);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            newMap[otherUserId] = snap.data();
          }
        }
      }

      setUsersMap((prev: any) => ({ ...prev, ...newMap }));
    });

    return () => unsubscribe();
  }, [userId]);

  const openChat = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">

      <h1 className="text-3xl font-bold mb-6">💬 Mensagens</h1>

      {!userId && (
        <p className="text-gray-400">
          Precisas estar logado para ver mensagens.
        </p>
      )}

      {chats.length === 0 && userId && (
        <p className="text-gray-400">Ainda não tens conversas.</p>
      )}

      <div className="space-y-4">
        {chats.map((chat) => {
          const otherUserId = chat.users?.find(
            (u) => u !== userId
          );

          const otherUser = usersMap[otherUserId || ""];

          return (
            <div
              key={chat.id}
              onClick={() => openChat(chat.id)}
              className="bg-gray-800 p-4 rounded-lg cursor-pointer hover:bg-gray-700 transition flex items-center gap-3"
            >
              {/* FOTO */}
              <img
                src={
                  otherUser?.profilePic ||
                  "https://via.placeholder.com/40"
                }
                className="w-10 h-10 rounded-full object-cover"
              />

              <div>
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
            </div>
          );
        })}
      </div>
    </div>
  );
}