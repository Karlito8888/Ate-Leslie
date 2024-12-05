import React from 'react';
import styles from './Logo.module.scss';

const Logo = ({ isFirstVisit }) => {
  return (
    <div className={`${styles.logo} ${isFirstVisit ? styles.animate : ''}`}>
      {/* Remplacez le texte par votre logo */}
      <h1>LOGO</h1>
    </div>
  );
};

export default Logo;
