import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import { useAuth } from '../../context/AuthContext';
import api from '../../utils/api';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const handleAuth = async (userData) => {
    try {
      // Ensure token is set in API instance
      const token = localStorage.getItem('token');
      if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      }
      
      // Call login function from context
      login(userData);
    } catch (error) {
      console.error('Auth handling error:', error);
    }
  };

  return isLogin ? (
    <Login 
      onLogin={handleAuth} 
      switchToSignup={() => setIsLogin(false)} 
    />
  ) : (
    <Signup 
      onSignup={handleAuth} 
      switchToLogin={() => setIsLogin(true)} 
    />
  );
};

export default AuthPage;