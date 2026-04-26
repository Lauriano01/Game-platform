// lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';  // Importando o onAuthStateChanged para monitorar a autenticação
import { getFirestore, doc, getDoc, collection, getDocs, updateDoc } from 'firebase/firestore';  // Importando funções do Firestore
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';  // Importando Firebase Storage

// Configuração do Firebase (substitua pelas credenciais do seu projeto Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyDQDrEuzOBYmCixJ29NOxlwF2zCO9Zjr1Y",
  authDomain: "namur-fee7f.firebaseapp.com",
  projectId: "namur-fee7f",
 storageBucket: "namur-fee7f.appspot.com",
 messagingSenderId: "513250571123",
  appId: "1:513250571123:web:b3b6ff8a44cc3a9cb6cb06",
  measurementId: "G-MTZLDCEXRM"
};

// Inicializar o Firebase
const app = initializeApp(firebaseConfig);

// Exportar Auth, Firestore e Storage para uso em outros arquivos
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);  // Inicializando Firebase Storage

// Função para obter o perfil do usuário autenticado
export const getUserProfile = async (userId: string) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userDocRef);
    
    if (userDoc.exists()) {
      return userDoc.data();  // Retorna os dados do perfil do usuário
    } else {
      throw new Error("Usuário não encontrado");
    }
  } catch (error) {
    console.error("Erro ao buscar dados do perfil:", error);
  }
};

// Função para buscar todos os perfis de usuários no Firestore
export const getAllUserProfiles = async () => {
  try {
    const usersCollectionRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersCollectionRef);
    const userList = usersSnapshot.docs.map(doc => doc.data());  // Mapeia os dados de todos os usuários
    return userList;
  } catch (error) {
    console.error("Erro ao buscar todos os perfis de usuários:", error);
  }
};

// Função para fazer upload de foto ou vídeo no Firebase Storage
export const uploadProfileMedia = async (file: File, userId: string) => {
  try {
    // Path corrigido para bater com as regras do Storage
    const fileRef = ref(storage, `profilePics/${userId}/${file.name}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);  // Obtém a URL do arquivo carregado
    return downloadURL;  // Retorna a URL para usar no perfil
  } catch (error) {
    console.error("Erro ao fazer upload da mídia:", error);
  }
};

// Função para atualizar o perfil do usuário no Firestore
export const updateUserProfile = async (userId: string, data: any) => {
  try {
    const userDocRef = doc(db, 'users', userId);
    await updateDoc(userDocRef, data);
    return true;
  } catch (error) {
    console.error("Erro ao atualizar perfil do usuário:", error);
    return false;
  }
};
