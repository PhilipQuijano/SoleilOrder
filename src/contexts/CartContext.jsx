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

  const [cartCharms, setCartCharms] = useState(() => {
    try {
      const savedCharms = localStorage.getItem('cartCharms');
      return savedCharms ? JSON.parse(savedCharms) : [];
    } catch (error) {
      console.error('Error loading charms from localStorage:', error);
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

  // Save charms to localStorage whenever cartCharms changes
  useEffect(() => {
    try {
      localStorage.setItem('cartCharms', JSON.stringify(cartCharms));
    } catch (error) {
      console.error('Error saving charms to localStorage:', error);
    }
  }, [cartCharms]);

  // Calculate total price whenever cart changes
  useEffect(() => {
    const braceletTotal = cartBracelets.reduce((sum, bracelet) => sum + bracelet.totalPrice, 0);
    const charmsTotal = cartCharms.reduce((sum, charm) => sum + (charm.price * charm.quantity), 0);
    setTotalCartPrice(braceletTotal + charmsTotal);
  }, [cartBracelets, cartCharms]);

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
    setCartCharms([]);
  };

  // Get bracelet count
  const getBraceletCount = () => cartBracelets.length;

  // Get total item count (bracelets + charm types)
  const getItemCount = () => cartBracelets.length + cartCharms.length;

  const editBracelet = (braceletId, updatedBracelet) => {
    setCartBracelets(prevBracelets => 
      prevBracelets.map(bracelet => 
        bracelet.id === braceletId ? { ...updatedBracelet, id: braceletId } : bracelet
      )
    );
  };

  // Add individual charm to cart
  const addCharmToCart = (charmData) => {
    setCartCharms(prev => {
      // Check if charm already exists in cart
      const existingIndex = prev.findIndex(item => item.id === charmData.id);
      
      if (existingIndex !== -1) {
        // Update quantity of existing charm
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + charmData.quantity
        };
        return updated;
      } else {
        // Add new charm to cart
        return [...prev, {
          ...charmData,
          cartItemId: Date.now() // Unique ID for cart management
        }];
      }
    });
  };

  // Remove individual charm from cart
  const removeCharmFromCart = (cartItemId) => {
    setCartCharms(prev => prev.filter(charm => charm.cartItemId !== cartItemId));
  };

  // Update charm quantity in cart
  const updateCharmQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeCharmFromCart(cartItemId);
      return;
    }
    
    setCartCharms(prev => 
      prev.map(charm => 
        charm.cartItemId === cartItemId 
          ? { ...charm, quantity: newQuantity }
          : charm
      )
    );
  };

  const value = {
    cartBracelets,
    cartCharms,
    editBracelet,
    totalCartPrice,
    addBraceletToCart,
    removeBraceletFromCart,
    updateBraceletInCart,
    addCharmToCart,
    removeCharmFromCart,
    updateCharmQuantity,
    clearCart,
    getBraceletCount,
    getItemCount
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};