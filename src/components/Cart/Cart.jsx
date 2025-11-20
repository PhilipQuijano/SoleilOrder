import React, { useState } from 'react';
import { useCart } from '../../contexts/CartContext';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import './Cart.css';
import deleteIcon from '../../assets/delete.png';
import ConfirmModal from '../Shared/ConfirmModal';

const Cart = () => {
  const { 
    cartBracelets, 
    cartCharms,
    totalCartPrice, 
    removeBraceletFromCart, 
    removeCharmFromCart,
    updateCharmQuantity,
    clearCart 
  } = useCart();
  const navigate = useNavigate();
  const [expandedBracelets, setExpandedBracelets] = useState({});
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  const toggleBraceletDetails = (braceletId) => {
    setExpandedBracelets(prev => ({
      ...prev,
      [braceletId]: !prev[braceletId]
    }));
  };

  const handleEditBracelet = (braceletId) => {
    const braceletToEdit = cartBracelets.find(b => b.id === braceletId);
    navigate('/customize', { 
      state: { 
        editBracelet: braceletToEdit
      } 
    });
  };

  const handleCheckout = () => {
    if (cartBracelets.length === 0 && cartCharms.length === 0) return;
    
    navigate('/checkout', {
      state: {
        bracelets: cartBracelets,
        charms: cartCharms,
        totalPrice: totalCartPrice
      }
    });
  };

  const handleConfirmClear = () => {
    clearCart();
    setShowConfirmClear(false);
  };

  // subtotal by type
  const braceletsSubtotal = (cartBracelets || []).reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const charmsSubtotal = (cartCharms || []).reduce((sum, c) => sum + ((c.price || 0) * (c.quantity || 0)), 0);
  const computedSubtotal = braceletsSubtotal + charmsSubtotal;

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

  // Empty cart state
  if (cartBracelets.length === 0 && cartCharms.length === 0) {
    return (
      <div className="cart-page empty-state">
        <motion.div 
          className="empty-cart"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-cormorant-medium">Your Cart is Empty</h2>
          <p className="font-inter-regular">Start customizing your first bracelet or shop for charms!</p>
          <div className="empty-cart-actions">
            <button 
              className="customize-button font-inter-medium"
              onClick={() => navigate('/customize')}
            >
              Customize Bracelet
            </button>
            <button 
              className="shop-charms-button font-inter-medium"
              onClick={() => navigate('/charms')}
            >
              Shop Charms
            </button>
          </div>
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


        <div className="cart-content">
          {/* Cart Items */}
          <div className="cart-bracelets">
            {/* Bracelets Section */}
            {cartBracelets.length > 0 && (
              <>
                <h2 className="section-title font-cormorant-medium">Custom Bracelets ({cartBracelets.length} Bracelet{cartBracelets.length !== 1 ? 's' : ''})</h2>
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
                      {/* Bracelet Preview */}
                      <div className="bracelet-preview">
                        <h3 className="font-cormorant-medium">Bracelet #{index + 1} - {bracelet.size}cm</h3>
                        <div className="bracelet-visual-small">
                          {bracelet.charms.map((charm, charmIndex) => (
                            <div key={charmIndex} className="charm-preview">
                              <img src={charm?.image} alt={charm?.name} />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Price Breakdown */}
                      <div className="bracelet-details">
                        {/* Header row with toggle and total */}
                        <div className="bracelet-details-header">
                          <button 
                            className="price-breakdown-toggle font-inter-medium"
                            onClick={() => toggleBraceletDetails(bracelet.id)}
                          >
                            <span>Price Breakdown</span>
                            <span className={`toggle-icon ${expandedBracelets[bracelet.id] ? 'expanded' : ''}`}>
                              ▼
                            </span>
                          </button>
                          
                          <div className="bracelet-right-section">
                            <div className="bracelet-total">
                              <div className="bracelet-total-row">
                                <span className="total-label font-montserrat-semibold">Bracelet Total</span>
                                <span className="total-amount font-montserrat-semibold">₱{bracelet.totalPrice.toLocaleString()}</span>
                              </div>
                            </div>
                            
                            <div className="bracelet-actions">
                              <button 
                                className="edit-button font-inter-medium"
                                onClick={() => handleEditBracelet(bracelet.id)}
                              >
                                Edit Bracelet
                              </button>
                              <button 
                                className="remove-button font-inter-medium"
                                onClick={() => removeBraceletFromCart(bracelet.id)}
                                aria-label="Remove bracelet"
                              >
                                <img src={deleteIcon} alt="Delete" className="delete-icon" />
                              </button>
                            </div>
                          </div>
                        </div>



                        {/* Collapsible Content */}
                        <AnimatePresence>
                          {expandedBracelets[bracelet.id] && (
                            <motion.div 
                              className="price-breakdown"
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.3 }}
                            >
                              {getPriceBreakdown(bracelet).map((item, idx) => (
                                <motion.div 
                                  key={idx} 
                                  className="price-item"
                                  initial={{ x: -10, opacity: 0 }}
                                  animate={{ x: 0, opacity: 1 }}
                                  transition={{ delay: 0.05 * idx, duration: 0.3 }}
                                >
                                  <span className="font-inter-regular">{item.charm.name} × {item.count}</span>
                                  <span className="font-montserrat-medium">₱{item.totalPrice.toLocaleString()}</span>
                                </motion.div>
                              ))}
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </>
            )}

            {/* Individual Charms Section */}
            {cartCharms.length > 0 && (
              <>
                <h2 className="section-title font-cormorant-medium" style={{ marginTop: cartBracelets.length > 0 ? '40px' : '0' }}>Individual Charms ({cartCharms.length} Charm Item{cartCharms.length !== 1 ? 's' : ''})</h2>
                <div className="charms-grid-container">
                  <AnimatePresence>
                    {cartCharms.map((charm, index) => (
                      <motion.div
                        key={charm.cartItemId}
                        className="cart-charm-item"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.1, duration: 0.5 }}
                      >
                        {/* top-right compact remove button */}
                        <button
                          className="remove-charm-topright remove-charm-button font-inter-medium"
                          onClick={() => removeCharmFromCart(charm.cartItemId)}
                          aria-label="Remove charm"
                        >
                          <img src={deleteIcon} alt="Delete" className="delete-icon" />
                        </button>
                        <div className="charm-item-left">
                            <img 
                              src={charm.image} 
                              alt={charm.name}
                              className="charm-item-image"
                              onError={(e) => {
                                e.target.src = '/api/placeholder/80/80';
                              }}
                            />
                          </div>
                        
                          <div className="charm-item-content">
                          <div className="charm-item-details">
                            <h3 className="font-inter-semibold">{charm.name}</h3>
                            {charm.category && (
                              <p className="charm-category font-inter-regular">{charm.category}</p>
                            )}
                            <p className="charm-price font-inter-medium">₱{charm.price} each</p>
                              {/* move quantity control under details to match reference layout */}
                              <div className="quantity-control">
                                <button
                                  onClick={() => updateCharmQuantity(charm.cartItemId, charm.quantity - 1)}
                                  disabled={charm.quantity <= 1}
                                  className="font-inter-medium"
                                >
                                  -
                                </button>
                                <span className="quantity-display font-inter-medium">{charm.quantity}</span>
                                <button
                                  onClick={() => updateCharmQuantity(charm.cartItemId, charm.quantity + 1)}
                                  disabled={charm.stock !== undefined && charm.quantity >= charm.stock}
                                  className="font-inter-medium"
                                >
                                  +
                                </button>
                              </div>
                          </div>

                          <div className="charm-item-right-controls">
                            <div className="charm-item-total">
                              <span className="total-label font-inter-medium">Total:</span>
                              <span className="total-price font-montserrat-semibold">₱{(charm.price * charm.quantity).toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                </div>
              </>
            )}
          </div>

          {/* Cart Summary */}
          <motion.div 
            className="cart-summary"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            <div className="summary-card">
              {/* Order Summary title with item count */}
              <h3 className="order-summary-title">ORDER SUMMARY | {cartBracelets.length + cartCharms.length} ITEM(S)</h3>

              {/* Compact breakdown box */}
              <div className="summary-box">
                <div className="summary-row">
                  <div className="summary-line-label">Bracelet(s) subtotal</div>
                  <div className="summary-line-value">₱{braceletsSubtotal.toLocaleString()}</div>
                </div>

                <div className="summary-row">
                  <div className="summary-line-label">Charm(s) subtotal</div>
                  <div className="summary-line-value">₱{charmsSubtotal.toLocaleString()}</div>
                </div>

                <div className="summary-divider" />

                <div className="summary-row strong">
                  <div className="summary-line-label">ORDER TOTAL</div>
                  <div className="summary-line-value">₱{computedSubtotal.toLocaleString()}</div>
                </div>
              </div>

              <button 
                className="checkout-button bold-checkout font-inter-medium"
                onClick={handleCheckout}
              >
                CHECKOUT
              </button>

              <button 
                className="continue-shopping-button outline font-inter-medium"
                onClick={() => navigate('/customize')}
              >
                CONTINUE SHOPPING
              </button>

              <button 
                className="continue-shopping-button outline font-inter-medium"
                onClick={() => setShowConfirmClear(true)}
              >
                CLEAR CART
              </button>

            </div>
          </motion.div>
        </div>
        {/* Confirm modal for clearing cart */}
        <ConfirmModal
          open={showConfirmClear}
          title={"Clear Cart"}
          message={"This will remove all items from your cart. Are you sure you want to continue?"}
          onConfirm={handleConfirmClear}
          onCancel={() => setShowConfirmClear(false)}
        />
      </motion.div>
    </div>
  );
};

export default Cart;