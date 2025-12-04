"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const PaymentPage = () => {
  const [selectedOption, setSelectedOption] = useState<"message" | "meeting" | null>(null);
  const [paymentInfo, setPaymentInfo] = useState<null | { iban: string; express: string }>(null);
  const router = useRouter();

  const paymentDetails = {
    message: {
      iban: "xxxx xxxx xxxx",
      express: "xxxx xxxx xxxx",
    },
    meeting: {
      iban: "yyyy yyyy yyyy",
      express: "yyyy yyyy yyyy",
    },
  };

  const handlePaymentOptionSelect = (option: "message" | "meeting") => {
    setSelectedOption(option);
    setPaymentInfo(paymentDetails[option]);
  };

  // Alteração: botão "Voltar" agora vai para a home page
  const handleBack = () => {
    router.push("/home"); // Caminho da home page
  };

  return (
    <div className="bg-gray-900 text-white p-8 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8 md:text-5xl lg:text-6xl">Escolha uma opção de pagamento</h1>

      <div className="flex justify-center gap-8 mb-8">
        <button
          onClick={() => handlePaymentOptionSelect("message")}
          className="bg-[#1877f2] text-white p-4 rounded-lg font-semibold hover:bg-[#165ecb] transition duration-300"
        >
          Mensagens - 1100 Kz
        </button>
        <button
          onClick={() => handlePaymentOptionSelect("meeting")}
          className="bg-[#1877f2] text-white p-4 rounded-lg font-semibold hover:bg-[#165ecb] transition duration-300"
        >
          Solicitar Encontro - 5000 Kz
        </button>
      </div>

      {selectedOption && paymentInfo && (
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Detalhes do pagamento</h2>
          <p className="mt-4">Para continuar, efetue o pagamento e envie o comprovante para nosso suporte.</p>
          <div className="mt-6">
            <p><strong>IBAN:</strong> {paymentInfo.iban}</p>
            <p><strong>Express:</strong> {paymentInfo.express}</p>
          </div>
          <p className="mt-4">Por favor, compartilhe o comprovante com o nosso suporte para validar o pagamento.</p>
        </div>
      )}

      <div className="text-center mt-8">
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

export default PaymentPage;
