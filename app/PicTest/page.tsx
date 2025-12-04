"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";
import { useSearchParams, useRouter } from "next/navigation";

const PicTest = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const [uploading, setUploading] = useState(false);
  const [profilePicURL, setProfilePicURL] = useState<string | null>(null);
  const userId = searchParams.get("userId"); // pega o UID do perfil

  if (!userId) return <div className="text-white">Usuário não encontrado.</div>;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!data.url) throw new Error("Falha no upload");

      setProfilePicURL(data.url);

      // Atualiza Firestore com UID correto
      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { profilePic: data.url });

      alert("Foto de perfil atualizada com sucesso!");
      router.push(`/profile/${userId}`); // volta para o perfil atualizado
    } catch (err) {
      console.error(err);
      alert("Erro ao enviar a foto de perfil.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-8 bg-gray-900 min-h-screen text-white flex flex-col items-center">
      <h1 className="text-3xl mb-6">Upload Foto de Perfil</h1>

      <div className="mb-4">
        <img
          src={profilePicURL || "https://via.placeholder.com/150"}
          alt="Profile Pic"
          className="w-32 h-32 rounded-full border-2 border-gray-600"
        />
      </div>

      <input
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="mb-4"
      />
      {uploading && <p>Enviando...</p>}
    </div>
  );
};

export default PicTest;
