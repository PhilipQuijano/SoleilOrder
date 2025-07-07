import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};

export const CartProvider = ({ children }) => {
  // Initialize state from localStorage or empty array
  const [cartBracelets, setCartBracelets] = useState(() => {
    try {
      const savedCart = localStorage.getItem('cartBracelets');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Error loading cart from localStorage:', error);
      return [];
    }
  });

  const [totalCartPrice, setTotalCartPrice] = useState(0);

  // Save cart to localStorage whenever cartBracelets changes
  useEffect(() => {
    try {
      localStorage.setItem('cartBracelets', JSON.stringify(cartBracelets));
    } catch (error) {
      console.error('Error saving cart to localStorage:', error);
    }
  }, [cartBracelets]);

  // Calculate total price whenever cart changes
  useEffect(() => {
    const total = cartBracelets.reduce((sum, bracelet) => sum + bracelet.totalPrice, 0);
    setTotalCartPrice(total);
  }, [cartBracelets]);

  // Add bracelet to cart
  const addBraceletToCart = (braceletData) => {
    const newBracelet = {
      id: Date.now(), // Temporary ID for cart management
      ...braceletData,
      addedAt: new Date()
    };
    setCartBracelets(prev => [...prev, newBracelet]);
    return newBracelet.id;
  };

  // Remove bracelet from cart
  const removeBraceletFromCart = (braceletId) => {
    setCartBracelets(prev => prev.filter(bracelet => bracelet.id !== braceletId));
  };

  // Update bracelet in cart
  const updateBraceletInCart = (braceletId, updatedData) => {
    setCartBracelets(prev => 
      prev.map(bracelet => 
        bracelet.id === braceletId 
          ? { ...bracelet, ...updatedData }
          : bracelet
      )
    );
  };

  // Clear cart
  const clearCart = () => {
    setCartBracelets([]);
  };

  // Get bracelet count
  const getBraceletCount = () => cartBracelets.length;

  const editBracelet = (braceletId, updatedBracelet) => {
    setCartBracelets(prevBracelets => 
      prevBracelets.map(bracelet => 
        bracelet.id === braceletId ? { ...updatedBracelet, id: braceletId } : bracelet
      )
    );
  };

  const value = {
    cartBracelets,
    editBracelet,
    totalCartPrice,
    addBraceletToCart,
    removeBraceletFromCart,
    updateBraceletInCart,
    clearCart,
    getBraceletCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};