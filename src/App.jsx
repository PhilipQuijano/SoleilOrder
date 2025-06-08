import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar/Navbar';
import HomePage from './HomePage';
import CustomizeBracelet from './components/CustomizeBracelet/CustomizeBracelet';
import './App.css';
import InventoryManagement from './components/InventoryManagement/InventoryManagement';
import NavbarDebug from './components/Navbar/NavbarDebug';
import Checkout from './components/Checkout/Checkout';
import { AnimatePresence } from 'framer-motion';
import './components/GlobalTransitions.css';

const App = () => {
  return (
    <Router>
      <Navbar />
      <AnimatePresence mode="wait">
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/customize" element={<CustomizeBracelet />} />
        <Route path="/admin/inventory" element={<InventoryManagement />} />
        <Route path ="/NavbarDebug" element={<NavbarDebug />} />
        <Route path="checkout" element={<Checkout />} />
        {/* Add more routes as needed */}
      </Routes>
      </AnimatePresence>
    </Router>
  );
};

export default App;