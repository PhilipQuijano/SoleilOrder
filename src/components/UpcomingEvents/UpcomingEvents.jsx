import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './UpcomingEvents.css';
import { supabase } from '../../../api/supabaseClient';

// Sample event data - this would be replaced with actual data from a CMS or database
const sampleEvents = [
  {
    id: 1,
    title: "Summer Charm Collection Launch",
    date: "July 15, 2025",
    description: "Join us for the exclusive launch of our Summer Charm Collection featuring new designs inspired by ocean treasures.",
    image: "https://images.unsplash.com/photo-1515377905703-c4788e51af15?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
  },
  {
    id: 2,
    title: "Bracelet Customization Workshop",
    date: "August 5, 2025",
    description: "Learn how to design your perfect bracelet with our expert craftspeople in this hands-on workshop.",
    image: "https://images.unsplash.com/photo-1617038220319-276d3cfab638?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
  },
  {
    id: 3,
    title: "Holiday Gift Preview",
    date: "September 20, 2025",
    description: "Get an early look at our holiday collection and special gift sets perfect for the upcoming season.",
    image: "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80"
  }
];

const UpcomingEvents = () => {
  const [events, setEvents] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, []);

    const fetchEvents = async () => {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('date', { ascending: true });
    
    if (!error && data.length > 0) {
      setEvents(data);
    }
  };
  // Auto-advance the carousel every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      nextSlide();
    }, 5000);
    
    return () => clearInterval(interval);
  }, [currentIndex]);

  const nextSlide = () => {
    setDirection(1);
    setCurrentIndex((prevIndex) => 
      prevIndex === sampleEvents.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevSlide = () => {
    setDirection(-1);
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? sampleEvents.length - 1 : prevIndex - 1
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
                  style={{ backgroundImage: `url(${sampleEvents[currentIndex].image})` }}
                ></div>
                <div className="event-details">
                  <h3>{sampleEvents[currentIndex].title}</h3>
                  <p className="event-date">{sampleEvents[currentIndex].date}</p>
                  <p className="event-description">{sampleEvents[currentIndex].description}</p>
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
        {sampleEvents.map((_, index) => (
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
