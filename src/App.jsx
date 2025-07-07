import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import HomePage from './HomePage';
import CustomizeBracelet from './components/CustomizeBracelet/CustomizeBracelet';
import AboutPage from './components/AboutPage/AboutPage';
import './App.css';
import Checkout from './components/Checkout/Checkout';
import { AnimatePresence } from 'framer-motion';
import './components/GlobalTransitions.css';
import { CartProvider } from './contexts/CartContext';
import Cart from './components/Cart/Cart';

const App = () => {
  return (
    <CartProvider>
      <Router>
        <Navbar />
        <AnimatePresence mode="wait">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/customize" element={<CustomizeBracelet />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/cart" element={<Cart />} />
          </Routes>
        </AnimatePresence>
      </Router>
    </CartProvider>
  );
};

export default App;