// src/pages/admin/PasswordPrompt.jsx
import React, { useState } from 'react';
import './PasswordPrompt.css';

const PasswordPrompt = ({ correctPassword, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === correctPassword) {
      onSuccess();
    } else {
      setError('Incorrect password. Please try again.');
    }
  };

  return (
    <div className="password-prompt-container">
      <div className="password-prompt">
        <h2>Admin Access Required</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            placeholder="Enter admin password"
            required
          />
          {error && <p className="error-message">{error}</p>}
          <button type="submit">Submit</button>
        </form>
      </div>
    </div>
  );
};

export default PasswordPrompt;