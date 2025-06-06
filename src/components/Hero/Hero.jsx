// Hero.jsx - Updated with animations and upcoming events
import React from 'react';
import './Hero.css';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import backgroundImage from '../../assets/charms-background.jpg';
import UpcomingEvents from '../UpcomingEvents/UpcomingEvents';

const Hero = () => {
  return (
    <section className='hero' style={{ backgroundImage: `linear-gradient(rgba(88, 46, 78, 0.8), rgba(88, 46, 78, 0.8)), url(${backgroundImage})` }}>
      <div className="hero-content">
        <div className="hero-text">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Every charm <br />tells a <span className="italic">story</span>
          </motion.h1>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            <Link to="/customize" className='customize-btn hover-grow'>
              CUSTOMIZE YOURS
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
