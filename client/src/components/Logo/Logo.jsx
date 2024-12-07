import React from 'react';
import styles from './Logo.module.scss';

const Logo = ({ isFirstVisit }) => {
  return (
    <div className={`${styles.logo} ${isFirstVisit ? styles.animate : ''}`}>
    </div>
  );
};

export default Logo;
