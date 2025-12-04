"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs, query, limit } from "firebase/firestore";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";

export default function HomePage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const router = useRouter();
  const userId = auth.currentUser?.uid;
  const [selectedUser, setSelectedUser] = useState<any | null>(null);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push("/login");
    } catch (error) {
      console.error("Erro ao fazer logout:", error);
    }
  };

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersQuery = query(collection(db, "users"), limit(8));
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

  const filteredUsers = users.filter((user) =>
    user.name && user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleProfileClick = (userId: string) => {
    router.push(`/profile/${userId}`);
  };

  const handleUnlockProfile = (userId: string) => {
    router.push(`/payment?user=${userId}`);
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const suggestedUsers = users.filter((user) =>
    user.interests?.includes("algum interesse relevante")
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full border-t-4 border-blue-500 h-16 w-16 mb-4"></div>
          <p className="text-lg">Carregando perfis, por favor aguarde...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-900 text-white p-6 md:p-8 min-h-screen">
      {/* Menu Hambúrguer */}
      <div className="flex justify-between items-center mb-6">
        <button
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="text-white text-2xl md:hidden"
        >
          ☰
        </button>
        <div className="relative w-64 md:w-80">
          <input
            type="text"
            placeholder="Pesquise por nome..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full p-4 rounded-lg bg-gray-800 text-white border border-gray-600 focus:outline-none"
          />
          <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
            <i className="fas fa-search"></i>
          </span>
        </div>
        <button
          onClick={() => router.push("/messages")}
          className="text-white text-2xl ml-4"
        >
          💬
        </button>
      </div>

      {/* Menu lateral */}
      <div
        className={`fixed top-0 left-0 w-64 h-full bg-gray-800 text-white p-6 shadow-lg z-50 transform ${isMenuOpen ? "translate-x-0" : "-translate-x-full"} transition-transform ease-in-out md:relative md:translate-x-0`}
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
            onClick={() => router.push(`/profile/${userId}`)}
            className="p-3 rounded-lg hover:bg-green-600 transition"
          >
            Meu Perfil
          </button>
          <button
            onClick={() => router.push("/messages")}
            className="p-3 rounded-lg hover:bg-blue-600 transition"
          >
            Mensagens
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

      {/* Perfis */}
      {selectedUser ? (
        <div className="profile-details">
          <h3 className="text-3xl font-bold">{selectedUser.name}</h3>
          <p>{selectedUser.age ? `Idade: ${selectedUser.age}` : "Idade não informada"}</p>
          <p>{selectedUser.location ? `Localização: ${selectedUser.location}` : "Localização não informada"}</p>
          <p>{selectedUser.interests ? `Interesses: ${selectedUser.interests}` : "Interesses não informados"}</p>

          <div className="mt-6">
            <h4 className="text-xl font-semibold">Fotos e Vídeos</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {selectedUser.photos?.map((photo: string, index: number) => (
                <a key={index} href={photo} target="_blank" rel="noopener noreferrer">
                  <img
                    src={photo}
                    alt={`Foto de ${selectedUser.name}`}
                    className="w-full h-auto rounded-lg object-cover"
                  />
                </a>
              ))}
              {selectedUser.videos?.map((video: string, index: number) => (
                <video key={index} controls className="w-full h-auto rounded-lg">
                  <source src={video} type="video/mp4" />
                </video>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          <h2 className="text-4xl font-bold text-center mb-6">Perfis de Usuários</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredUsers.map((user) =>
              user.id !== userId ? (
                <div
                  key={user.id}
                  className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
                  onClick={() => handleProfileClick(user.id)}
                  aria-label={`Ver perfil de ${user.name}`}
                >
                  <a href={user.profilePic} target="_blank" rel="noopener noreferrer">
                    <img
                      src={user.profilePic || "https://via.placeholder.com/100"}
                      alt={`Foto de Perfil de ${user.name}`}
                      className="w-28 h-28 rounded-full mx-auto mb-4 border-2 border-gray-600 object-cover"
                    />
                  </a>
                  <div className="text-center">
                    <h3 className="text-xl font-semibold">{user.name}</h3>
                    <p className="text-gray-400 text-sm">{user.age ? `Idade: ${user.age}` : "Idade não informada"}</p>
                    <p className="text-gray-400 text-sm">{user.location ? `Localização: ${user.location}` : "Localização não informada"}</p>

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

      {/* Sugestões */}
      <h2 className="text-3xl font-bold text-center mt-12 mb-6">Sugestões de Pessoas</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
        {suggestedUsers.slice(0, 4).map((user) => (
          <div
            key={user.id}
            className="bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 cursor-pointer"
            onClick={() => handleProfileClick(user.id)}
          >
            <a href={user.profilePic} target="_blank" rel="noopener noreferrer">
              <img
                src={user.profilePic || "https://via.placeholder.com/100"}
                alt={`Foto de Perfil de ${user.name}`}
                className="w-28 h-28 rounded-full mx-auto mb-4 border-2 border-gray-600 object-cover"
              />
            </a>
            <div className="text-center">
              <h3 className="text-xl font-semibold">{user.name}</h3>
              <p className="text-gray-400 text-sm">{user.age ? `Idade: ${user.age}` : "Idade não informada"}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
