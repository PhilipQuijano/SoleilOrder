import React from 'react';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Cart.css';

const Cart = () => {
  const { cartBracelets, totalCartPrice, removeBraceletFromCart, clearCart } = useCart();
  const navigate = useNavigate();

const handleEditBracelet = (braceletId) => {
  const braceletToEdit = cartBracelets.find(b => b.id === braceletId);
  navigate('/customize', { 
    state: { 
      editBracelet: braceletToEdit
    } 
  });
};

  const handleCheckout = () => {
    if (cartBracelets.length === 0) return;
    
    navigate('/checkout', {
      state: {
        bracelets: cartBracelets,
        totalPrice: totalCartPrice
      }
    });
  };

  const getPriceBreakdown = (bracelet) => {
    const breakdown = {};
    bracelet.charms.forEach(charm => {
      if (charm) {
        const key = `${charm.name}-${charm.price}`;
        if (breakdown[key]) {
          breakdown[key].count++;
        } else {
          breakdown[key] = {
            charm: charm,
            count: 1,
            totalPrice: charm.price
          };
        }
      }
    });
    
    Object.keys(breakdown).forEach(key => {
      breakdown[key].totalPrice = breakdown[key].count * breakdown[key].charm.price;
    });
    
    return Object.values(breakdown);
  };

  if (cartBracelets.length === 0) {
    return (
      <div className="cart-page">
        <motion.div 
          className="empty-cart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2>Your Cart is Empty</h2>
          <p>Start customizing your first bracelet!</p>
          <button 
            className="customize-button"
            onClick={() => navigate('/customize')}
          >
            Customize Bracelet
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="cart-page">
      <motion.div 
        className="cart-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div 
          className="cart-header"
          initial={{ x: -20, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h1>Your Cart ({cartBracelets.length} Bracelet{cartBracelets.length !== 1 ? 's' : ''})</h1>
          <button className="clear-cart-button" onClick={clearCart}>
            Clear Cart
          </button>
        </motion.div>

        <div className="cart-content">
          <div className="cart-bracelets">
            <AnimatePresence>
              {cartBracelets.map((bracelet, index) => (
                <motion.div
                  key={bracelet.id}
                  className="cart-bracelet-item"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: index * 0.1, duration: 0.5 }}
                >
                  {/* Bracelet Preview Section - Similar to Checkout */}
                  <div className="bracelet-preview">
                    <h3>Bracelet #{index + 1} - {bracelet.size}cm</h3>
                    <div className="bracelet-visual-small">
                      {bracelet.charms.map((charm, charmIndex) => (
                        <div key={charmIndex} className="charm-preview">
                          <img src={charm?.image} alt={charm?.name} />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Price Breakdown Section */}
                  <div className="bracelet-details">
                    <div className="price-breakdown">
                      {getPriceBreakdown(bracelet).map((item, idx) => (
                        <motion.div 
                          key={idx} 
                          className="price-item"
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 * idx, duration: 0.3 }}
                        >
                          <span>{item.charm.name} × {item.count}</span>
                          <span>₱{item.totalPrice.toLocaleString()}</span>
                        </motion.div>
                      ))}
                      
                      {/* Bracelet Total - Similar to Checkout Total */}
                      <div className="bracelet-total">
                        <div className="bracelet-total-row">
                          <span className="total-label">Bracelet Total</span>
                          <span className="total-amount">₱{bracelet.totalPrice.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="bracelet-actions">
                    <button 
                      className="edit-button"
                      onClick={() => handleEditBracelet(bracelet.id)}
                    >
                      Edit Bracelet
                    </button>
                    <button 
                      className="remove-button"
                      onClick={() => removeBraceletFromCart(bracelet.id)}
                    >
                      Remove
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Cart Summary - Similar to Checkout Summary */}
          <motion.div 
            className="cart-summary"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="summary-card">
              <h3>Order Summary</h3>

              <div className="summary-total">
                <span className="total-label">Total Amount</span>
                <span className="total-amount">₱{totalCartPrice.toLocaleString()}</span>
              </div>
              
              <button 
                className="checkout-button"
                onClick={handleCheckout}
              >
                <span>Proceed to Checkout</span>
              </button>
              
              <button 
                className="continue-shopping-button"
                onClick={() => navigate('/customize')}
              >
                Add Another Bracelet
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Cart;