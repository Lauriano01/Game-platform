// app/page.tsx
"use client";

import React from "react";

const Home = () => {
  const profiles = [
    { name: "Jessica", age: 19, location: "Benfica", estadoCivil: "Solteira", photo: "/images/meufoto1.jpg" },
    { name: "Carlos", age: 25, location: "Patriota", estadoCivil: "Gerente", photo: "/images/meufoto2.jpg" },
    { name: "Meury", age: 23, location: "Rocha Padaria", estadoCivil: "Casada", photo: "/images/meufoto3.jpg" },
    { name: "João", age: 42, location: "Centralidade do Kilamba B17", estadoCivil: "Papoite do arraso", photo: "/images/meufoto4.jpg" },
  ];

  return (
    <div className="relative min-h-screen flex flex-col items-center justify-start bg-[#ECF0F1] overflow-x-hidden">

      {/* LOGO COM FUNDO BRANCO */}
      <div className="w-full bg-white py-4 flex justify-center shadow-md z-20 relative">
        <img
          src="/images/logo.jpg" // Coloque seu logo aqui em public/images/logo.jpg
          alt="Logo da Plataforma"
          className="w-32 h-32 object-contain"
        />
      </div>

      {/* HERO */}
      <div className="relative z-10 w-full bg-gradient-to-b from-[#F4F6F7] via-[#E9EEF1] to-[#ECF0F1] py-16 px-4 text-center mt-4">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-[#0A3D62] mb-4">
          Bem-vindo ao Game!
        </h1>

        <p className="text-base sm:text-lg md:text-xl text-[#34495E] mb-6 max-w-2xl mx-auto">
          O lugar onde o anonimato cria mistério e novas possibilidades de encontro, descubra novas conexões sem mostrar o rosto. Apenas você, seu corpo e possibilidades infinitas. 
        </p>

        {/* BOTÕES */}
        <div className="flex flex-col sm:flex-row justify-center gap-4 mb-12">
          <a
            href="/login"
            className="px-6 py-3 bg-[#0A3D62] text-white rounded-lg shadow-md hover:bg-[#062C47] transition duration-300"
          >
            Fazer Login
          </a>

          <a
            href="/signup"
            className="px-6 py-3 bg-white text-[#0A3D62] border border-[#0A3D62] rounded-lg shadow-md hover:bg-[#F4F6F7] transition duration-300"
          >
            Criar Conta
          </a>
        </div>

        {/* NOVO BOTÃO */}
        <div className="mb-14">
          <a
            href="/ganhar"
            className="px-6 py-3 bg-[#3C6382] text-white rounded-lg shadow-md hover:bg-[#2C5068] transition duration-300"
          >
            Descubra Como Ganhar Dinheiro online
          </a>
        </div>

        {/* PERFIS */}
        <h2 className="text-2xl sm:text-3xl font-bold text-[#0A3D62] mb-6">
          Perfis em destaque
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto px-2">
          {profiles.map((profile, index) => (
            <div
              key={index}
              className="bg-white rounded-xl shadow-lg overflow-hidden transform hover:scale-105 transition duration-300 cursor-pointer border border-gray-200"
            >
              <img
                src={profile.photo}
                alt={`Foto de ${profile.name}`}
                className="w-full h-48 sm:h-56 md:h-64 lg:h-72 object-cover"
              />

              <div className="p-4 text-center">
                <h3 className="text-lg sm:text-xl font-semibold text-[#0A3D62]">
                  {profile.name}
                </h3>
                <p className="text-gray-600">
                  {profile.age} anos - {profile.location} - {profile.estadoCivil}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default Home;
