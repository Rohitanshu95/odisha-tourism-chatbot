import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Auth.css';

function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleRegister = (e) => {
    e.preventDefault();
    // Placeholder registration logic
    if (name && email && password) {
      navigate('/login');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-hero">
        <h1>
          INITIATE<br/>
          <span>ACCESS</span>
        </h1>
        <p>Register as a new Administrator for the Tourism platform.</p>
      </div>
      <div className="auth-form-area">
        <div className="auth-form-box">
          <h2>REGISTER</h2>
          <p>Create your management account.</p>
          <form className="auth-form" onSubmit={handleRegister}>
            <div className="input-group">
              <label>Full Name</label>
              <input 
                type="text" 
                value={name} 
                onChange={e => setName(e.target.value)} 
                required 
              />
            </div>
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
            <button type="submit" className="auth-submit">CREATE ACCOUNT</button>
          </form>
          <div className="auth-links">
            <Link to="/login">Already authorized? Go to Login.</Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Register;
