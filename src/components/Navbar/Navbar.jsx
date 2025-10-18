import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Instagram, Facebook, ShoppingCart } from 'lucide-react';
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

  // Animation variants
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
        <div className="navbar-left">
          {/* Social Media Links */}
          <div className="social-icons">
            <motion.a
              href="https://www.instagram.com/soleilphl/" 
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              variants={linkVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Instagram size={18} />
            </motion.a>
            <motion.a
              href="https://www.facebook.com/profile.php?id=61567161596724" 
              target="_blank"
              rel="noopener noreferrer"
              className="social-link"
              variants={linkVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <Facebook size={18} />
            </motion.a>
          </div>
          
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link to="/" className="logo hover-underline">
              SOLEIL
            </Link>
          </motion.div>
        </div>

        {/* Navigation Links */}
        <div className="nav-links">
          {['About', 'Customize', 'Contact'].map((item) => {
            const path = `/${item.toLowerCase()}`;
            const isActive = location.pathname === path;
            return (
              <motion.div
                key={item}
                variants={linkVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Link 
                  to={path} 
                  className={`nav-link hover-underline${isActive ? ' active' : ''}`}
                >
                  {item}
                </Link>
              </motion.div>
            );
          })}

          {/* Cart icon/link (simple wrapper so it aligns and can receive active class) */}
          <div className="cart-wrapper">
            <Link 
              to="/cart" 
              className={`nav-link cart-link${location.pathname === '/cart' ? ' active' : ''}`} 
              aria-label="Cart"
            >
              <ShoppingCart size={18} />
            </Link>
          </div>
        </div>
      </div>
    </motion.nav>
  );
};

export default Navbar;