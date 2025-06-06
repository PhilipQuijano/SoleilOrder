import React from 'react';
import Hero from './components/Hero/Hero';
import About from './components/About/About';
import UpcomingEvents from './components/UpcomingEvents/UpcomingEvents';

const HomePage = () => {
  return (
    <>
      <Hero />
      <UpcomingEvents />
      <About />

    </>
  );
};

export default HomePage;
