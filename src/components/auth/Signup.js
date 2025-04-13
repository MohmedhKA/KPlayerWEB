import React, { useState } from 'react';
import api from '../../utils/api';
import './Login.css';

const Signup = ({ onSignup, switchToLogin }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user types
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    try {
      // Remove confirmPassword before sending
      const { confirmPassword, ...signupData } = formData;
      
      // Add /api prefix to the route
      const response = await api.post('/api/auth/signup', signupData);

      if (response.data.success) {
        const { token, user } = response.data.data;
        // Store token first
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
        
        // Update Authorization header for future requests
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        // Call onSignup with user data
        onSignup(user);
      }
    } catch (error) {
      console.error('Signup error:', error);
      setError(error.response?.data?.message || 'Signup failed. Please try again.');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Create Account</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={formData.username}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <input
              type="email"
              name="email"
              placeholder="Email"
              value={formData.email}
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
          <div className="form-group">
            <input
              type="password"
              name="confirmPassword"
              placeholder="Confirm Password"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="auth-button">Sign Up</button>
        </form>
        <p className="switch-auth">
          Already have an account? 
          <button onClick={switchToLogin} className="switch-button">
            Login
          </button>
        </p>
      </div>
    </div>
  );
};

export default Signup;