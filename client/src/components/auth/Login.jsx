import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLoginMutation } from '../../store/api/authApi';
import styles from './Login.module.scss';

const Login = () => {
  const navigate = useNavigate();
  const [login, { isLoading, error }] = useLoginMutation();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const result = await login({
        email: formData.email,
        password: formData.password
      }).unwrap();
      
      // Si la connexion réussit, redirigez vers la page d'accueil
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
    }
  };

  return (
    <div className={styles.loginContainer}>
      <form onSubmit={handleSubmit} className={styles.loginForm}>
        <h2>Login</h2>
        
        <div className={styles.formGroup}>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className={validationErrors.email ? styles.error : ''}
          />
          {validationErrors.email && (
            <span className={styles.errorMessage}>{validationErrors.email}</span>
          )}
        </div>

        <div className={styles.formGroup}>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className={validationErrors.password ? styles.error : ''}
          />
          {validationErrors.password && (
            <span className={styles.errorMessage}>{validationErrors.password}</span>
          )}
        </div>

        {error && (
          <div className={styles.apiError}>
            {error.data?.message || 'An error occurred during login'}
          </div>
        )}

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Logging in...' : 'Login'}
        </button>

        <p className={styles.registerLink}>
          Don't have an account ?{' '}
          <span onClick={() => navigate('/auth/register')}>Register here</span>
        </p>
      </form>
    </div>
  );
};

export default Login;
