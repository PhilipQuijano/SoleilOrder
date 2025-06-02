import React, { useState, useEffect } from 'react';

// This component renders a small debugging panel that shows useful information
// about the current scroll position and navbar state
const NavbarDebug = () => {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [navbarState, setNavbarState] = useState({
    scrolled: false,
    pathname: window.location.pathname
  });

  useEffect(() => {
    const handleScroll = () => {
      setScrollPosition(window.scrollY);
      // Check if navbar has scrolled class
      const navbar = document.querySelector('.navbar');
      if (navbar) {
        setNavbarState({
          scrolled: navbar.classList.contains('scrolled'),
          pathname: window.location.pathname
        });
      }
    };

    // Initial check
    handleScroll();
    
    // Add event listener
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const debugStyles = {
    position: 'fixed',
    bottom: '10px',
    right: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    color: 'white',
    padding: '10px',
    borderRadius: '5px',
    zIndex: 9999,
    fontSize: '12px',
    fontFamily: 'monospace'
  };

  return (
    <div style={debugStyles}>
      <div>Scroll Position: {scrollPosition}px</div>
      <div>Path: {navbarState.pathname}</div>
      <div>Navbar Scrolled: {navbarState.scrolled ? 'Yes' : 'No'}</div>
    </div>
  );
};

export default NavbarDebug;