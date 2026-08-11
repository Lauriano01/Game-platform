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

  // VOLTAR PARA HOME
  const handleBack = () => router.push("/home");

  const handleOpenPicTest = () =>
    router.push(`/PicTest?userId=${userId}`);

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

  if (loading) return <>Carregando...</>;
  if (!user) return <>Usuário não encontrado</>;

  return (
    <div>
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
              className="w-full p-2 bg-white text-black rounded"
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
              className="w-full p-2 bg-white text-black rounded"
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
              className="w-full p-2 bg-white text-black rounded"
            />
          ) : (
            <p>{user.location}</p>
          )}
        </div>

        {/* PREFERÊNCIA SEXUAL */}
        <div>
          <strong>Preferência Sexual:</strong>
          {isEditing ? (
            <select
              value={formData.sexualPreference || ""}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  sexualPreference: e.target.value,
                })
              }
              className="w-full p-2 bg-white text-black rounded"
            >
              <option value="">Selecione uma opção</option>
              <option value="Heterossexual">Heterossexual</option>
              <option value="Homossexual">Homossexual</option>
              <option value="Gay">Gay</option>
              <option value="Lésbica">Lésbica</option>
              <option value="Bissexual">Bissexual</option>
              <option value="Outro">Outro</option>
              <option value="Prefiro não responder">
                Prefiro não responder
              </option>
            </select>
          ) : (
            <p>{user.sexualPreference}</p>
          )}
        </div>

        {/* INTERESSES */}
        <div>
          <strong>Interesses:</strong>
          {isEditing ? (
            <select
              multiple
              value={formData.interests || []}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  interests: Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  ),
                })
              }
              className="w-full p-2 bg-white text-black rounded"
              size={8}
            >
              <option value="💰 Dinheiro">💰 Dinheiro</option>
              <option value="🎉 Festas">🎉 Festas</option>
              <option value="🍻 Beber e sair">🍻 Beber e sair</option>
              <option value="💕 Encontros">💕 Encontros</option>
              <option value="❤️ Relacionamento sério">
                ❤️ Relacionamento sério
              </option>
              <option value="💬 Conhecer pessoas">
                💬 Conhecer pessoas
              </option>
              <option value="😏 Algo casual">😏 Algo casual</option>
              <option value="🔥 Encontro íntimo">
                🔥 Encontro íntimo
              </option>
              <option value="👫 Fazer amizades">
                👫 Fazer amizades
              </option>
              <option value="🌙 Sair à noite">🌙 Sair à noite</option>
              <option value="🍽️ Jantar/encontro romântico">
                🍽️ Jantar/encontro romântico
              </option>
              <option value="🎮 Jogar juntos">🎮 Jogar juntos</option>
              <option value="🎵 Concertos e eventos">
                🎵 Concertos e eventos
              </option>
              <option value="☕ Conversar/conhecer melhor">
                ☕ Conversar/conhecer melhor
              </option>
              <option value="💑 Namoro">💑 Namoro</option>
              <option value="💍 Casamento">💍 Casamento</option>
              <option value="🤝 Networking">🤝 Networking</option>
              <option value="🚫 Sem compromisso">
                🚫 Sem compromisso
              </option>
              <option value="❤️‍🔥 Relação aberta">
                ❤️‍🔥 Relação aberta
              </option>
              <option value="👥 Encontros em grupo">
                👥 Encontros em grupo
              </option>
            </select>
          ) : (
            <p>{(user.interests || []).join(", ")}</p>
          )}
        </div>

        {/* ENCONTROS */}
        <div>
          <strong>Encontros:</strong>
          {isEditing ? (
            <select
              multiple
              value={formData.datePreference || []}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  datePreference: Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  ),
                })
              }
              className="w-full p-2 bg-white text-black rounded"
              size={7}
            >
              <option value="🔒 Privado">🔒 Privado</option>
              <option value="🌆 Público">🌆 Público</option>
              <option value="🎬 Cinema">🎬 Cinema</option>
              <option value="🍽️ Restaurante">
                🍽️ Restaurante
              </option>
              <option value="🏖️ Praia">🏖️ Praia</option>
              <option value="🛍️ Shopping">🛍️ Shopping</option>
              <option value="🚗 Passeio">🚗 Passeio</option>
              <option value="🏠 Casa">🏠 Casa</option>
            </select>
          ) : (
            <p>{(user.datePreference || []).join(", ")}</p>
          )}
        </div>

        {/* PEDIDOS */}
        <div>
          <strong>Pedidos:</strong>
          {isEditing ? (
            <select
              multiple
              value={formData.meetingRequest || []}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  meetingRequest: Array.from(
                    e.target.selectedOptions,
                    (option) => option.value
                  ),
                })
              }
             className="w-full p-2 bg-white text-black rounded"
              size={8}
            >
              <option value="❤️ Respeito">❤️ Respeito</option>
              <option value="😊 Bondade">😊 Bondade</option>
              <option value="🤝 Honestidade">🤝 Honestidade</option>
              <option value="💬 Boa conversa">💬 Boa conversa</option>
              <option value="😂 Diversão">😂 Diversão</option>
              <option value="🥰 Carinho">🥰 Carinho</option>
              <option value="🧠 Boa conexão">🧠 Boa conexão</option>
              <option value="👂 Saber ouvir">👂 Saber ouvir</option>
              <option value="🌹 Romantismo">🌹 Romantismo</option>
              <option value="✨ Química">✨ Química</option>
              <option value="🫶 Compreensão">🫶 Compreensão</option>
              <option value="😌 Conforto">😌 Conforto</option>
              <option value="🗣️ Comunicação aberta">
                🗣️ Comunicação aberta
              </option>
              <option value="🙏 Educação">🙏 Educação</option>
              <option value="🔥 Atração">🔥 Atração</option>
              <option value="🌟 Boas experiências">
                🌟 Boas experiências
              </option>
              <option value="⏰ Pontualidade">⏰ Pontualidade</option>
              <option value="🚫 Sem pressão">🚫 Sem pressão</option>
              <option value="🛡️ Segurança">🛡️ Segurança</option>
              <option value="😎 Ser espontâneo">
                😎 Ser espontâneo
              </option>
              <option value="🎉 Divertir-se">
                🎉 Divertir-se
              </option>
            </select>
          ) : (
            <p>{(user.meetingRequest || []).join(", ")}</p>
          )}
        </div>
        {/* FANTASIAS SEXUAIS */}
<div>
  <strong>Fantasias sexuais:</strong>
  {isEditing ? (
    <select
      multiple
      value={formData.sexualFantasy || []}
      onChange={(e) =>
        setFormData({
          ...formData,
          sexualFantasy: Array.from(
            e.target.selectedOptions,
            (option) => option.value
          ),
        })
      }
      className="w-full p-2 bg-white text-black rounded"
      size={6}
    >
      <option value="A 3">A 3 </option>
      <option value="Fio terra">Fio terra</option>
      <option value="Alcolizado">Alcolizado</option>
      <option value="🚗 No carro">🚗 No carro</option>
      <option value="🌙 Ao ar livre">🌙 Ao ar livre</option>
      <option value="Selvagem">Selvagem</option>
      <option value="Beijo grego">Beijo grego</option>
      <option value="Na cozinha">Na cozinha</option>
      <option value="Em grupo">Em grupo</option>
      <option value="Sem comprimisso">Sem comprimisso</option>
      <option value="Outro">Outro</option>
    
    </select>
  ) : (
    <p>{(user.sexualFantasy || []).join(", ")}</p>
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

