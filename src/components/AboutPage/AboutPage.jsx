import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../api/supabaseClient';
import './AboutPage.css';

const AboutPage = () => {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

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
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentImageIndex}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                    className="carousel-image-container"
                  >
                    <img 
                      src={images[currentImageIndex]?.url}
                      alt={`Soleil Gallery ${currentImageIndex + 1}`}
                      className="carousel-image"
                      onError={handleImageError}
                      loading="lazy"
                    />
                  </motion.div>
                </AnimatePresence>
              </div>
              
              {images.length > 1 && (
                <button 
                  className="carousel-nav next" 
                  onClick={nextImage}
                  aria-label="Next image"
                >
                  &#8250;
                </button>
              )}            
            </div>
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
                <li><svg className="list-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>New jewelry categories including rings, necklaces, and earrings</li>
                <li><svg className="list-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>Seasonal charm collections</li>
                <li><svg className="list-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>Limited edition collaborations</li>
                <li><svg className="list-star" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>Enhanced customization options</li>
              </ul>
              <p className="font-inter-regular">
                Stay tuned for these exciting additions to the Soleil family!
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Developer Credit */}
      <section className="developer-credit">
        <div className="container">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="credit-content"
          >
            <div className="credit-line"></div>
            <p className="credit-text font-inter-regular">
              Website crafted with ❤️ by 
            </p>
            <p className="credit-developer">
              <a href="https://github.com/PhilipQuijano" target="_blank" rel="noopener noreferrer" className="developer-link font-montserrat-semibold">
                Philip Quijano
              </a>
            </p>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;