import React from 'react';
import Logo from '../Logo';
import styles from './Header.module.scss';

const Header = ({ isFirstVisit }) => {
  return (
    <header className={styles.header}>
      <Logo isFirstVisit={isFirstVisit} />
      {/* Vous pourrez ajouter d'autres éléments de header ici */}
    </header>
  );
};

export default Header;
