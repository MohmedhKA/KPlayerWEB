import React, { useState } from 'react';
import Login from './Login';
import Signup from './Signup';
import { useAuth } from '../../context/AuthContext';

const AuthPage = () => {
  const [isLogin, setIsLogin] = useState(true);
  const { login } = useAuth();

  const handleAuth = (userData) => {
    login(userData);
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