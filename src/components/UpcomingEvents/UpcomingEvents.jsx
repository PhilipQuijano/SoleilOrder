import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './UpcomingEvents.css';
import { supabase } from '../../../api/supabaseClient';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [imageLoaded, setImageLoaded] = useState({});

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      console.log('Fetching events from Supabase...');
      
      const { data, error } = await supabase
        .from('events')
        .select('*');
      
      console.log('Supabase response:', { data, error });
      
      if (error) {
        console.error('Supabase error:', error);
        setEvents([]);
        return;
      }
      
      if (data && data.length > 0) {
        console.log('Events found:', data.length);
        console.log('First event:', data[0]);
        setEvents(data);
        
        // Initialize image loading state
        const loadingState = {};
        data.forEach((_, index) => {
          loadingState[index] = false;
        });
        setImageLoaded(loadingState);
      } else {
        console.log('No events found in database');
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  // Preload images
  useEffect(() => {
    if (events.length > 0) {
      events.forEach((event, index) => {
        if (event.image && !imageLoaded[index]) {
          const img = new Image();
          img.onload = () => {
            setImageLoaded(prev => ({ ...prev, [index]: true }));
          };
          img.onerror = () => {
            console.log(`Failed to load image for event ${index}:`, event.image);
            setImageLoaded(prev => ({ ...prev, [index]: false }));
          };
          img.src = event.image;
        }
      });
    }
  }, [events, imageLoaded]);

  // Auto-advance the carousel every 6 seconds (only if there are events)
  useEffect(() => {
    if (events.length <= 1) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 6000);
    
    return () => clearInterval(interval);
  }, [currentIndex, events.length]);

  const nextSlide = () => {
    if (events.length === 0) return;
    setDirection(1);
    setCurrentIndex((prevIndex) => 
      prevIndex === events.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    if (events.length === 0) return;
    setDirection(-1);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? events.length - 1 : prevIndex - 1
    );
  };

  const goToSlide = (index) => {
    if (events.length === 0) return;
    setDirection(index > currentIndex ? 1 : -1);
    setCurrentIndex(index);
  };

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0,
      scale: 0.8
    })
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date TBD';
    
    // If it's already a formatted string or not a valid date, return as is
    if (typeof dateString === 'string' && !dateString.includes('-') && !dateString.includes('/')) {
      return dateString;
    }
    
    try {
      const date = new Date(dateString);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return dateString; // Return original string if not a valid date
      }
      
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return dateString;
    }
  };

  if (loading) {
    return (
      <div className="upcoming-events-container">
        <h2 className="section-title">Upcoming Events</h2>
        <div className="loading-message">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading events...
          </motion.div>
        </div>
      </div>
    );
  }

  // Debug: Log the current state
  console.log('Component render - Events:', events, 'Loading:', loading);

  if (events.length === 0) {
    return (
      <div className="upcoming-events-container">
        <h2 className="section-title">Upcoming Events</h2>
        <motion.div 
          className="no-events-message"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          More events to come!
        </motion.div>
      </div>
    );
  }

  const currentEvent = events[currentIndex];

  return (
    <div className="upcoming-events-container">
      <motion.h2 
        className="section-title"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        Upcoming Events
      </motion.h2>
      
      <div className="carousel-container">
        {events.length > 1 && (
          <button className="carousel-button prev" onClick={prevSlide}>
            &#8249;
          </button>
        )}
        
        <div className="carousel-content">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{
                x: { type: "spring", stiffness: 300, damping: 30 },
                opacity: { duration: 0.3 },
                scale: { duration: 0.3 }
              }}
              className="carousel-slide"
            >
              <div className="event-card">
                <div 
                  className="event-image" 
                  style={{ 
                    backgroundImage: currentEvent?.image ? `url(${currentEvent.image})` : 'none'
                  }}
                >
                  {!currentEvent?.image && (
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '1.2rem',
                      textAlign: 'center',
                      zIndex: 1
                    }}>
                      No Image Available
                    </div>
                  )}
                </div>
                <div className="event-details">
                  <h3>{currentEvent?.title || 'No Title'}</h3>
                  <p className="event-date">
                    {formatDate(currentEvent?.date)}
                  </p>
                  <p className="event-description">
                    {currentEvent?.description || 'No Description'}
                  </p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        {events.length > 1 && (
          <button className="carousel-button next" onClick={nextSlide}>
            &#8250;
          </button>
        )}
      </div>
      
      {events.length > 1 && (
        <div className="carousel-indicators">
          {events.map((_, index) => (
            <button
              key={index}
              className={`indicator ${index === currentIndex ? 'active' : ''}`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default UpcomingEvents;