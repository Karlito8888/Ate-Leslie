import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '../common/Alert';
import '../../styles/components/_register-form.scss';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    
    try {
      const response = await fetch('http://localhost:5000/api/v1/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message);
        return;
      }

      // Registration successful
      setSuccess('Registration successful! Redirecting...');
      localStorage.setItem('token', data.data.token);
      
      // Redirect after 2 seconds
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
      
    } catch (err) {
      setError('An error occurred during registration');
    }
  };

  return (
    <div className="register">
      <div className="register__container">
        <div className="register__header">
          <h2>Create an Account</h2>
        </div>
        
        {error && (
          <Alert
            type="error"
            message={error}
            onClose={() => setError(null)}
          />
        )}
        
        {success && (
          <Alert
            type="success"
            message={success}
          />
        )}

        <form className="register__form" onSubmit={handleSubmit}>
          <div className="register__field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              required
              placeholder="Enter your username"
              value={formData.username}
              onChange={handleChange}
            />
          </div>
          
          <div className="register__field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              required
              placeholder="Enter your email"
              value={formData.email}
              onChange={handleChange}
            />
          </div>
          
          <div className="register__field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              required
              placeholder="Enter your password"
              value={formData.password}
              onChange={handleChange}
            />
          </div>
          
          <div className="register__field">
            <label htmlFor="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              required
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
            />
          </div>

          <button type="submit" className="register__submit">
            Register
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterForm;
