import React from 'react';
import Link from 'next/link';
import styles from '../styles/Header.module.css';

interface HeaderProps {
  title: string;
  navigationLinks: {
    name: string;
    path: string;
  }[];
}

const Header: React.FC<HeaderProps> = ({ title, navigationLinks }) => {
  return (
    <header className={styles.headerContainer}>
      <div className={styles.logoContainer}>
        <Link href="/">
          <img src="/logo.png" alt={`${title} Logo`} className={styles.logoImage} />
        </Link>
        <h1 className={styles.title}>{title}</h1>
      </div>
      <nav className={styles.navContainer} aria-label="Main Navigation">
        <ul className={styles.navList}>
          {navigationLinks.map((link, index) => (
            <li key={index} className={styles.navListItem}>
              <Link href={link.path} className={styles.navLink} aria-label={`Navigate to ${link.name}`}>
                {link.name}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default Header;