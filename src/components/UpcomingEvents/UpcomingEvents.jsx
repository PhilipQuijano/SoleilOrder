import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './UpcomingEvents.css';
import { supabase } from '../../../api/supabaseClient';

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (!error && data.length > 0) {
        setEvents(data);
      } else if (data.length === 0) {
        // If no events in database, you can optionally show a message
        setEvents([]);
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-advance the carousel every 5 seconds (only if there are events)
  useEffect(() => {
    if (events.length === 0) return;
    
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
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

  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  if (loading) {
    return (
      <div className="upcoming-events-container">
        <h2 className="section-title">Upcoming Events</h2>
        <div className="loading-message">Loading events...</div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="upcoming-events-container">
        <h2 className="section-title">Upcoming Events</h2>
        <div className="no-events-message">No upcoming events at the moment.</div>
      </div>
    );
  }

  return (
    <div className="upcoming-events-container">
      <h2 className="section-title">Upcoming Events</h2>
      
      <div className="carousel-container">
        <button className="carousel-button prev" onClick={prevSlide}>
          &lt;
        </button>
        
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
                opacity: { duration: 0.2 }
              }}
              className="carousel-slide"
            >
              <div className="event-card">
                <div 
                  className="event-image" 
                  style={{ backgroundImage: `url(${events[currentIndex].image})` }}
                ></div>
                <div className="event-details">
                  <h3>{events[currentIndex].title}</h3>
                  <p className="event-date">{events[currentIndex].date}</p>
                  <p className="event-description">{events[currentIndex].description}</p>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
        
        <button className="carousel-button next" onClick={nextSlide}>
          &gt;
        </button>
      </div>
      
      <div className="carousel-indicators">
        {events.map((_, index) => (
          <button
            key={index}
            className={`indicator ${index === currentIndex ? 'active' : ''}`}
            onClick={() => {
              setDirection(index > currentIndex ? 1 : -1);
              setCurrentIndex(index);
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default UpcomingEvents;