"use client";

import React, { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc, updateDoc, setDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { User } from "../../../types";

const ProfilePage = () => {
  const { userId } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});

  const currentUser = auth.currentUser;
  const isOwnProfile = currentUser?.uid === userId;

  // carregar user
  useEffect(() => {
    if (!userId || Array.isArray(userId)) return;

    const loadUser = async () => {
      const refDoc = doc(db, "users", userId);
      const snap = await getDoc(refDoc);

      if (snap.exists()) {
        const data = snap.data();
        setUser(data as User);
        setFormData(data);
      }

      setLoading(false);
    };

    loadUser();
  }, [userId]);

  // salvar edição
  const handleSave = async () => {
    if (!userId || Array.isArray(userId)) return;

    await updateDoc(doc(db, "users", userId), formData);

    setUser(formData as User);
    setIsEditing(false);
  };

  const handleBack = () => router.push("/");
  const handleOpenPicTest = () => router.push(`/PicTest?userId=${userId}`);

  // 💬 CRIAR OU ABRIR CHAT
  const handleStartChat = async () => {
    if (!currentUser?.uid || !userId || Array.isArray(userId)) return;

    const myId = currentUser.uid;
    const otherId = userId as string;

    const chatId =
      myId < otherId ? `${myId}_${otherId}` : `${otherId}_${myId}`;

    const chatRef = doc(db, "conversations", chatId);

    await setDoc(
      chatRef,
      {
        users: [myId, otherId],
        createdAt: new Date(),
      },
      { merge: true }
    );

    router.push(`/chat/${chatId}`);
  };

  if (loading) return <div className="text-white">Carregando...</div>;
  if (!user) return <div className="text-white">Usuário não encontrado</div>;

  return (
    <div className="bg-gray-900 text-white p-8 min-h-screen">

      <h1 className="text-4xl text-center mb-8">👤 Perfil</h1>

      {/* FOTO */}
      <div className="flex flex-col items-center mb-6">

        <img
          src={user.profilePic || "https://via.placeholder.com/150"}
          className="w-32 h-32 rounded-full border-4 border-gray-600 object-cover"
        />

        {isOwnProfile && (
          <button
            onClick={handleOpenPicTest}
            className="mt-3 bg-blue-600 px-4 py-2 rounded"
          >
            📷 Atualizar Foto/Video
          </button>
        )}
      </div>

      {/* BOTÃO CHAT */}
      {!isOwnProfile && (
        <div className="flex justify-center mb-6">
          <button
            onClick={handleStartChat}
            className="bg-green-600 px-6 py-2 rounded-lg hover:bg-green-700 transition"
          >
            💬✨ Enviar mensagem
          </button>
        </div>
      )}

      {/* CAMPOS */}
      <div className="max-w-md mx-auto space-y-4">

        <div>
          <strong>Nome:</strong>
          {isEditing ? (
            <input
              value={formData.name || ""}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full p-2 bg-gray-800"
            />
          ) : (
            <p>{user.name}</p>
          )}
        </div>

        <div>
          <strong>Idade:</strong>
          {isEditing ? (
            <input
              value={formData.age || ""}
              onChange={(e) =>
                setFormData({ ...formData, age: e.target.value })
              }
              className="w-full p-2 bg-gray-800"
            />
          ) : (
            <p>{user.age}</p>
          )}
        </div>

        <div>
          <strong>Localização:</strong>
          {isEditing ? (
            <input
              value={formData.location || ""}
              onChange={(e) =>
                setFormData({ ...formData, location: e.target.value })
              }
              className="w-full p-2 bg-gray-800"
            />
          ) : (
            <p>{user.location}</p>
          )}
        </div>

        <div>
          <strong>Preferência Sexual:</strong>
          {isEditing ? (
            <input
              value={formData.sexualPreference || ""}
              onChange={(e) =>
                setFormData({ ...formData, sexualPreference: e.target.value })
              }
              className="w-full p-2 bg-gray-800"
            />
          ) : (
            <p>{user.sexualPreference}</p>
          )}
        </div>

        <div>
          <strong>Interesses:</strong>
          {isEditing ? (
            <input
              value={(formData.interests || []).join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  interests: e.target.value.split(","),
                })
              }
              className="w-full p-2 bg-gray-800"
            />
          ) : (
            <p>{(user.interests || []).join(", ")}</p>
          )}
        </div>

        <div>
          <strong>Encontros:</strong>
          {isEditing ? (
            <input
              value={(formData.datePreference || []).join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  datePreference: e.target.value.split(","),
                })
              }
              className="w-full p-2 bg-gray-800"
            />
          ) : (
            <p>{(user.datePreference || []).join(", ")}</p>
          )}
        </div>

        <div>
          <strong>Pedidos:</strong>
          {isEditing ? (
            <input
              value={(formData.meetingRequest || []).join(", ")}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  meetingRequest: e.target.value.split(","),
                })
              }
              className="w-full p-2 bg-gray-800"
            />
          ) : (
            <p>{(user.meetingRequest || []).join(", ")}</p>
          )}
        </div>

      </div>

      {/* BOTÕES */}
      <div className="flex justify-end gap-4 mt-8">

        {isOwnProfile ? (
          isEditing ? (
            <button
              onClick={handleSave}
              className="bg-green-600 px-4 py-2 rounded"
            >
              Salvar
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 px-4 py-2 rounded"
            >
              Editar
            </button>
          )
        ) : null}

        <button
          onClick={handleBack}
          className="bg-red-600 px-4 py-2 rounded"
        >
          Voltar
        </button>

      </div>
    </div>
  );
};

export default ProfilePage;