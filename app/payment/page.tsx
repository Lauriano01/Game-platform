"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { db, auth, storage } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

type PaymentOption = "meeting";

const PaymentPage = () => {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<PaymentOption | null>(null);
  const [loading, setLoading] = useState(false);

  // Campos comuns
  const [usernameTarget, setUsernameTarget] = useState("");
  const [userPhone, setUserPhone] = useState("");

  // Campos específicos do encontro
  const [meetingDate, setMeetingDate] = useState("");
  const [environment, setEnvironment] = useState("");
  const [expectation, setExpectation] = useState("");

  // Comprovante opcional
  const [file, setFile] = useState<File | null>(null);

  // Mensagem de feedback
  const [message, setMessage] = useState("");

  const paymentDetails = {
    meeting: { iban: "yyyy yyyy yyyy", express: "yyyy yyyy yyyy" },
  };

  const handlePaymentOptionSelect = (option: PaymentOption) => {
    setSelectedOption(option);
    setMessage("");
    setUsernameTarget("");
    setUserPhone("");
    setMeetingDate("");
    setEnvironment("");
    setExpectation("");
    setFile(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!auth.currentUser) {
      setMessage("Usuário não autenticado.");
      return;
    }

    if (!usernameTarget || !userPhone) {
      setMessage("Por favor, preencha todos os campos obrigatórios.");
      return;
    }

    if (!meetingDate || !environment || !expectation) {
      setMessage("Por favor, preencha todos os campos do encontro.");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      let fileURL = null;
      if (file) {
        const storageRef = ref(storage, `payments/${auth.currentUser.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        fileURL = await getDownloadURL(storageRef);
      }

      const paymentData = {
        createdAt: serverTimestamp(),
        option: "meeting",
        status: "pending",
        usernameTarget,
        userPhone,
        userId: auth.currentUser.uid,
        fileName: fileURL,
        meetingDetails: {
          date: meetingDate,
          environment,
          expectation,
        },
      };

      await addDoc(collection(db, "payments"), paymentData);

      setMessage("Pagamento registrado com sucesso!");
    } catch (error) {
      console.error(error);
      setMessage("Ocorreu um erro ao registrar o pagamento.");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => router.push("/home");

  return (
    <div className="bg-gray-900 text-white p-8 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8">
        Solicitar Encontro
      </h1>

      <div className="flex justify-center mb-8">
        <button
          onClick={() => handlePaymentOptionSelect("meeting")}
          className="bg-[#1877f2] text-white p-4 rounded-lg font-semibold hover:bg-[#165ecb]"
        >
          Solicitar Encontro - 5000 Kz
        </button>
      </div>

      {selectedOption && (
        <div className="max-w-md mx-auto bg-gray-800 p-6 rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Detalhes do pagamento</h2>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">Nome do usuário alvo *</label>
            <input
              type="text"
              value={usernameTarget}
              onChange={(e) => setUsernameTarget(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">Número de telefone *</label>
            <input
              type="text"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">Data e hora do encontro *</label>
            <input
              type="datetime-local"
              value={meetingDate}
              onChange={(e) => setMeetingDate(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">Tipo de ambiente *</label>
            <select
              value={environment}
              onChange={(e) => setEnvironment(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">Selecione</option>
              <option value="Festa Formal">Festa Formal</option>
              <option value="Drena">Drena</option>
              <option value="Saída Básica">Saída Básica</option>
              <option value="Cinema">Cinema</option>
              <option value="Piscina">Piscina</option>
              <option value="Ideia em Casa">Ideia em Casa</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">O que espera *</label>
            <select
              value={expectation}
              onChange={(e) => setExpectation(e.target.value)}
              className="w-full p-2 rounded bg-gray-700 text-white border border-gray-600"
            >
              <option value="">Selecione</option>
              <option value="Amiga/o">Amiga/o</option>
              <option value="Conselheira/o">Conselheira/o</option>
              <option value="Alguém para ouvir">Alguém para ouvir</option>
              <option value="Relaxar">Relaxar</option>
              <option value="Namorado(a) de aluguel">Namorado(a) de aluguel</option>
            </select>
          </div>

          <div className="mb-4">
            <label className="block mb-1 font-semibold">Comprovante (opcional)</label>
            <input type="file" onChange={handleFileChange} className="w-full text-white" />
          </div>

          <div className="mb-4">
            <p>
              <strong>IBAN:</strong> {paymentDetails.meeting.iban}
            </p>
            <p>
              <strong>Express:</strong> {paymentDetails.meeting.express}
            </p>
          </div>

          {message && (
            <p className="text-green-500 font-semibold mb-4">{message}</p>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600 w-full p-2 rounded-lg hover:bg-green-700"
          >
            {loading ? "A processar..." : "Confirmar pagamento"}
          </button>
        </div>
      )}

      <div className="text-center mt-8">
        <button
          onClick={handleBack}
          className="bg-red-600 p-2 rounded"
        >
          Voltar
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;