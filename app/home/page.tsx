
"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection,
  getDocs,
  query,
  where,
  onSnapshot,
} from "firebase/firestore";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

export default function HomePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  // Mensagens não lidas
  const [unreadCount, setUnreadCount] = useState(0);

  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);

  // =========================
  // AUTH
  // =========================
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setUserId(user.uid);
      } else {
        setUserId(null);
        setUnreadCount(0);
      }
    });

    return () => unsubscribe();
  }, []);

  // =========================
  // BUSCAR USUÁRIOS
  // =========================
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(
          collection(db, "users")
        );

        const querySnapshot = await getDocs(usersQuery);

        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setUsers(usersList);
      } catch (error) {
        console.log("Erro ao buscar usuários:", error);
      }

      setLoading(false);
    };

    fetchUsers();
  }, []);

  // =========================
  // CONTADOR DE MENSAGENS NÃO LIDAS
  // =========================
  useEffect(() => {
    if (!userId) return;

    let unsubscribeMessages: (() => void)[] = [];

    const conversationsQuery = query(
      collection(db, "conversations"),
      where("users", "array-contains", userId)
    );

    const unsubscribeConversations = onSnapshot(
      conversationsQuery,
      (snapshot) => {
        // Remove listeners antigos
        unsubscribeMessages.forEach((unsubscribe) => unsubscribe());
        unsubscribeMessages = [];

        let unreadByConversation: {
          [chatId: string]: number;
        } = {};

        const updateTotalUnread = () => {
          const total = Object.values(unreadByConversation).reduce(
            (sum, count) => sum + count,
            0
          );

          setUnreadCount(total);
        };

        snapshot.docs.forEach((conversationDoc) => {
          const chatId = conversationDoc.id;

          const messagesQuery = query(
            collection(
              db,
              "conversations",
              chatId,
              "messages"
            ),
            where("seen", "==", false)
          );

          const unsubscribeMessagesListener = onSnapshot(
            messagesQuery,
            (messageSnapshot) => {
              let count = 0;

              messageSnapshot.docs.forEach((messageDoc) => {
                const message = messageDoc.data();

                // Só conta mensagens recebidas.
                // As nossas próprias mensagens não entram no contador.
                if (message.senderId !== userId) {
                  count++;
                }
              });

              unreadByConversation[chatId] = count;

              updateTotalUnread();
            },
            (error) => {
              console.error(
                "Erro ao acompanhar mensagens:",
                error
              );
            }
          );

          unsubscribeMessages.push(
            unsubscribeMessagesListener
          );
        });

        if (snapshot.docs.length === 0) {
          setUnreadCount(0);
        }
      },
      (error) => {
        console.error(
          "Erro ao acompanhar conversas:",
          error
        );
      }
    );

    return () => {
      unsubscribeConversations();

      unsubscribeMessages.forEach((unsubscribe) =>
        unsubscribe()
      );
    };
  }, [userId]);

  // =========================
  // PESQUISA
  // =========================
  const filteredUsers = users.filter((user) =>
    user.name &&
    user.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  // =========================
  // PERFIL
  // =========================
  const handleProfileClick = (profileUserId: string) => {
    router.push(`/profile/${profileUserId}`);
  };

  // =========================
  // PAGAMENTO
  // =========================
  const handleUnlockProfile = (profileUserId: string) => {
    router.push(`/payment?user=${profileUserId}`);
  };

  // =========================
  // PESQUISA
  // =========================
  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSearchQuery(e.target.value);
  };

  // =========================
  // SUGESTÕES
  // =========================
  const suggestedUsers = users.filter((user) =>
    user.interests?.includes("algum interesse relevante")
  );

  // =========================
  // LOGOUT
  // =========================
  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  // =========================
  // LOADING
  // =========================
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen text-white">
        Carregando perfis, por favor aguarde...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">

      {/* =========================
          TOPO
      ========================= */}
      <div className="flex items-center justify-between mb-8">

        {/* MENU HAMBÚRGUER */}
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white text-2xl md:hidden"
        >
          ☰
        </button>

        {/* TÍTULO */}
        <h1 className="text-2xl md:text-3xl font-bold">
          Home
        </h1>

        {/* MENSAGENS */}
        <button
          onClick={() => router.push("/messages")}
          className="relative flex items-center justify-center w-11 h-11 rounded-full bg-blue-600 hover:bg-blue-700 transition shadow-lg"
          title="Mensagens"
        >
          <span className="text-xl">
            💬
          </span>

          {/* CONTADOR */}
          {unreadCount > 0 && (
            <span
              className="absolute -top-1 -right-1 min-w-[20px] h-5 px-1 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center border-2 border-gray-900"
            >
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </button>
      </div>

      {/* =========================
          BARRA DE PESQUISA
      ========================= */}
      <div className="max-w-2xl mx-auto mb-10">
        <div className="relative">

          {/* ÍCONE DA LUPA */}
          <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="w-5 h-5 text-gray-400"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m21 21-4.35-4.35m1.35-5.4a6.75 6.75 0 1 1-13.5 0 6.75 6.75 0 0 1 13.5 0Z"
              />
            </svg>
          </div>

          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Pesquisar pessoa pelo nome..."
            className="w-full h-14 pl-12 pr-12 bg-gray-800 border border-gray-700 rounded-2xl text-white placeholder-gray-400 outline-none transition-all duration-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 shadow-lg"
          />

          {/* LIMPAR PESQUISA */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white transition"
              aria-label="Limpar pesquisa"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* =========================
          MENU LATERAL
      ========================= */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-gray-800 text-white p-6 shadow-lg z-50 transform ${
          isMenuOpen
            ? "translate-x-0"
            : "-translate-x-full"
        } transition-transform ease-in-out md:relative md:translate-x-0`}
      >
        {isMenuOpen && (
          <button
            onClick={() => setIsMenuOpen(false)}
            className="text-white text-xl mb-6 hover:text-gray-300"
          >
            🔙 Voltar
          </button>
        )}

        <div className="flex flex-col space-y-6">

          <button
            onClick={() =>
              router.push(`/profile/${userId}`)
            }
            className="p-3 rounded-lg hover:bg-green-600 transition"
          >
            Meu Perfil
          </button>

          {/* MENSAGENS NO MENU */}
          <button
            onClick={() => router.push("/messages")}
            className="p-3 rounded-lg hover:bg-blue-600 transition flex items-center justify-between"
          >
            <span>Mensagens</span>

            {unreadCount > 0 && (
              <span className="min-w-[22px] h-5 px-1 bg-red-500 rounded-full text-xs font-bold flex items-center justify-center">
                {unreadCount > 99
                  ? "99+"
                  : unreadCount}
              </span>
            )}
          </button>

          <div className="border-t border-gray-600 my-4"></div>

          <button
            onClick={handleLogout}
            className="p-3 rounded-lg hover:bg-red-600 transition"
          >
            Sair
          </button>
        </div>
      </div>

      {/* =========================
          PERFIS
      ========================= */}
      {selectedUser ? (
        <div className="profile-details">

          <h3 className="text-3xl font-bold">
            {selectedUser.name}
          </h3>

          <p>
            {selectedUser.age
              ? `Idade: ${selectedUser.age}`
              : "Idade não informada"}
          </p>

          <p>
            {selectedUser.location
              ? `Localização: ${selectedUser.location}`
              : "Localização não informada"}
          </p>

          <p>
            {selectedUser.interests
              ? `Interesses: ${selectedUser.interests}`
              : "Interesses não informados"}
          </p>

          <div className="mt-6">

            <h4 className="text-xl font-semibold">
              Fotos e Vídeos
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">

              {selectedUser.photos?.map(
                (photo: string, index: number) => (
                  <a
                    key={index}
                    href={photo}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      src={photo}
                      alt={`Foto de ${selectedUser.name}`}
                      className="w-full h-auto rounded-lg object-cover"
                    />
                  </a>
                )
              )}

              {selectedUser.videos?.map(
                (video: string, index: number) => (
                  <video
                    key={index}
                    controls
                    className="w-full h-auto rounded-lg"
                  >
                    <source
                      src={video}
                      type="video/mp4"
                    />
                  </video>
                )
              )}

            </div>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-4xl font-bold text-center mb-6">
            Perfis de Usuários
          </h2>

          {/* RESULTADO DA PESQUISA */}
          {searchQuery && (
            <p className="text-center text-gray-400 mb-6">
              {filteredUsers.length === 0
                ? "Nenhuma pessoa encontrada."
                : `${filteredUsers.length} pessoa(s) encontrada(s)`}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

            {filteredUsers.map((user) =>
              user.id !== userId ? (
                <div
                  key={user.id}
                  className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() =>
                    handleProfileClick(user.id)
                  }
                  aria-label={`Ver perfil de ${user.name}`}
                >

                  <a
                    href={user.profilePic}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) =>
                      e.stopPropagation()
                    }
                  >
                    <img
                      src={
                        user.profilePic ||
                        "https://via.placeholder.com/100"
                      }
                      alt={`Foto de Perfil de ${user.name}`}
                      className="w-28 h-28 rounded-full mx-auto mb-4 border-2 border-gray-600 object-cover"
                    />
                  </a>

                  <div className="text-center">

                    <h3 className="text-xl font-semibold">
                      {user.name}
                    </h3>

                    <p className="text-gray-400 text-sm">
                      {user.age
                        ? `Idade: ${user.age}`
                        : "Idade não informada"}
                    </p>

                    <p className="text-gray-400 text-sm">
                      {user.location
                        ? `Localização: ${user.location}`
                        : "Localização não informada"}
                    </p>

                    <button
                      className="mt-4 w-full bg-green-500 text-white p-2 rounded-lg hover:bg-green-600 transition duration-300"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleUnlockProfile(user.id);
                      }}
                    >
                      Desbloquear Perfil
                    </button>

                  </div>
                </div>
              ) : null
            )}

          </div>
        </>
      )}

      {/* =========================
          SUGESTÕES
      ========================= */}
      <h2 className="text-3xl font-bold text-center mt-12 mb-6">
        Sugestões de Pessoas
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">

        {suggestedUsers.slice(0, 4).map((user) => (
          <div
            key={user.id}
            className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() =>
              handleProfileClick(user.id)
            }
          >

            <a
              href={user.profilePic}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) =>
                e.stopPropagation()
              }
            >
              <img
                src={
                  user.profilePic ||
                  "https://via.placeholder.com/100"
                }
                alt={`Foto de Perfil de ${user.name}`}
                className="w-28 h-28 rounded-full mx-auto mb-4 border-2 border-gray-600 object-cover"
              />
            </a>

            <div className="text-center">

              <h3 className="text-xl font-semibold">
                {user.name}
              </h3>

              <p className="text-gray-400 text-sm">
                {user.age
                  ? `Idade: ${user.age}`
                  : "Idade não informada"}
              </p>

            </div>
          </div>
        ))}

      </div>
    </div>
  );
}
