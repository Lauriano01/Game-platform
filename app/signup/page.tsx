"use client";

import { useState } from "react";
import { auth, db } from "@/lib/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";  // Importando o Link

export default function RegisterPage() {
  const router = useRouter();
  const [form, setForm] = useState({
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

  // Função para validar email
  const isValidEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1️⃣ Verifica se todos os campos foram preenchidos
    for (const [key, value] of Object.entries(form)) {
      if (!value.trim()) {
        alert(`Por favor, preencha o campo: ${key}`);
        return;
      }
    }

    // 2️⃣ Valida email
    if (!isValidEmail(form.email)) {
      alert("Por favor, insira um email válido.");
      return;
    }

    // 3️⃣ Valida idade
    const age =
      new Date().getFullYear() - new Date(form.birthDate).getFullYear();
    if (age < 18) {
      alert("Você precisa ter pelo menos 18 anos.");
      return;
    }

    // 4️⃣ Verifica termos aceitos
    if (!acceptedTerms) {
      alert("Você precisa aceitar os Termos e Condições para criar uma conta.");
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        ...form,
        createdAt: serverTimestamp(),
        hasPaid: false,
      });

      // Redireciona para a home page após o cadastro
      router.push("/home");  // Redirecionando para a home page após o cadastro
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-[#f0f2f5] px-4">
      <div className="flex flex-col md:flex-row w-full max-w-6xl items-center">
        {/* Lado esquerdo: Mensagem */}
        <div className="hidden md:flex flex-col justify-center flex-1 pr-12">
          <h1 className="text-5xl font-extrabold text-[#1877f2] mb-6">
            Encontre sua companhia ideal
          </h1>
          <p className="text-gray-800 text-2xl">
            e compartilhe bons momentos.
          </p>
        </div>

        {/* Lado direito: Formulário */}
        <div className="flex-1 bg-white shadow-xl rounded-2xl p-10 w-full max-w-md mt-10 md:mt-0">
          <h1 className="text-4xl font-extrabold mb-8 text-[#1877f2] text-center">
            Criar Conta
          </h1>

          <input
            type="text"
            name="name"
            placeholder="Nome"
            value={form.name}
            onChange={handleChange}
            className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900"
          />
          <input
            type="date"
            name="birthDate"
            placeholder="Data de nascimento"
            value={form.birthDate}
            onChange={handleChange}
            className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900"
          />
          <input
            type="email"
            name="email"
            placeholder="Email"
            value={form.email}
            onChange={handleChange}
            className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900"
          />
          <input
            type="text"
            name="address"
            placeholder="Morada"
            value={form.address}
            onChange={handleChange}
            className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900"
          />
          <input
            type="text"
            name="phone"
            placeholder="Número"
            value={form.phone}
            onChange={handleChange}
            className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900"
          />
          <input
            type="password"
            name="password"
            placeholder="Senha"
            value={form.password}
            onChange={handleChange}
            className="w-full p-4 mb-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1877f2] text-gray-900"
          />

          {/* Termos e Condições */}
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
                <Link
                  href="#"
                  className="text-[#1877f2] underline"
                >
                  Termos e Condições
                </Link>
              </span>
            </label>

            <div className="mt-2 max-h-32 overflow-y-auto p-2 border border-gray-200 rounded text-gray-600 text-xs bg-gray-50">
              {/* Texto resumido dos termos */}
              <p><strong>Natureza do Serviço:</strong> A plataforma oferece serviço de companhia para diversão, negócios, encontros sociais, namoro de aluguel ou amizade, sempre sem envolvimento sexual. O serviço permite que os usuários conectem-se e interajam de forma segura e social, mas não garante compatibilidade. A plataforma não se responsabiliza por atividades ilegais ou comportamentos indevidos dos usuários.</p>
              <p>Para quem deseja ter um namorado ou namorada de aluguel, saiba que o serviço não envolve sexo. A interação pode incluir aperto de mãos, abraços (quando houver consentimento) e boa conversa, sempre respeitando o conforto e limites da pessoa.</p>
              <p>Ao pagar pelo serviço, você poderá ter um bom amigo(a) ou companhia para encontro social dentro de 10 a 24 horas, dependendo da disponibilidade do usuário e do ambiente, desde que haja respeito mútuo em todas as interações.</p>
              <p><strong>Pagamentos e Reembolsos:</strong> O pagamento realizado pelos usuários tem como objetivo custear transporte, disponibilidade e locomoção da pessoa, garantindo que a interação seja segura e organizada, sem depender da amizade ou vínculo pessoal. Qualquer tentativa de pagamento com fins diferentes é aceite desde que seja claro que o objetivo é gorjeta, cobrança indevida é proibida.</p>
              <p>Os encontros devem ocorrer sempre em locais públicos, seguros e apropriados para interação social. Qualquer tentativa de realizar encontros em locais não seguros será proibida, e qualquer pagamento relacionado a esses encontros será totalmente reembolsado. Os usuários devem respeitar limites, agir com cortesia e garantir respeito mútuo em todas as interações. Qualquer ato de desrespeito, agressão ou violação da integridade do outro usuário será considerado crime, e a plataforma cooperará com as autoridades competentes.</p>
            </div>
          </div>

          <button
            type="submit"
            onClick={handleRegister}
            className="w-full bg-[#1877f2] text-white p-4 rounded-lg font-semibold hover:bg-[#165ecb] transition duration-300"
            disabled={loading}
          >
            {loading ? "Criando conta..." : "Cadastrar"}
          </button>

          <p className="text-center mt-5 text-gray-600">
            Já tem conta?{" "}
            <Link
              href="/login"  // Caminho correto para a página de login
              className="text-[#1877f2] font-semibold cursor-pointer hover:underline"
            >
              Entrar
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
