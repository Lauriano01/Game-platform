"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RegisterForm {
  name: string;
  email: string;
  password: string;
  birthDate: string;
  address: string;
  phone: string;
}

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState<RegisterForm>({
    name: "",
    email: "",
    password: "",
    birthDate: "",
    address: "",
    phone: "",
  });
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleRegister = async () => {
    // Verifica campos
    for (const [key, value] of Object.entries(form)) {
      if (!value.trim()) {
        alert(`Por favor, preencha o campo: ${key}`);
        return;
      }
    }

    if (!isValidEmail(form.email)) {
      alert("Por favor, insira um email válido.");
      return;
    }

    const birth = new Date(form.birthDate);
    if (isNaN(birth.getTime())) {
      alert("Data de nascimento inválida.");
      return;
    }

    const age = new Date().getFullYear() - birth.getFullYear();
    if (age < 18) {
      alert("Você precisa ter pelo menos 18 anos.");
      return;
    }

    if (!acceptedTerms) {
      alert("Você precisa aceitar os Termos e Condições para criar uma conta.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        ...form,
        createdAt: serverTimestamp(),
        hasPaid: false,
      });

      router.push("/home");
    } catch (error: any) {
      console.error("Erro ao criar usuário:", error);
      alert("Erro ao criar conta: " + (error.message || "Tente novamente mais tarde."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f0f2f5] px-4">
      <div className="flex flex-col md:flex-row w-full max-w-6xl items-center">
        <div className="hidden md:flex flex-col justify-center flex-1 pr-12">
          <h1 className="text-5xl font-extrabold text-[#1877f2] mb-6">
            Encontre sua companhia ideal
          </h1>
          <p className="text-gray-800 text-2xl">e compartilhe bons momentos.</p>
        </div>

        <div className="flex-1 bg-white shadow-xl rounded-2xl p-10 w-full max-w-md mt-10 md:mt-0">
          <h1 className="text-4xl font-extrabold mb-8 text-[#1877f2] text-center">Criar Conta</h1>

          {/** Campos do formulário **/}
          {Object.entries(form).map(([key, value]) => (
            <input
              key={key}
              type={key === "password" ? "password" : key === "email" ? "email" : key === "birthDate" ? "date" : "text"}
              name={key}
              placeholder={key.charAt(0).toUpperCase() + key.slice(1)}
              value={value}
              onChange={handleChange}
              className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900"
            />
          ))}

          <div className="mb-4">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={() => setAcceptedTerms(!acceptedTerms)}
                className="mt-1"
              />
              <span className="text-gray-700 text-sm">
                Eu li e aceito os{" "}
                <Link href="#" className="text-[#1877f2] underline">Termos e Condições</Link>
              </span>
            </label>

            <div className="mt-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded text-gray-600 text-xs bg-gray-50">
              {/* Texto resumido dos termos */}
              <p><strong>Natureza do Serviço:</strong> A plataforma oferece serviço de companhia...</p>
              <p><strong>Pagamentos e Reembolsos:</strong> Detalhes sobre pagamentos e reembolsos...</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleRegister}
            className="w-full bg-[#1877f2] text-white p-4 rounded-lg font-semibold hover:bg-[#165ecb] transition duration-300"
            disabled={loading}
          >
            {loading ? "Criando conta..." : "Cadastrar"}
          </button>

          <p className="text-center mt-5 text-gray-600">
            Já tem conta?{" "}
            <Link href="/login" className="text-[#1877f2] font-semibold cursor-pointer hover:underline">
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
