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
  const preloadedImages = useRef(new Map()); // Cache for preloaded images
  const preloadQueue = useRef([]); // Queue for images to preload

  // Function to preload an image
  const preloadImage = (src, charmId) => {
    return new Promise((resolve) => {
      // Skip if already preloaded
      if (preloadedImages.current.has(charmId)) {
        resolve(true);
        return;
      }

      const img = new Image();
      img.onload = () => {
        preloadedImages.current.set(charmId, src);
        resolve(true);
      };
      img.onerror = () => {
        // If image fails to load, cache the default image instead
        preloadedImages.current.set(charmId, defaultSilverCharmImage);
        resolve(false);
      };
      img.src = src;
    });
  };

  // Function to preload a batch of charm images
  const preloadCharmImages = async (charms) => {
    if (!charms || charms.length === 0) return;

    const preloadPromises = charms.map(charm => {
      const imageSrc = charm.image || defaultSilverCharmImage;
      return preloadImage(imageSrc, charm.id);
    });

    try {
      await Promise.all(preloadPromises);
    } catch (error) {
      console.warn('Some images failed to preload:', error);
    }
  };

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

  // Function to cycle to new charms with preloading
  const cycleCharms = async (charms) => {
    if (isAnimating.current || !charms || charms.length === 0) return;
    
    isAnimating.current = true;
    
    // Get new random charms
    const newCharms = getRandomCharms(charms, 20);
    
    // Preload the new charm images before displaying them
    await preloadCharmImages(newCharms);
    
    setDisplayCharms(newCharms);
    setAnimationKey(prev => prev + 1);
    
    // Start preloading the next batch while current one is displaying
    setTimeout(() => {
      const nextBatch = getRandomCharms(charms, 20);
      preloadCharmImages(nextBatch); // Preload next batch in background
    }, 1000);
    
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
          
          // Preload initial batch of images
          const initialCharms = getRandomCharms(charmsFromDB, 20);
          await preloadCharmImages(initialCharms);
          
          // Start cycling immediately with preloaded charms
          setDisplayCharms(initialCharms);
          setAnimationKey(0);
          
          // Start the cycling interval
          animationInterval.current = setInterval(() => {
            cycleCharms(charmsFromDB);
          }, 4000);
          
          // Preload a few more batches in the background for smoother transitions
          setTimeout(() => {
            for (let i = 0; i < 3; i++) {
              setTimeout(() => {
                const nextBatch = getRandomCharms(charmsFromDB, 20);
                preloadCharmImages(nextBatch);
              }, i * 500);
            }
          }, 2000);
          
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
      // Clear preloaded images cache on cleanup
      preloadedImages.current.clear();
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
                      src={preloadedImages.current.get(charm.id) || charm.image || defaultSilverCharmImage} 
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