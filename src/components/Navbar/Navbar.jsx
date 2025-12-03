import React, { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart } from 'lucide-react';
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
                    
          {/* Logo */}
          <motion.div whileHover={{ scale: 1.05 }}>
            <Link to="/" className="logo hover-underline">
              SOLEIL
            </Link>
          </motion.div>
          
        </div>

        {/* Navigation Links */}
        <div className="nav-links">
          {['About', 'Charms', 'Customize', 'Contact'].map((item) => (
            <motion.div
              key={item}
              variants={linkVariants}
              whileHover="hover"
              whileTap="tap"
            >
              <NavLink
                to={`/${item.toLowerCase()}`}
                className={({ isActive }) => `nav-link hover-underline${isActive ? ' active' : ''}`}
                end={false}
              >
                {item}
              </NavLink>
            </motion.div>
          ))}

          {/* Cart icon/link */}
          <div className="cart-wrapper">
            <NavLink
              to="/cart"
              end={true}
              className={({ isActive }) => `nav-link cart-link${isActive ? ' active' : ''}`}
              aria-label="Cart"
              aria-current={location.pathname === '/cart' ? 'page' : undefined}
            >
              <ShoppingCart size={18} />
            </NavLink>
          </div>
        </div>
        
      </div>
    </motion.nav>
  );
};

export default Navbar;