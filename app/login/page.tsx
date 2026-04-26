"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuth, signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth"; // Importando Firebase Auth
import { auth } from "@/lib/firebase"; // Importando a instância do Auth

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetEmail, setResetEmail] = useState(""); // Email para redefinir a senha
  const [showResetPassword, setShowResetPassword] = useState(false); // Controla se a caixa de redefinição de senha está visível
  const [error, setError] = useState<string | null>(null); // Para armazenar as mensagens de erro

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null); // Limpar erros ao tentar novamente

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);

      if (userCredential.user) {
        console.log("Login bem-sucedido", userCredential.user);
        router.push("/home");
      }
    } catch (err: any) {
      console.error("Erro ao fazer login:", err);

      const errorCode = err.code;

      switch (errorCode) {
        case "auth/invalid-email":
          setError("O e-mail inserido é inválido. Por favor, insira um e-mail válido.");
          break;
        case "auth/user-not-found":
          setError("E-mail não encontrado. Verifique o e-mail e tente novamente.");
          break;
        case "auth/wrong-password":
          setError("Senha incorreta. Verifique sua senha e tente novamente.");
          break;
        case "auth/too-many-requests":
          setError("Muitas tentativas de login. Tente novamente mais tarde.");
          break;
        default:
          setError("Erro ao fazer login. Tente novamente!");
          break;
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async () => {
    if (!resetEmail) {
      setError("Por favor, insira um e-mail para redefinir a senha.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, resetEmail);
      alert("E-mail de redefinição de senha enviado! Verifique sua caixa de entrada.");
      setShowResetPassword(false);
    } catch (err: any) { // <-- Corrigido aqui: 'any'
      console.error("Erro ao enviar e-mail de redefinição:", err);
      const errorCode = err.code;

      if (errorCode === "auth/invalid-email") {
        setError("O e-mail inserido é inválido. Por favor, insira um e-mail válido.");
      } else if (errorCode === "auth/user-not-found") {
        setError("Não encontramos uma conta com esse e-mail. Verifique e tente novamente.");
      } else {
        setError("Erro ao enviar e-mail de redefinição de senha. Tente novamente.");
      }
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#1a1a2e] px-4">
      <div className="flex flex-col justify-center items-center w-full max-w-lg">
        {!showResetPassword ? (
          <div className="flex flex-col bg-[#2f3640] shadow-xl rounded-2xl p-10 w-full max-w-md mt-10">
            <h1 className="text-4xl font-extrabold mb-8 text-[#ff4757] text-center">
              Login
            </h1>

            {error && (
              <div className="mb-4 text-red-500 text-center">
                <span>{error}</span>
              </div>
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-4 mb-5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4757] text-white bg-[#3c3f58] placeholder-gray-400"
              required
              autoComplete="username"
            />

            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-4 mb-5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4757] text-white bg-[#3c3f58] placeholder-gray-400"
              required
              autoComplete="current-password"
            />

            <button
              type="submit"
              onClick={handleLogin}
              className="w-full bg-[#ff4757] text-white p-4 rounded-lg font-semibold hover:bg-[#e84118] transition duration-300"
              disabled={loading}
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>

            <div className="text-center mt-3">
              <span
                className="text-[#ff4757] font-semibold cursor-pointer hover:underline"
                onClick={() => setShowResetPassword(true)}
              >
                Esqueceu a senha?
              </span>
            </div>

            <p className="text-center mt-5 text-gray-400">
              Não tem conta?{" "}
              <span
                className="text-[#ff4757] font-semibold cursor-pointer hover:underline"
                onClick={() => router.push("/signup")}
              >
                Criar conta
              </span>
            </p>
          </div>
        ) : (
          <div className="bg-[#2f3640] shadow-xl rounded-2xl p-10 w-full max-w-md mt-10">
            <h1 className="text-3xl font-extrabold mb-8 text-[#ff4757] text-center">
              Redefinir Senha
            </h1>

            {error && (
              <div className="mb-4 text-red-500 text-center">
                <span>{error}</span>
              </div>
            )}

            <input
              type="email"
              placeholder="Digite seu e-mail"
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              className="w-full p-4 mb-5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff4757] text-white bg-[#3c3f58] placeholder-gray-400"
              required
              autoComplete="email"
            />

            <button
              onClick={handleResetPassword}
              className="w-full bg-[#ff4757] text-white p-4 rounded-lg font-semibold hover:bg-[#e84118] transition duration-300"
            >
              Enviar e-mail de redefinição
            </button>

            <div className="text-center mt-5">
              <span
                className="text-[#ff4757] font-semibold cursor-pointer hover:underline"
                onClick={() => setShowResetPassword(false)}
              >
                Voltar
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
