import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

// const BACKEND_URL = "https://zentraqr-api-git-main-zentraqr-6009s-projects.vercel.app";
// const API = "https://zentraqr-api-git-main-zentraqr-6009s-projects.vercel.app/api";

const BACKEND_URL = "http://localhost:8001";
const API = "http://localhost:8001/api";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      // Only fetch user if we don't have it cached
      if (!user) {
        fetchUser();
      } else {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API}/auth/me`);
      const userData = response.data.user;
      setUser(userData);
      localStorage.setItem('user', JSON.stringify(userData));
    } catch (error) {
      console.error('Error fetching user:', error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API}/auth/login`, { email, password });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      let errorMessage = 'Erro ao fazer login';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        
        // Handle array of validation errors from FastAPI
        if (Array.isArray(detail)) {
          errorMessage = detail.map(err => err.msg || 'Erro de validação').join(', ');
        } 
        // Handle string error message
        else if (typeof detail === 'string') {
          errorMessage = detail;
        }
        // Handle object error
        else {
          errorMessage = 'Credenciais inválidas';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const register = async (email, password, name, role, restaurant_id) => {
    try {
      const response = await axios.post(`${API}/auth/register`, {
        email,
        password,
        name,
        role,
        restaurant_id
      });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem('token', newToken);
      localStorage.setItem('user', JSON.stringify(userData));
      setToken(newToken);
      setUser(userData);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      return { success: true };
    } catch (error) {
      let errorMessage = 'Erro ao registar';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        
        // Handle array of validation errors from FastAPI
        if (Array.isArray(detail)) {
          errorMessage = detail.map(err => err.msg || 'Erro de validação').join(', ');
        } 
        // Handle string error message
        else if (typeof detail === 'string') {
          errorMessage = detail;
        }
        // Handle object error
        else {
          errorMessage = 'Erro ao registar utilizador';
        }
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      return { success: false, error: errorMessage };
    }
  };

// Função para pedir o email de recuperação
  const forgotPassword = async (email) => {
    try {
      const response = await axios.post(`${API}/auth/forgot-password`, { email });
      return { success: true, message: response.data.message };
    } catch (error) {
      let errorMessage = 'Erro de ligação ao servidor';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Mapear os erros e traduzir os mais comuns
          errorMessage = detail.map(err => {
            if (err.msg && err.msg.includes('valid email')) {
              return 'Por favor, introduza um endereço de email válido.';
            }
            return err.msg || 'Erro de validação';
          }).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  // Função para enviar a nova password com o token
  const resetPassword = async (token, newPassword) => {
    try {
      const response = await axios.post(`${API}/auth/reset-password`, { 
        token, 
        new_password: newPassword 
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      let errorMessage = 'Erro de ligação ao servidor';
      
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        if (Array.isArray(detail)) {
          // Mapear os erros e traduzir os mais comuns
          errorMessage = detail.map(err => {
            if (err.msg && err.msg.includes('valid email')) {
              return 'Por favor, introduza um endereço de email válido.';
            }
            return err.msg || 'Erro de validação';
          }).join(', ');
        } else if (typeof detail === 'string') {
          errorMessage = detail;
        }
      }
      
      return { success: false, error: errorMessage };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
  };

  const value = {
    user,
    token,
    login,
    register,
    logout,
    loading,
    isAuthenticated: !!user,
    forgotPassword, 
    resetPassword   
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
