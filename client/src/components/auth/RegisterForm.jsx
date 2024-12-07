import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRegisterMutation } from '../../store/api/authApi';
import styles from './RegisterForm.module.scss';

const RegisterForm = () => {
  const navigate = useNavigate();
  const [register, { isLoading, error }] = useRegisterMutation();
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  
  const [validationErrors, setValidationErrors] = useState({});

  const validateForm = () => {
    const errors = {};
    
    if (!formData.username.trim()) {
      errors.username = 'Username is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      errors.email = 'Email is invalid';
    }
    
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      const result = await register({
        username: formData.username,
        email: formData.email,
        password: formData.password
      }).unwrap();
      
      // Si l'inscription réussit, redirigez vers la page de connexion
      navigate('/auth/login');
    } catch (err) {
      // L'erreur sera automatiquement gérée par RTK Query et disponible via la variable error
      console.error('Registration failed:', err);
    }
  };

  return (
    <div className={styles.registerContainer}>
      <form onSubmit={handleSubmit} className={styles.registerForm}>
        <h2>Create Account</h2>
        
        <div className={styles.formGroup}>
          <input
            type="text"
            name="username"
            value={formData.username}
            onChange={handleChange}
            placeholder="Username"
            className={validationErrors.username ? styles.error : ''}
          />
          {validationErrors.username && (
            <span className={styles.errorMessage}>{validationErrors.username}</span>
          )}
        </div>

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

        <div className={styles.formGroup}>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            className={validationErrors.confirmPassword ? styles.error : ''}
          />
          {validationErrors.confirmPassword && (
            <span className={styles.errorMessage}>{validationErrors.confirmPassword}</span>
          )}
        </div>

        {error && (
          <div className={styles.apiError}>
            {error.data?.message || 'An error occurred during registration'}
          </div>
        )}

        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isLoading}
        >
          {isLoading ? 'Creating Account...' : 'Sign Up'}
        </button>

        <p className={styles.loginLink}>
          Already have an account ?{' '}
          <span onClick={() => navigate('/auth/login')}>
            Login here
          </span>
        </p>
      </form>
    </div>
  );
};

export default RegisterForm;
