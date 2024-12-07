import React, { useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { RiHome2Line } from "react-icons/ri";
import { IoIosImages } from "react-icons/io";
import { LuBriefcaseBusiness } from "react-icons/lu";
import { BsInfoSquare } from "react-icons/bs";
import { TiMessages } from "react-icons/ti";
import { FiUserPlus, FiLogIn } from "react-icons/fi";
import styles from './NavigationAside.module.scss';

const NavigationAside = ({ isFirstVisit }) => {
  // Si c'est la première visite, on garde le menu plié pendant l'animation initiale
  useEffect(() => {
    if (isFirstVisit) {
      const timer = setTimeout(() => {
        // Pas besoin de setIsExpanded car nous utilisons le hover
      }, 6000); // Synchronisé avec la modale de chargement
      return () => clearTimeout(timer);
    }
  }, [isFirstVisit]);

  return (
    <aside 
      className={`
        ${styles.navigationAside} 
        ${isFirstVisit ? styles.animate : ''} 
      `}
    >
      <div className={styles.toggleButton}>
        {String.fromCharCode(11106)}
      </div>
      
      <nav className={styles.navigation}>
        <ul className={styles.mainNav}>
          <li>
            <NavLink to="/" className={({ isActive }) => isActive ? styles.activeLink : ''}>
              <span className={styles.iconWrapper}>
                <RiHome2Line className={styles.icon} />
              </span>
              <span className={styles.linkText}>Home</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/portfolio" className={({ isActive }) => isActive ? styles.activeLink : ''}>
              <span className={styles.iconWrapper}>
                <IoIosImages className={styles.icon} />
              </span>
              <span className={styles.linkText}>Portfolio</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/services" className={({ isActive }) => isActive ? styles.activeLink : ''}>
              <span className={styles.iconWrapper}>
                <LuBriefcaseBusiness className={styles.icon} />
              </span>
              <span className={styles.linkText}>Services</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/about" className={({ isActive }) => isActive ? styles.activeLink : ''}>
              <span className={styles.iconWrapper}>
                <BsInfoSquare className={styles.icon} />
              </span>
              <span className={styles.linkText}>About</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/contact" className={({ isActive }) => isActive ? styles.activeLink : ''}>
              <span className={styles.iconWrapper}>
                <TiMessages className={styles.icon} />
              </span>
              <span className={styles.linkText}>Contact</span>
            </NavLink>
          </li>
        </ul>
        
        <ul className={styles.authNav}>
          <li>
            <NavLink to="/auth/register" className={({ isActive }) => isActive ? styles.activeLink : ''}>
              <span className={styles.iconWrapper}>
                <FiUserPlus className={styles.icon} />
              </span>
              <span className={styles.linkText}>Sign Up</span>
            </NavLink>
          </li>
          <li>
            <NavLink to="/auth/login" className={({ isActive }) => isActive ? styles.activeLink : ''}>
              <span className={styles.iconWrapper}>
                <FiLogIn className={styles.icon} />
              </span>
              <span className={styles.linkText}>Login</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </aside>
  );
};

export default NavigationAside;
