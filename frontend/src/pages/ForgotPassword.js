import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const ForgotPassword = () => {
  const navigate = useNavigate();
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle, loading, success, error
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('loading');
    const result = await forgotPassword(email);
    if (result.success) {
      setStatus('success');
      setMessage(result.message);
    } else {
      setStatus('error');
      setMessage(result.error);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          {status === 'success' ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="text-2xl font-bold text-[#18181B]">Verifique o seu Email</h2>
              <p className="text-[#71717A]">{message}</p>
              <button onClick={() => navigate('/login')} className="text-[#1a2342] font-medium hover:underline">
                Voltar ao login
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-[#18181B] mb-2">Recuperar Password</h2>
              <p className="text-[#71717A] mb-6 text-sm">Introduza o seu email para receber um link de recuperação.</p>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                {status === 'error' && (
                  <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm border border-red-100">{message}</div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-[#1a2342] outline-none"
                    placeholder="exemplo@email.com"
                  />
                </div>
                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full bg-[#1a2342] text-white py-2 rounded-lg font-bold hover:bg-[#0f1529] disabled:opacity-50"
                >
                  {status === 'loading' ? 'A enviar...' : 'Enviar Link'}
                </button>
              </form>
              <button onClick={() => navigate('/login')} className="mt-4 flex items-center text-sm text-[#71717A] hover:text-[#1a2342]">
                <ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao login
              </button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;