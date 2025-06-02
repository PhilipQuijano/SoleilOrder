// Navbar.jsx - Enhanced with animations
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    const handleScroll = () => {
      if (location.pathname !== '/') {
        setScrolled(true);
        return;
      }
      setScrolled(window.scrollY > 50);
    };
    
    handleScroll();
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location.pathname]);

  const navVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { opacity: 1, y: 0 }
  };

  const linkVariants = {
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
  };

  return (
    <motion.nav 
      className={scrolled ? 'navbar scrolled' : 'navbar'}
      initial="hidden"
      animate="visible"
      variants={navVariants}
      transition={{ duration: 0.5 }}
    >
      <div className="navbar-content">
        <motion.div whileHover={{ scale: 1.05 }}>
          <Link to="/" className="logo hover-underline">
            SOLEIL
          </Link>
        </motion.div>
        <div className="nav-links">
          {['About', 'Shop', 'Contact'].map((item) => (
            <motion.div
              key={item}
              variants={linkVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Link 
                to={`/${item.toLowerCase()}`} 
                className="nav-link hover-underline"
              >
                {item}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;