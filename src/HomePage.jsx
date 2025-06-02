import React from 'react';
import Hero from './components/Hero/Hero';
import About from './components/About/About';
import Customize from './components/Customize/Customize';

const HomePage = () => {
  return (
    <>
      <Hero />
      <About />
      <Customize />
    </>
  );
};

export default HomePage;