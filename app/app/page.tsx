"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

export default function HomePage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const usersList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setUsers(usersList);
      } catch (error) {
        console.error("Erro ao buscar usuários:", error);
      }
      setLoading(false);
    };

    fetchUsers();
  }, []);

  const handleProfileNavigation = (userId: string) => {
    router.push(`/profile/${userId}`); // Redireciona para o perfil do usuário
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-[#121212]">
        <div className="text-white text-xl">Carregando perfis...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-4">
      <div className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex bg-[#1E1E1E] p-4 rounded-lg items-center cursor-pointer"
            onClick={() => handleProfileNavigation(user.id)}
          >
            <img
              src={user.selfieUrl || "/default-avatar.png"} // Imagem de perfil, com fallback
              alt={user.name}
              className="w-20 h-20 rounded-full mr-4"
            />
            <div className="flex-1">
              <h2 className="text-white text-lg font-semibold">{user.name}</h2>
              <p className="text-gray-400">{`Preço: $${user.price || "Indefinido"}`}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
