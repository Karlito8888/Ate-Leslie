import React, { useState, useEffect } from 'react';
import styles from './NavigationAside.module.scss';

const NavigationAside = ({ isFirstVisit }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Si c'est la première visite, on garde le menu plié pendant l'animation initiale
  useEffect(() => {
    if (isFirstVisit) {
      const timer = setTimeout(() => {
        setIsExpanded(false);
      }, 5000); // Synchronisé avec la modale de chargement
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit]);

  return (
    <aside 
      className={`
        ${styles.navigationAside} 
        ${isFirstVisit ? styles.animate : ''} 
        ${isExpanded ? styles.expanded : styles.collapsed}
      `}
      onClick={() => setIsExpanded(!isExpanded)}
    >
      <div className={styles.toggleButton}>
        {isExpanded ? String.fromCharCode(11104) : String.fromCharCode(11106)}
      </div>
      
      <nav className={styles.navigation}>
        {/* Ajoutez vos liens de navigation ici */}
        <ul>
          <li>Home</li>
          <li>Portfolio</li>
          <li>Services</li>
          <li>About</li>
          <li>Contact</li>
        </ul>
      </nav>
    </aside>
  );
};

export default NavigationAside;
