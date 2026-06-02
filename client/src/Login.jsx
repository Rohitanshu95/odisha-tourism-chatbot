import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    // Placeholder login logic
    if (email && password) {
      // Simulate successful login
      navigate('/admin');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-hero">
        <h1>
          SYSTEM<br/>
          <span>ACCESS</span>
        </h1>
        <p>Odisha Tourism Chatbot Management Console.</p>
      </div>
      <div className="auth-form-area">
        <div className="auth-form-box">
          <h2>LOGIN</h2>
          <p>Enter your credentials to continue.</p>
          <form className="auth-form" onSubmit={handleLogin}>
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="auth-submit">AUTHENTICATE</button>
          </form>
          <div className="auth-links">
            <Link to="/register">Don't have an account? Request access.</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
