import React from "react";

const Termos = () => {
  return (
    <div className="max-w-5xl mx-auto p-6 text-gray-700">
      <h1 className="text-3xl font-bold mb-6">Termos de Serviço</h1>

      <p className="mb-4">
        Estes Termos de Serviço regulam o acesso e uso da plataforma S.G Kussanguluca.
        Ao criar uma conta ou utilizar os serviços disponibilizados na plataforma,
        o utilizador concorda com todos os termos aqui descritos.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        1. Aceitação dos Termos
      </h2>
      <p className="mb-4">
        Ao aceder ou utilizar a plataforma, o utilizador declara que leu,
        compreendeu e concorda com estes Termos de Serviço.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        2. Criação de Conta
      </h2>
      <p className="mb-4">
        Para utilizar certas funcionalidades do sistema, o utilizador deverá criar
        uma conta fornecendo informações verdadeiras, completas e atualizadas.
      </p>

      <ul className="list-disc ml-6 mb-4">
        <li>Nome da empresa ou utilizador</li>
        <li>Email válido</li>
        <li>NIF ou dados fiscais quando aplicável</li>
        <li>Senha segura</li>
      </ul>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        3. Uso Permitido
      </h2>
      <p className="mb-4">
        O utilizador compromete-se a utilizar a plataforma apenas para fins
        legais e relacionados com a gestão financeira ou administrativa
        da sua atividade.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        4. Segurança da Conta
      </h2>
      <p className="mb-4">
        O utilizador é responsável por manter a confidencialidade das suas
        credenciais de acesso. Qualquer atividade realizada na conta será
        considerada de responsabilidade do utilizador.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        5. Limitação de Responsabilidade
      </h2>
      <p className="mb-4">
        A plataforma não se responsabiliza por perdas decorrentes de uso
        indevido do sistema, falhas externas ou fornecimento incorreto
        de dados por parte do utilizador.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        6. Alterações nos Termos
      </h2>
      <p className="mb-4">
        Reservamo-nos o direito de modificar estes termos a qualquer momento.
        As alterações serão comunicadas através da plataforma.
      </p>

      <h2 className="text-xl font-semibold mt-6 mb-2">
        7. Encerramento de Conta
      </h2>
      <p className="mb-4">
        A conta poderá ser suspensa ou encerrada caso haja violação destes
        termos ou utilização indevida da plataforma.
      </p>

      <p className="mt-8 text-sm text-gray-500">
        Última atualização: 2026
      </p>
    </div>
  );
};

export default Termos;