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
  const preloadedImages = useRef(new Map());
  const preloadQueue = useRef([]);
  
  const getAnimationDelay = (index) => {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 576) return index * 0.003; 
    if (screenWidth <= 768) return index * 0.008; 
    return index * 0.02; 
  };

  // Preload individual image
  const preloadImage = (src, charmId) => {
    return new Promise((resolve) => {
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
        preloadedImages.current.set(charmId, defaultSilverCharmImage);
        resolve(false);
      };
      img.src = src;
    });
  };

  // Preload batch of charm images
  const preloadCharmImages = async (charms) => {
    if (!charms || charms.length === 0) return;

    const preloadPromises = charms.map(charm => {
      const imageSrc = charm.image || defaultSilverCharmImage;
      return preloadImage(imageSrc, charm.id);
    });

    try {
      await Promise.all(preloadPromises);
    } catch (error) {
      // Silent fail for image preloading
    }
  };

  // Get random charms from available collection
  const getRandomCharms = (charms, count = 20) => {
    if (!charms || charms.length === 0) return [];
    
    const indices = Array.from({ length: charms.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return indices.slice(0, Math.min(count, charms.length)).map(i => charms[i]);
  };

  // Cycle to new charms with preloading
  const cycleCharms = async (charms) => {
    if (isAnimating.current || !charms || charms.length === 0) return;
    
    isAnimating.current = true;
    
    const newCharms = getRandomCharms(charms, 20);
    await preloadCharmImages(newCharms);
    
    setDisplayCharms(newCharms);
    setAnimationKey(prev => prev + 1);
    
    // Preload next batch in background
    setTimeout(() => {
      const nextBatch = getRandomCharms(charms, 20);
      preloadCharmImages(nextBatch);
    }, 1000);
    
    // Reset animation flag
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
          
          // Initialize with preloaded charms
          const initialCharms = getRandomCharms(charmsFromDB, 20);
          await preloadCharmImages(initialCharms);
          
          setDisplayCharms(initialCharms);
          setAnimationKey(0);
          
          // Start cycling interval
          animationInterval.current = setInterval(() => {
            cycleCharms(charmsFromDB);
          }, 4000);
          
          // Background preload additional batches
          setTimeout(() => {
            for (let i = 0; i < 3; i++) {
              setTimeout(() => {
                const nextBatch = getRandomCharms(charmsFromDB, 20);
                preloadCharmImages(nextBatch);
              }, i * 500);
            }
          }, 2000);
        }
      } catch (error) {
        // Silent fail - component will show loading state
      } finally {
        setLoading(false);
      }
    }
    
    loadAllCharms();

    return () => {
      if (animationInterval.current) {
        clearInterval(animationInterval.current);
      }
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
                      animationDelay: `${getAnimationDelay(i)}s`
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