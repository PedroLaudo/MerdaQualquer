import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) return setError('As passwords não coincidem');
    
    setLoading(true);
    const result = await resetPassword(token, password);
    if (result.success) {
      alert('Password alterada com sucesso!');
      navigate('/login');
    } else {
      setError(result.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-xl shadow-sm p-8 border border-gray-200">
        <h2 className="text-2xl font-bold mb-6">Nova Password</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <div className="text-red-600 text-sm">{error}</div>}
          <div>
            <label className="block text-sm font-medium mb-1">Nova Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Confirmar Nova Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !token}
            className="w-full bg-[#1a2342] text-white py-2 rounded-lg font-bold"
          >
            {loading ? 'A guardar...' : 'Redefinir Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;