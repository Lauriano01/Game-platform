"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";

export default function CRMLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Preencha email e senha");
      return;
    }

    try {
      const usersRef = collection(db, "crmUsers");
      const q = query(usersRef, where("email", "==", email), where("password", "==", password));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        const userData = querySnapshot.docs[0].data();

        // Salva sessão local
        localStorage.setItem("crmUser", JSON.stringify(userData));
        localStorage.setItem("crmLogged", "true");

        // Redireciona direto para CRM
        router.push("/crm"); // "/crm" é a página do CRM (CRMAccessPage)
      } else {
        setError("Email ou senha incorretos ou conta não criada.");
      }
    } catch (err) {
      console.error(err);
      setError("Erro ao tentar logar. Tente novamente.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-white text-black p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-2xl font-bold mb-4 text-center">CRM Login</h2>

        {error && <p className="text-red-600 text-center mb-3">{error}</p>}

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            className="border p-2 w-full rounded mb-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Senha"
            className="border p-2 w-full rounded mb-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button
            type="submit"
            className="bg-blue-600 w-full text-white p-2 rounded hover:bg-blue-700"
          >
            Entrar
          </button>
        </form>
      </div>
    </div>
  );
}
