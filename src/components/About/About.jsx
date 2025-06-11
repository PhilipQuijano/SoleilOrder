import React, { useState, useEffect } from 'react';
import './About.css';
import { fetchCharms } from '../../../api/getCharms';
import defaultSilverCharmImage from '../../assets/default-silver-charm.jpg';

const About = () => {
  const [displayCharms, setDisplayCharms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Function to get random charms with IDs 1-130
  const getRandomCharms = (charms, count = 20) => {
    // Filter charms with IDs 1-130
    const validCharms = charms.filter(charm => charm.id >= 1 && charm.id <= 130);
    
    // Shuffle the array and take the first 'count' items
    const shuffled = [...validCharms].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, Math.min(count, validCharms.length));
  };

  useEffect(() => {
    async function loadRandomCharms() {
      setLoading(true);
      try {
        const charmsFromDB = await fetchCharms();
        
        if (charmsFromDB && charmsFromDB.length > 0) {
          const randomCharms = getRandomCharms(charmsFromDB, 20);
          setDisplayCharms(randomCharms);
        } else {
          console.error('No charms data received from database');
        }
      } catch (error) {
        console.error('Error loading charms for About section:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadRandomCharms();
  }, []);

  return (
    <div className='about' id="about">
      <div className="main-container">
        <div className="about-content">
          <div className="about-text">
            <h2>Bringing <span className="italic">your vision</span> to life</h2>
            <p>
              What's special about your product, service or company? Use the space below to highlight things that set you apart from your competition, whether it's a special feature, a unique philosophy or awards and recognition that you have received. Think of this as your elevator pitch to get the reader's attention.
            </p>
          </div>
          <div className="about-images">
            <div className="charms-grid">
              {loading ? (
                // Show placeholder items while loading
                [...Array(20)].map((_, i) => (
                  <div key={i} className="charm-item loading-charm">
                    <div className="loading-placeholder"></div>
                  </div>
                ))
              ) : (
                // Show actual charms
                displayCharms.map((charm, i) => (
                  <div key={`${charm.id}-${i}`} className="charm-item">
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