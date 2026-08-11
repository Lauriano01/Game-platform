
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
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

type ChatUser = {
  name?: string;
  profilePic?: string;
  [key: string]: any;
};

export default function ChatPage() {
  const router = useRouter();
  const { chatId } = useParams();

  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [chatUser, setChatUser] = useState<ChatUser | null>(null);

  const [showEmoji, setShowEmoji] = useState(false);

  // NOVO: foto selecionada
  const [selectedImage, setSelectedImage] = useState<File | null>(null);

  // NOVO: preview da foto
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // NOVO: estado de envio da foto
  const [uploadingImage, setUploadingImage] = useState(false);

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
      collection(
        db,
        "conversations",
        chatId as string,
        "messages"
      ),
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
        setChatUser(snap.data() as ChatUser);
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

  // =========================================================
  // NOVO: SELECIONAR FOTO
  // =========================================================

  const handleImageSelect = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];

    // Verificar se é imagem
    if (!file.type.startsWith("image/")) {
      alert("Por favor, selecione uma imagem.");
      return;
    }

    // Limite de 10 MB
    if (file.size > 10 * 1024 * 1024) {
      alert("A imagem deve ter no máximo 10 MB.");
      return;
    }

    setSelectedImage(file);

    // Criar preview
    const previewURL = URL.createObjectURL(file);
    setImagePreview(previewURL);

    // Permitir selecionar a mesma imagem novamente
    e.target.value = "";
  };

  // =========================================================
  // NOVO: CANCELAR FOTO
  // =========================================================

  const cancelSelectedImage = () => {
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }

    setSelectedImage(null);
    setImagePreview(null);
  };

  // =========================================================
  // NOVO: UPLOAD DA FOTO PARA CLOUDINARY
  // =========================================================

  const uploadImageToCloudinary = async (
    file: File
  ): Promise<string> => {
    const formData = new FormData();

    formData.append("file", file);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error("Erro ao enviar imagem.");
    }

    const data = await response.json();

    if (!data.url) {
      throw new Error("Cloudinary não retornou a URL da imagem.");
    }

    return data.url;
  };

  // =========================================================
  // SEND MESSAGE
  // =========================================================

  const sendMessage = async () => {
    if (!userId || !chatId || uploadingImage) return;

    // Não enviar se não tiver texto nem imagem
    if (!text.trim() && !selectedImage) return;

    try {
      let imageUrl: string | null = null;

      // =====================================================
      // SE EXISTIR FOTO, PRIMEIRO ENVIA PARA CLOUDINARY
      // =====================================================

      if (selectedImage) {
        setUploadingImage(true);

        imageUrl = await uploadImageToCloudinary(
          selectedImage
        );
      }

      // =====================================================
      // GUARDAR MENSAGEM NO FIRESTORE
      // =====================================================

      await addDoc(
        collection(
          db,
          "conversations",
          chatId as string,
          "messages"
        ),
        {
          text: text.trim(),
          imageUrl: imageUrl,
          senderId: userId,
          createdAt: serverTimestamp(),
          seen: false,
        }
      );

      // Limpar mensagem
      setText("");

      // Limpar foto
      cancelSelectedImage();

      setShowEmoji(false);
    } catch (error) {
      console.error(
        "Erro ao enviar mensagem:",
        error
      );

      alert(
        "Erro ao enviar a mensagem. Tente novamente."
      );
    } finally {
      setUploadingImage(false);
    }
  };

  // EMOJI
  const addEmoji = (emoji: string) => {
    setText((prev) => prev + emoji);
    setShowEmoji(false);
  };

  // VOLTAR PARA MENSAGENS
  const handleBack = () => {
    router.push("/messages");
  };

  return (
    <div className="flex flex-col h-screen">

      {/* HEADER MELHORADO */}
      <div className="p-4 border-b border-gray-700">

        <button
          onClick={handleBack}
          className="mb-3 bg-[#1877F2] px-4 py-2 rounded hover:bg-[#166FE5] transition text-white"
        >
          ← Voltar
        </button>

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
                isMe
                  ? "justify-end"
                  : "justify-start"
              }`}
            >

              <div
                className={`p-3 rounded-lg max-w-xs ${
                  isMe
                    ? "bg-[#1877F2] text-white"
                    : "bg-gray-200 text-black"
                }`}
              >

                {/* =================================================
                    FOTO DA MENSAGEM
                ================================================== */}

                {msg.imageUrl && (
                  <div className="mb-2">

                    <img
                      src={msg.imageUrl}
                      alt="Imagem enviada"
                      className="max-w-full max-h-80 rounded-lg object-cover cursor-pointer"
                      onClick={() =>
                        window.open(
                          msg.imageUrl,
                          "_blank"
                        )
                      }
                    />

                  </div>
                )}

                {/* TEXTO DA MENSAGEM */}

                {msg.text && (
                  <div className="break-words">
                    {msg.text}
                  </div>
                )}

                {/* VISTO */}

                {isMe && (
                  <div className="text-xs text-white/70 text-right mt-1">
                    {msg.seen
                      ? "visto ✓✓"
                      : "enviado ✓"}
                  </div>
                )}

              </div>

            </div>
          );
        })}

      </div>

      {/* =====================================================
          PREVIEW DA FOTO SELECIONADA
      ====================================================== */}

      {imagePreview && (
        <div className="p-3 bg-gray-800 border-t border-gray-700">

          <div className="relative inline-block">

            <img
              src={imagePreview}
              alt="Pré-visualização"
              className="w-24 h-24 object-cover rounded-lg border-2 border-[#1877F2]"
            />

            {!uploadingImage && (
              <button
                onClick={cancelSelectedImage}
                className="absolute -top-2 -right-2 bg-red-600 text-white w-6 h-6 rounded-full flex items-center justify-center hover:bg-red-700"
              >
                ×
              </button>
            )}

          </div>

          {uploadingImage && (
            <p className="text-sm text-gray-300 mt-2">
              Enviando foto...
            </p>
          )}

        </div>
      )}

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

        {/* EMOJI */}

        <button
          onClick={() =>
            setShowEmoji(!showEmoji)
          }
          className="text-xl"
          disabled={uploadingImage}
        >
          😊
        </button>

        {/* =====================================================
            BOTÃO FOTO
        ====================================================== */}

        <label
          htmlFor="chat-image-upload"
          className={`text-xl cursor-pointer ${
            uploadingImage
              ? "opacity-50 cursor-not-allowed"
              : ""
          }`}
        >
          📷
        </label>

        <input
          id="chat-image-upload"
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          disabled={uploadingImage}
          className="hidden"
        />

        {/* INPUT TEXTO */}

        <input
          value={text}
          onChange={(e) =>
            setText(e.target.value)
          }
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              sendMessage();
            }
          }}
          disabled={uploadingImage}
          className="flex-1 p-2 bg-white text-black placeholder-gray-500 rounded"
          placeholder="Escreve mensagem..."
        />

        {/* ENVIAR */}

        <button
          onClick={sendMessage}
          disabled={
            uploadingImage ||
            (!text.trim() && !selectedImage)
          }
          className="bg-blue-600 px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploadingImage
            ? "Enviando..."
            : "Enviar"}
        </button>

      </div>

    </div>
  );
}

