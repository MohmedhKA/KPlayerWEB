import React, { useState } from 'react';
import api from '../../utils/api';
import './Login.css';

const Login = ({ onLogin, switchToSignup }) => {
  const [formData, setFormData] = useState({
    identifier: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.identifier || !formData.password) {
      setError('Please enter both username/email and password');
      return;
    }

    try {
      console.log('Attempting login with identifier:', formData.identifier);
      const response = await api.post('/api/auth/login', formData);
      
      if (response.data.success) {
        const { token, user } = response.data.data;
        console.log('Login successful, storing token and user data');
        
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        onLogin(user);
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      setError(error.response?.data?.message || 'Login failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Login to Your Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="identifier"
              placeholder="Username or Email"
              value={formData.identifier}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="auth-button">Login</button>
        </form>
        <p className="switch-auth">
          Don't have an account? 
          <button onClick={switchToSignup} className="switch-button">
            Sign Up
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;