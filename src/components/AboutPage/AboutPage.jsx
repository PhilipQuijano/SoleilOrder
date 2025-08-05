import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../../api/supabaseClient';
import './AboutPage.css';

const AboutPage = () => {
  const [images, setImages] = useState([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchAboutImages();
  }, []);

  const fetchAboutImages = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if about-images bucket exists
      const { data: buckets } = await supabase.storage.listBuckets();
      const aboutBucket = buckets?.find(bucket => bucket.name === 'about-images');
      
      if (!aboutBucket && buckets) {
        console.warn('About-images bucket not found, attempting to access anyway');
      }
      
      // Try multiple methods to fetch images
      let data, error;
      
      // Method 1: List with parameters
      const result1 = await supabase
        .storage
        .from('about-images')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (result1.error) {
        // Method 2: List without parameters
        const result2 = await supabase
          .storage
          .from('about-images')
          .list();
        
        if (result2.error) {
          // Method 3: List root directory explicitly
          const result3 = await supabase
            .storage
            .from('about-images')
            .list('/', { limit: 100 });
          
          data = result3.data;
          error = result3.error;
        } else {
          data = result2.data;
          error = result2.error;
        }
      } else {
        data = result1.data;
        error = result1.error;
      }
      
      if (error) {
        setError(`Storage error: ${error.message}`);
        setImages([]);
        return;
      }
      
      if (data && data.length > 0) {
        // Filter for valid image files
        const imageFiles = data.filter(file => {
          if (!file.name) return false;
          
          const isImage = file.name.match(/\.(jpg|jpeg|png|gif|webp|avif|bmp|tiff)$/i);
          const isNotFolder = file.name !== '.emptyFolderPlaceholder' && 
                             !file.name.endsWith('/') &&
                             file.id;
          
          return isImage && isNotFolder;
        });
        
        if (imageFiles.length > 0) {
          // Get public URLs for images
          const imageUrls = imageFiles.map(file => {
            const { data: urlData } = supabase
              .storage
              .from('about-images')
              .getPublicUrl(file.name);
            
            return {
              id: file.id || file.name,
              url: urlData.publicUrl,
              name: file.name,
              size: file.metadata?.size || 0,
              lastModified: file.updated_at || file.created_at
            };
          });
          setImages(imageUrls);
        } else {
          setImages([]);
        }
      } else {
        setImages([]);
      }
    } catch (error) {
      setError(`Failed to load images: ${error.message}`);
      setImages([]);
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
                  scale: 1.05,
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                <h3 className="font-montserrat-bold">Custom Design</h3>
                <p className="font-inter-regular">Create your perfect bracelet with our intuitive customization tool. Mix and match charms to tell your unique story.</p>
              </motion.div>
              <motion.div 
                className="experience-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                viewport={{ once: true }}
                whileHover={{ 
                  scale: 1.05,
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                <h3 className="font-montserrat-bold">Quality Craftsmanship</h3>
                <p className="font-inter-regular">Each piece is carefully crafted with attention to detail, ensuring your jewelry is as beautiful as it is meaningful.</p>
              </motion.div>
              <motion.div 
                className="experience-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                viewport={{ once: 'true' }}
                whileHover={{ 
                  scale: 1.05,
                  y: -8,
                  transition: { duration: 0.3 }
                }}
              >
                <h3 className="font-montserrat-bold">Frequent Updates</h3>
                <p className="font-inter-regular">We're constantly adding new charms and expanding our collection. Check back regularly for fresh designs and seasonal specials.</p>
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
                <li>New jewelry categories including rings, necklaces, and earrings</li>
                <li>Seasonal charm collections</li>
                <li>Limited edition collaborations</li>
                <li>Enhanced customization options</li>
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