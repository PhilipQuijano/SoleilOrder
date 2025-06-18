import React, { useState, useEffect, useRef } from 'react';
import './About.css';
import { fetchCharms } from '../../../api/getCharms';
import defaultSilverCharmImage from '../../assets/default-silver-charm.jpg';

const About = () => {
  const [allCharms, setAllCharms] = useState([]);
  const [displayCharms, setDisplayCharms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  const animationInterval = useRef(null);
  const isAnimating = useRef(false);

  // Function to get random charms from all available charms
  const getRandomCharms = (charms, count = 20) => {
    if (!charms || charms.length === 0) return [];
    
    // Create array of indices and shuffle them
    const indices = Array.from({ length: charms.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    // Take first 'count' items from shuffled indices
    return indices.slice(0, Math.min(count, charms.length)).map(i => charms[i]);
  };

  // Function to cycle to new charms with proper timing
  const cycleCharms = (charms) => {
    if (isAnimating.current || !charms || charms.length === 0) return;
    
    isAnimating.current = true;
    
    // Get new random charms
    const newCharms = getRandomCharms(charms, 20);
    setDisplayCharms(newCharms);
    setAnimationKey(prev => prev + 1);
    
    // Reset animation flag after animation completes
    setTimeout(() => {
      isAnimating.current = false;
    }, 3000);
  };

  useEffect(() => {
    async function loadAllCharms() {
      setLoading(true);
      try {
        const charmsFromDB = await fetchCharms();
        
      if (charmsFromDB && charmsFromDB.length > 0) {
        setAllCharms(charmsFromDB);
        // Don't set initial charms here - let the interval handle everything
        
        // Start cycling immediately - first cycle will load the initial charms
        animationInterval.current = setInterval(() => {
          cycleCharms(charmsFromDB);
        }, 4000);
        
        // Trigger first cycle immediately
        cycleCharms(charmsFromDB);
          
        } else {
          console.error('No charms data received from database');
        }
      } catch (error) {
        console.error('Error loading charms for About section:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadAllCharms();

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
    };
  }, []);

  return (
    <div className='about' id="about">
      <div className="main-container">
        <div className="about-content">
          <div className="about-text">
            <h2>Bringing <span className="italic">your vision</span> to life</h2>
          </div>
          <div className="about-images">
            <div className="charms-grid">
              {loading ? (
                [...Array(20)].map((_, i) => (
                  <div key={i} className="charm-item loading-charm">
                    <div className="loading-placeholder"></div>
                  </div>
                ))
              ) : (
                displayCharms.map((charm, i) => (
                  <div 
                    key={`${charm.id}-${animationKey}-${i}`}
                    className="charm-item"
                    style={{
                      animationDelay: `${i * 0.02}s`
                    }}
                  >
                    <img 
                      src={charm.image || defaultSilverCharmImage} 
                      alt={charm.name}
                      className="charm-image"
                      title={charm.name}
                      onError={(e) => {
                        e.target.src = defaultSilverCharmImage;
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;