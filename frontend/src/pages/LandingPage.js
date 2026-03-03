import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { QrCode, Utensils, ArrowRight, TestTube } from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  // Test data - simulate QR code scan
  const handleTestMenu = () => {
    navigate('/menu?restaurant_id=4e5be1a0-9a05-4909-8d30-8a4ce714d599&table_id=d07ca7e4-f1f6-4ab8-abcb-a22243ea63c1');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FAFAFA] to-white">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center justify-center w-20 h-20 bg-[#FF5500] rounded-full mb-6 shadow-lg shadow-orange-500/20">
            <Utensils className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-[#18181B] mb-4">
            Menu Digital<br />para Restaurantes
          </h1>
          <p className="text-lg sm:text-xl text-[#71717A] max-w-2xl mx-auto mb-8">
            Leia o código QR na sua mesa e faça pedidos diretamente pelo telemóvel
          </p>
        </motion.div>

        {/* Features */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="grid md:grid-cols-3 gap-6 mb-16"
        >
          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <QrCode className="w-6 h-6 text-[#FF5500]" />
            </div>
            <h3 className="font-bold text-lg mb-2">Leia o QR Code</h3>
            <p className="text-[#71717A] text-sm">Basta apontar a câmera para o QR na mesa</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Utensils className="w-6 h-6 text-[#10B981]" />
            </div>
            <h3 className="font-bold text-lg mb-2">Navegue no Menu</h3>
            <p className="text-[#71717A] text-sm">Veja fotos, preços e escolha o que quiser</p>
          </div>

          <div className="card p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ArrowRight className="w-6 h-6 text-[#F59E0B]" />
            </div>
            <h3 className="font-bold text-lg mb-2">Faça o Pedido</h3>
            <p className="text-[#71717A] text-sm">Finalize e acompanhe em tempo real</p>
          </div>
        </motion.div>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center space-y-4"
        >
          <div className="card p-8 max-w-md mx-auto">
            <h3 className="font-bold text-xl mb-4">Pronto para Começar?</h3>
            <p className="text-[#71717A] mb-6">Leia o QR Code na sua mesa para aceder ao menu</p>
            <div className="w-24 h-24 bg-gray-100 rounded-lg mx-auto mb-4 flex items-center justify-center">
              <QrCode className="w-12 h-12 text-gray-400" />
            </div>
            
            {/* Test Button */}
            <button
              data-testid="test-menu-button"
              onClick={handleTestMenu}
              className="w-full bg-[#10B981] hover:bg-[#059669] text-white rounded-full py-3 px-6 font-bold transition-all active:scale-95 flex items-center justify-center gap-2 mb-3"
            >
              <TestTube className="w-5 h-5" />
              Testar Menu Demo
            </button>
            <p className="text-xs text-[#71717A]">Simula a leitura de um QR Code (Mesa 1)</p>
          </div>

          <button
            data-testid="admin-login-link"
            onClick={() => navigate('/admin/login')}
            className="text-[#FF5500] hover:text-[#CC4400] font-medium transition-all"
          >
            É administrador? Faça login aqui
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;
