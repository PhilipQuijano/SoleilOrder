import React, { useState, useEffect, useRef } from 'react';
import './About.css';
import { fetchCharms } from '../../../api/getCharms';
import defaultSilverCharmImage from '../../assets/default-silver-charm.jpg';

/**
 * About component that displays an animated grid of charm images
 * Automatically cycles through random charm selections every 4 seconds
 */

const About = () => {
  const [displayCharms, setDisplayCharms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animationKey, setAnimationKey] = useState(0);
  
  const animationInterval = useRef(null);
  const isAnimating = useRef(false);
  const preloadedImages = useRef(new Map());
  const charmsData = useRef([]); // Store fetched charms data
  

  const getAnimationDelay = (index) => {
    const screenWidth = window.innerWidth;
    if (screenWidth <= 576) return index * 0.003; 
    if (screenWidth <= 768) return index * 0.008; 
    return index * 0.02; 
  };

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

  const preloadCharmImages = async (charms) => {
    if (!charms || charms.length === 0) return;

    const preloadPromises = charms.map(charm => {
      const imageSrc = charm.image || defaultSilverCharmImage;
      return preloadImage(imageSrc, charm.id);
    });

    try {
      await Promise.all(preloadPromises);
    } catch (error) {
      console.warn('Failed to preload some charm images:', error);
    }
  };

  /**
   * Get random selection of charms from collection
   * @param {Array} charms - Available charms
   * @param {number} count - Number of charms to select
   * @returns {Array} Random selection of charms
   */
  const getRandomCharms = (charms, count = 20) => {
    if (!charms || charms.length === 0) return [];
    
    // Fisher-Yates shuffle algorithm
    const indices = Array.from({ length: charms.length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    
    return indices.slice(0, Math.min(count, charms.length)).map(i => charms[i]);
  };

  /**
   * Cycle to new charm selection with preloading
   */
  const cycleCharms = async () => {
    if (isAnimating.current || !charmsData.current || charmsData.current.length === 0) return;
    
    isAnimating.current = true;
    
    const newCharms = getRandomCharms(charmsData.current, 20);
    await preloadCharmImages(newCharms);
    
    setDisplayCharms(newCharms);
    setAnimationKey(prev => prev + 1);
    
    // Preload next batch in background for smoother transitions
    setTimeout(() => {
      const nextBatch = getRandomCharms(charmsData.current, 20);
      preloadCharmImages(nextBatch);
    }, 1000);
    
    // Reset animation flag after transition completes
    setTimeout(() => {
      isAnimating.current = false;
    }, 3000);
  };

  // Main effect - Load charms and setup cycling
  useEffect(() => {
    let isMounted = true;
    
    const loadAllCharms = async () => {
      setLoading(true);
      try {
        const charmsFromDB = await fetchCharms();
        
        if (!isMounted) return;
        
        if (charmsFromDB && charmsFromDB.length > 0) {
          charmsData.current = charmsFromDB;
          
          // Initialize with preloaded charms
          const initialCharms = getRandomCharms(charmsFromDB, 20);
          await preloadCharmImages(initialCharms);
          
          if (!isMounted) return;
          
          setDisplayCharms(initialCharms);
          setAnimationKey(0);
          
          // Start cycling interval
          animationInterval.current = setInterval(cycleCharms, 4000);
          
          // Background preload additional batches for performance
          setTimeout(() => {
            for (let i = 0; i < 3; i++) {
              setTimeout(() => {
                if (isMounted) {
                  const nextBatch = getRandomCharms(charmsFromDB, 20);
                  preloadCharmImages(nextBatch);
                }
              }, i * 500);
            }
          }, 2000);
        }
      } catch {
        // Component gracefully handles fetch failures
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };
    
    loadAllCharms();

    // Cleanup function
    return () => {
      isMounted = false;
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
            <div className="about-images">
              <div className="about-charms-belts">
                {/* TOP BELT */}
                <div className="belt-strip top">
                  <div className="belt-track">
                    {loading ? (
                      [...Array(20)].map((_, i) => (
                        <div key={`ph-top-${i}`} className="belt-item loading-charm">
                          <div className="loading-placeholder"></div>
                        </div>
                      ))
                    ) : (
                      <>
                        {displayCharms.map((charm, i) => (
                          <div key={`top-${charm.id}-${i}`} className="belt-item">
                            <img
                              src={preloadedImages.current.get(charm.id) || charm.image || defaultSilverCharmImage}
                              alt={charm.name}
                              className="charm-image"
                              title={charm.name}
                              onError={(e) => { e.target.src = defaultSilverCharmImage; }}
                            />
                          </div>
                        ))}
                        {displayCharms.map((charm, i) => (
                          <div key={`top-dup-${charm.id}-${i}`} className="belt-item">
                            <img
                              src={preloadedImages.current.get(charm.id) || charm.image || defaultSilverCharmImage}
                              alt={charm.name}
                              className="charm-image"
                              title={charm.name}
                              onError={(e) => { e.target.src = defaultSilverCharmImage; }}
                            />
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>

                {/* CENTER TEXT */}
                <div className="about-text" style={{ textAlign: 'center' }}>
                  <h2>Bringing <span className="italic">your vision</span> to life</h2>
                </div>

                {/* BOTTOM BELT */}
                <div className="belt-strip bottom">
                  <div className="belt-track">
                    {loading ? (
                      [...Array(20)].map((_, i) => (
                        <div key={`ph-bot-${i}`} className="belt-item loading-charm">
                          <div className="loading-placeholder"></div>
                        </div>
                      ))
                    ) : (
                      <>
                        {displayCharms.map((charm, i) => (
                          <div key={`bot-${charm.id}-${i}`} className="belt-item">
                            <img
                              src={preloadedImages.current.get(charm.id) || charm.image || defaultSilverCharmImage}
                              alt={charm.name}
                              className="charm-image"
                              title={charm.name}
                              onError={(e) => { e.target.src = defaultSilverCharmImage; }}
                            />
                          </div>
                        ))}
                        {displayCharms.map((charm, i) => (
                          <div key={`bot-dup-${charm.id}-${i}`} className="belt-item">
                            <img
                              src={preloadedImages.current.get(charm.id) || charm.image || defaultSilverCharmImage}
                              alt={charm.name}
                              className="charm-image"
                              title={charm.name}
                              onError={(e) => { e.target.src = defaultSilverCharmImage; }}
                            />
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
    </div>
  );
};

export default About;