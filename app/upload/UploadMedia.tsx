"use client";

import React, { useState, useEffect } from "react";
import { db, auth, storage } from "@/lib/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useParams, useRouter } from "next/navigation";
import { User } from "../../types";

const ProfilePage = () => {
  const { userId } = useParams();
  const router = useRouter();

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<{ [key: string]: any }>({});
  const [uploading, setUploading] = useState(false);

  const currentUser = auth.currentUser;
  const isOwnProfile = currentUser?.uid === userId;

  // Carregar dados do usuário
  useEffect(() => {
    if (!userId || Array.isArray(userId)) return;

    const fetchUserData = async () => {
      try {
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(userData as User);
          setFormData(userData);
        } else {
          console.log("Usuário não encontrado");
        }
      } catch (error) {
        console.error("Erro ao buscar dados do usuário:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Salvar alterações do perfil
  const handleSave = async () => {
    if (!formData || !userId || Array.isArray(userId)) return;

    try {
      const userDocRef = doc(db, "users", userId);

      // Limpar campos undefined
      const cleanData: { [key: string]: any } = {};
      Object.keys(formData).forEach(key => {
        if (formData[key] !== undefined) {
          cleanData[key] = formData[key];
        }
      });

      await updateDoc(userDocRef, cleanData);
      setUser(cleanData as User);
      setIsEditing(false);
    } catch (error) {
      console.error("Erro ao salvar dados:", error);
      alert("Erro ao salvar os dados. Tente novamente.");
    }
  };

  // Atualizar campos de input
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleMultiSelectChange = (e: React.ChangeEvent<HTMLSelectElement>, field: string) => {
    const options = Array.from(e.target.selectedOptions).map(option => option.value);
    setFormData(prev => ({ ...prev, [field]: options }));
  };

  const toggleEdit = () => setIsEditing(prev => !prev);
  const handleBack = () => router.push("/");

  // Enviar foto de perfil
  const handleProfilePicUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !userId || Array.isArray(userId)) return;

    const file = e.target.files[0];
    setUploading(true);

    try {
      const storageRef = ref(storage, `profilePics/${userId}/profile.jpg`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      const userDocRef = doc(db, "users", userId);
      await updateDoc(userDocRef, { profilePic: downloadURL });

      setUser(prev => (prev ? { ...prev, profilePic: downloadURL } : prev));
      setFormData(prev => (prev ? { ...prev, profilePic: downloadURL } : {}));

      alert("Foto de perfil atualizada com sucesso!");
    } catch (error) {
      console.error("Erro ao enviar foto de perfil:", error);
      alert("Erro ao enviar a foto de perfil. Tente novamente.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="animate-spin rounded-full border-t-4 border-blue-500 h-16 w-16 mb-4"></div>
        <p className="text-lg">Carregando dados do perfil...</p>
      </div>
    );
  }

  if (!user) {
    return <div className="text-white text-center">Usuário não encontrado. Verifique o ID e tente novamente.</div>;
  }

  return (
    <div className="bg-gray-900 text-white p-8 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8">Meu Perfil</h1>

      <div className="flex flex-col md:flex-row items-center gap-8">
        {/* Foto de Perfil */}
        <div className="flex-shrink-0">
          <img
            src={user.profilePic || "https://via.placeholder.com/150"}
            alt={`${user.name}'s profile`}
            className="w-32 h-32 rounded-full border-4 border-gray-600 object-cover"
          />
          {isOwnProfile && (
            <div className="mt-4">
              <label
                htmlFor="profile-pic-upload"
                className="bg-blue-600 text-white py-2 px-4 rounded-lg cursor-pointer hover:bg-blue-700 transition duration-300"
              >
                {uploading ? "Enviando..." : "Atualizar Foto de Perfil"}
              </label>
              <input
                id="profile-pic-upload"
                type="file"
                accept="image/*"
                onChange={handleProfilePicUpload}
                className="hidden"
              />
            </div>
          )}
        </div>

        {/* Dados do usuário */}
        <div className="flex-1">
          {/* Nome */}
          <div className="mb-4">
            <strong>Nome:</strong>
            {isEditing ? (
              <input
                type="text"
                name="name"
                value={formData.name || ""}
                onChange={handleInputChange}
                className="w-full p-2 mt-2 bg-gray-800 text-white border border-gray-600 rounded"
              />
            ) : (
              <p>{user.name}</p>
            )}
          </div>

          {/* Idade */}
          <div className="mb-4">
            <strong>Idade:</strong>
            {isEditing ? (
              <input
                type="number"
                name="age"
                value={formData.age || ""}
                onChange={handleInputChange}
                className="w-full p-2 mt-2 bg-gray-800 text-white border border-gray-600 rounded"
              />
            ) : (
              <p>{user.age}</p>
            )}
          </div>

          {/* Localização */}
          <div className="mb-4">
            <strong>Localização:</strong>
            {isEditing ? (
              <input
                type="text"
                name="location"
                value={formData.location || ""}
                onChange={handleInputChange}
                className="w-full p-2 mt-2 bg-gray-800 text-white border border-gray-600 rounded"
              />
            ) : (
              <p>{user.location}</p>
            )}
          </div>

          {/* Interesses */}
          <div className="mb-4">
            <strong>Interesses:</strong>
            {isEditing ? (
              <input
                type="text"
                name="interests"
                value={(formData.interests || []).join(", ")}
                onChange={e =>
                  setFormData(prev => ({
                    ...prev,
                    interests: e.target.value.split(",").map(s => s.trim())
                  }))
                }
                className="w-full p-2 mt-2 bg-gray-800 text-white border border-gray-600 rounded"
              />
            ) : (
              <p>{(user.interests || []).join(", ")}</p>
            )}
          </div>

          {/* Preferência Sexual */}
          <div className="mb-4">
            <strong>Preferência Sexual:</strong>
            {isEditing ? (
              <select
                name="sexualPreference"
                value={formData.sexualPreference || ""}
                onChange={handleInputChange}
                className="w-full p-2 mt-2 bg-gray-800 text-white border border-gray-600 rounded"
              >
                {["Homens", "Mulheres", "Gay", "Lésbica", "Bissexual", "Pansexual"].map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            ) : (
              <p>{user.sexualPreference}</p>
            )}
          </div>

          {/* Preferências de Encontros */}
          <div className="mb-4">
            <strong>Preferências de Encontros:</strong>
            {isEditing ? (
              <select
                multiple
                value={formData.datePreference || []}
                onChange={e => handleMultiSelectChange(e, "datePreference")}
                className="w-full p-2 mt-2 bg-gray-800 text-white border border-gray-600 rounded"
              >
                {["Jantar", "Ambientes tranquilos", "Sexo", "Cinema", "Conversar", "Praia", "Negócios"].map(pref => (
                  <option key={pref} value={pref}>{pref}</option>
                ))}
              </select>
            ) : (
              <p>{(user.datePreference || []).join(", ")}</p>
            )}
          </div>

          {/* Solicitações no Encontro */}
          <div className="mb-4">
            <strong>Solicitações no Encontro:</strong>
            {isEditing ? (
              <select
                multiple
                value={formData.meetingRequest || []}
                onChange={e => handleMultiSelectChange(e, "meetingRequest")}
                className="w-full p-2 mt-2 bg-gray-800 text-white border border-gray-600 rounded"
              >
                {["Comer", "Beber", "Respeito", "Abraços", "Beijos"].map(req => (
                  <option key={req} value={req}>{req}</option>
                ))}
              </select>
            ) : (
              <p>{(user.meetingRequest || []).join(", ")}</p>
            )}
          </div>
        </div>
      </div>

      {/* Botões */}
      <div className="mt-8 flex justify-end gap-4">
        {isOwnProfile && isEditing && (
          <button
            onClick={handleSave}
            className="bg-green-600 text-white p-2 rounded-lg hover:bg-green-700 transition duration-300"
          >
            Salvar
          </button>
        )}
        {isOwnProfile && !isEditing && (
          <button
            onClick={toggleEdit}
            className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition duration-300"
          >
            Editar
          </button>
        )}
        <button
          onClick={handleBack}
          className="bg-red-600 text-white p-2 rounded-lg hover:bg-red-700 transition duration-300"
        >
          Voltar
        </button>
      </div>
    </div>
  );
};

export default ProfilePage;
