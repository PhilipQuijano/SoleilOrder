import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Star from '../icons/Star';
import { supabase } from '../../../api/supabaseClient';
import './AboutPage.css';
import { Instagram, Facebook} from 'lucide-react';

const linkVariants = {
  hover: { scale: 1.1 },
  tap: { scale: 0.95 }
};

const AboutPage = () => {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAllGallery, setShowAllGallery] = useState(false);

  useEffect(() => {
    fetchAboutImages();
  }, []);

  const fetchAboutImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await supabase
        .storage
        .from('about-images')
        .list('', { limit: 100 });
      
      if (error) {
        setError(`Failed to load images: ${error.message}`);
        return;
      }
      
      if (!data || data.length === 0) {
        setImages([]);
        return;
      }
      
      // Filter for valid image files
      const imageFiles = data.filter(file => 
        file.name && 
        file.name.match(/\.(jpg|jpeg|png|gif|webp)$/i) &&
        file.id
      );
      
      const imageUrls = imageFiles.map(file => ({
        id: file.id,
        url: supabase.storage.from('about-images').getPublicUrl(file.name).data.publicUrl,
        name: file.name
      }));
      
      setImages(imageUrls);
    } catch (error) {
      setError(`Failed to load images: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Auto-advance carousel
  useEffect(() => {
    if (images.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentImageIndex(prev => 
        prev === images.length - 1 ? 0 : prev + 1
      );
    }, 5000);
    
    return () => clearInterval(interval);
  }, [images.length]);

  const nextImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex(prev => 
      prev === images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    if (images.length === 0) return;
    setCurrentImageIndex(prev => 
      prev === 0 ? images.length - 1 : prev - 1
    );
  };

  const getImagePosition = (index) => {
    if (images.length === 0) return 'hidden';
    
    const diff = index - currentImageIndex;
    const totalImages = images.length;
    
    // Handle wraparound
    let normalizedDiff = diff;
    if (Math.abs(diff) > totalImages / 2) {
      normalizedDiff = diff > 0 ? diff - totalImages : diff + totalImages;
    }
    
    if (normalizedDiff === 0) return 'center';
    if (normalizedDiff === -1) return 'left';
    if (normalizedDiff === 1) return 'right';
    return 'hidden';
  };

  const handleImageError = (e) => {
    e.target.style.display = 'none';
  };

  return (
    <div className="aboutpage-container">
      {/* Hero Section with Carousel */}
      <section className="aboutpage-hero">
        <div className="hero-content">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <h1 className="hero-title">About <span className="brand-highlight">Soleil</span></h1>
            <p className="hero-subtitle">Handcrafted charm bracelets made to celebrate you — personal, playful, and designed with care.</p>
          </motion.div>
        </div>
        
        {/* Image Carousel */}
        <motion.div 
          className="carousel-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          {loading ? (
            <div className="carousel-loading">
              <div className="loading-spinner"></div>
              <p className="loading-text">Loading gallery...</p>
            </div>
          ) : error ? (
            <div className="carousel-error">
              <p className="error-text">{error}</p>
              <button onClick={fetchAboutImages} className="retry-button">
                Try Again
              </button> 
            </div>
          ) : images.length > 0 ? (
            <>
              {!showAllGallery ? (
                <div className="image-carousel">
                  {images.length > 1 && (
                    <button 
                      className="carousel-nav prev" 
                      onClick={prevImage}
                      aria-label="Previous image"
                    >
                      &#8249;
                    </button>
                  )}
                  
                  <div className="carousel-track">
                    {(() => {
                      if (images.length === 0) return null;
                      const total = images.length;
                      const prevIndex = (currentImageIndex - 1 + total) % total;
                      const nextIndex = (currentImageIndex + 1) % total;
                      const visible = [
                        { idx: prevIndex, position: 'left' },
                        { idx: currentImageIndex, position: 'center' },
                        { idx: nextIndex, position: 'right' }
                      ];
                      return visible.map(({ idx, position }) => {
                        const image = images[idx];
                        return (
                          <div key={image.id} className={`carousel-image-container ${position}`}>
                            <img
                              src={image.url}
                              alt={`Soleil Gallery ${idx + 1}`}
                              className="carousel-image"
                              onError={handleImageError}
                              loading={position === 'center' ? 'eager' : 'lazy'}
                            />
                          </div>
                        );
                      });
                    })()}
                  </div>
                  
                  {images.length > 1 && (
                    <>
                      <button 
                        className="carousel-nav next" 
                        onClick={nextImage}
                        aria-label="Next image"
                      >
                        &#8250;
                      </button>
                      
                    </>
                  )}            
                </div>
              ) : (
                <div className="full-gallery-grid">
                  {images.map((image, index) => (
                    <motion.div
                      key={image.id}
                      className="gallery-grid-item"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.05 }}
                    >
                      <img
                        src={image.url}
                        alt={`Soleil Gallery ${index + 1}`}
                        className="gallery-grid-image"
                        onError={handleImageError}
                        loading="lazy"
                      />
                    </motion.div>
                  ))}
                </div>
              )}
              
              {/* Gallery Toggle Button */}
              <motion.div
                className="gallery-toggle-container"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <button
                  className="gallery-toggle-button"
                  onClick={() => setShowAllGallery(!showAllGallery)}
                  aria-label={showAllGallery ? "View carousel" : "View all images"}
                >
                  <span className="toggle-icon">
                    {showAllGallery ? '◀' : '▼'}
                  </span>
                  <span className="toggle-text">
                    {showAllGallery ? 'Hide Images' : 'View All Images'}
                  </span>
                </button>
              </motion.div>
            </>
          ) : (
            <div className="no-images">
              <div className="no-images-content">
                <div className="no-images-icon">📷</div>
                <p className="no-images-text">Gallery coming soon...</p>
              </div>
            </div>
          )}
        </motion.div>
      </section>

      {/* Main Content Section */}
      <section className="main-content">
        <div className="container">
          {/* Customization Experience */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true, margin: "-100px" }}
            className="experience-content"
            style={{ marginTop: '30px' }}
          >
            <h2 className="section-title font-cormorant-medium">Your Personalized Experience</h2>
            <div className="experience-grid">
              <motion.div 
                className="experience-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.02,
                  y: -6,
                  transition: { duration: 0.25 }
                }}
              >
                <div className="card-top no-icon">
                  <h3 className="card-title font-montserrat-bold">Custom Design</h3>
                </div>
                <p className="card-desc font-inter-regular">Use our intuitive builder to compose a bracelet that reflects your story — select charms, arrange order, and preview in real time.</p>
              </motion.div>
              <motion.div 
                className="experience-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.02,
                  y: -6,
                  transition: { duration: 0.25 }
                }}
              >
                <div className="card-top no-icon">
                  <h3 className="card-title font-montserrat-bold">Quality Craftsmanship</h3>
                </div>
                <p className="card-desc font-inter-regular">Hand-finished details and curated materials ensure every charm and bracelet is built to last and delight.</p>
              </motion.div>
              <motion.div 
                className="experience-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: 'true' }}
                whileHover={{ 
                  scale: 1.02,
                  y: -6,
                  transition: { duration: 0.25 }
                }}
              >
                <div className="card-top no-icon">
                  <h3 className="card-title font-montserrat-bold">Frequent Updates</h3>
                </div>
                <p className="card-desc font-inter-regular">New charms, seasonal drops, and limited collaborations — stay in the loop for curated releases you won't want to miss.</p>
              </motion.div>
            </div>
            
            <motion.div 
              className="future-plans"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.02,
                y: -5,
                transition: { duration: 0.3 }
              }}
            >
              <h3 className="font-montserrat-bold">What's Coming Next?</h3>
              <p className="font-inter-regular">
                We're excited to announce that Soleil is expanding! In the coming months, expect to see:
              </p>
              <ul className="font-inter-regular">
                <li><Star className="list-star" />New jewelry categories including rings, necklaces, and earrings</li>
                <li><Star className="list-star" />Seasonal charm collections</li>
                <li><Star className="list-star" />Limited edition collaborations</li>
                <li><Star className="list-star" />Enhanced customization options</li>
              </ul>
              <p className="font-inter-regular">
                Stay tuned for these exciting additions to the Soleil family!
              </p>
            </motion.div>

            <h2 className="section-title font-cormorant-medium">The Developers</h2>
            <motion.div 
              className="future-plans"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              viewport={{ once: true }}
              whileHover={{ 
                scale: 1.02,
                y: -5,
                transition: { duration: 0.3 }
              }}
            >
              <h3 className="dev-list-title font-montserrat-bold">Website crafted with ❤️by</h3>
              <ul className="dev-list font-inter-regular">
                <li><Star className="list-star" />Philip Quijano</li>
                <li><Star className="list-star" />Trish Aguarin</li>
                <li><Star className="list-star" />Diane Cabato</li>
                <li><Star className="list-star" />Mikhos Gumapos</li>
                <li><Star className="list-star" />Chrystel Marcelo</li>
                <li><Star className="list-star" />Anja Gonzales</li>
                <li><Star className="list-star" />Zach Francisco</li>
                <li><Star className="list-star" />Angelo Rocha</li>
              </ul>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <section className="developer-credit">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="credit-content"
          >

            <p className="credit-text font-inter-regular">
              Follow us ❤️ 
            </p>

            <div className="credit-line"></div>
            <div className="social-icons flex gap-4 mt-4">
              <motion.a
                href="https://www.instagram.com/soleilphl/"
                target="_blank"
                rel="noopener noreferrer"
                className="social-link"
                variants={linkVariants}
                whileHover="hover"
                whileTap="tap"
              >
                <Instagram size={20} />
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
                <Facebook size={20} />
              </motion.a>
            </div>

          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;