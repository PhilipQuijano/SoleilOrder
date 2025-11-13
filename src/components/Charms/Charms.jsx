import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCharms } from '../../../api/getCharms';
import { useCart } from '../../contexts/CartContext';
import './Charms.css';

const Charms = () => {
  const navigate = useNavigate();
  const { addCharmToCart, cartCharms, updateCharmQuantity, removeCharmFromCart } = useCart();
  
  const [charms, setCharms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCharm, setSelectedCharm] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showAddedNotification, setShowAddedNotification] = useState(false);

  useEffect(() => {
    loadCharms();
  }, []);

  const loadCharms = async () => {
    setLoading(true);
    try {
      const charmsFromDB = await fetchCharms();
      const availableCharms = charmsFromDB.filter(charm => 
        charm && (charm.stock === undefined || charm.stock > 0)
      );
      setCharms(availableCharms);
    } catch (error) {
      console.error('Failed to load charms');
    } finally {
      setLoading(false);
    }
  };

  const getCategories = () => {
    const categories = ['all'];
    charms.forEach(charm => {
      if (charm.category && !categories.includes(charm.category)) {
        categories.push(charm.category);
      }
    });
    return categories;
  };

  const getFilteredCharms = () => {
    let filtered = charms;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(charm => charm.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(charm => 
        charm.name?.toLowerCase().includes(query) ||
        charm.category?.toLowerCase().includes(query) ||
        charm.subcategory?.toLowerCase().includes(query)
      );
    }

    return filtered;
  };

  const handleAddToCart = (charm) => {
    setSelectedCharm(charm);
    setQuantity(1);
  };

  const confirmAddToCart = () => {
    if (selectedCharm) {
      const maxStock = selectedCharm.stock !== undefined ? selectedCharm.stock : 999;
      const finalQuantity = Math.min(quantity, maxStock);
      
      addCharmToCart({
        ...selectedCharm,
        quantity: finalQuantity
      });
      
      setShowAddedNotification(true);
      setSelectedCharm(null);
      setQuantity(1);
      
      setTimeout(() => {
        setShowAddedNotification(false);
      }, 2000);
    }
  };

  const getCategoryDisplayName = (category) => {
    if (category === 'all') return 'All Charms';
    if (category === 'letters') return 'Letters';
    return category.charAt(0).toUpperCase() + category.slice(1) + ' Charms';
  };

  if (loading) {
    return (
      <div className="charms-page loading">
        <motion.div 
          className="loading-spinner"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="spinner"></div>
        </motion.div>
      </div>
    );
  }

  const filteredCharms = getFilteredCharms();
  const categories = getCategories();

  return (
    <motion.div 
      className="charms-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6 }}
    >
      {/* Added to Cart Notification */}
      <AnimatePresence>
        {showAddedNotification && (
          <motion.div 
            className="added-notification"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.3 }}
          >
            <p className="font-inter-medium">✓ Added to cart!</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <motion.div 
        className="charms-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.5 }}
      >
        <h1 className="font-cormorant-medium">Shop Charms</h1>
        <p className="font-inter-regular">Browse and purchase individual charms for your collection</p>
      </motion.div>

      {/* Search and Filter Bar */}
      <motion.div 
        className="filter-section"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <input
          type="text"
          className="search-input font-inter-regular"
          placeholder="Search charms..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        
        <div className="category-filters">
          {categories.map((category) => (
            <button
              key={category}
              className={`category-filter-btn font-inter-medium ${selectedCategory === category ? 'active' : ''}`}
              onClick={() => setSelectedCategory(category)}
            >
              {getCategoryDisplayName(category)}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Charms Grid */}
      <motion.div 
        className="charms-grid"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
      >
        {filteredCharms.length === 0 ? (
          <div className="no-charms">
            <p className="font-inter-regular">No charms found matching your criteria.</p>
          </div>
        ) : (
          filteredCharms.map((charm) => (
            <motion.div
              key={charm.id}
              className="charm-card"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              whileHover={{ y: -5, transition: { duration: 0.2 } }}
            >
              <div className="charm-image-container">
                <img 
                  src={charm.image} 
                  alt={charm.name}
                  className="charm-image"
                  onError={(e) => {
                    e.target.src = '/api/placeholder/200/200';
                  }}
                />
              </div>
              
              <div className="charm-info">
                <div className="charm-header">
                  <h3 className="charm-name font-inter-semibold">{charm.name}</h3>
                  <p className="charm-price font-inter-bold">₱{charm.price}</p>
                </div>
                {charm.category && (
                  <p className="charm-category font-inter-regular">{charm.category}</p>
                )}
                
                {charm.stock !== undefined && (
                  <p className="charm-stock font-inter-regular">
                    {charm.stock > 0 ? `${charm.stock} in stock` : 'Out of stock'}
                  </p>
                )}
                
                {/* If charm is in cart, show quantity controls */}
                {(() => {
                  const cartItem = cartCharms.find(item => item.id === charm.id);
                  if (cartItem) {
                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%' }}>
                          <button
                            className="add-to-cart-btn font-inter-medium"
                            style={{ width: '28px', height: '28px', padding: '0', minWidth: 'unset' }}
                            onClick={() => {
                              if (cartItem.quantity > 1) {
                                updateCharmQuantity(cartItem.cartItemId, cartItem.quantity - 1);
                              } else {
                                removeCharmFromCart(cartItem.cartItemId);
                              }
                            }}
                          >
                            -
                          </button>
                          <input
                            type="number"
                            min="1"
                            max={charm.stock !== undefined ? charm.stock : 999}
                            value={cartItem.quantity}
                            onChange={e => {
                              let val = parseInt(e.target.value) || 1;
                              if (val < 1) val = 1;
                              if (charm.stock !== undefined && val > charm.stock) val = charm.stock;
                              updateCharmQuantity(cartItem.cartItemId, val);
                            }}
                            className="quantity-controls-input"
                            style={{
                              width: '32px',
                              height: '28px',
                              textAlign: 'center',
                              fontWeight: 500,
                              border: '1.5px solid #e0e0e0',
                              borderRadius: '6px',
                              fontSize: '1rem',
                              margin: '0 2px'
                            }}
                          />
                          <button
                            className="add-to-cart-btn font-inter-medium"
                            style={{ width: '28px', height: '28px', padding: '0', minWidth: 'unset' }}
                            onClick={() => {
                              if (!charm.stock || cartItem.quantity < charm.stock) {
                                updateCharmQuantity(cartItem.cartItemId, cartItem.quantity + 1);
                              }
                            }}
                            disabled={charm.stock !== undefined && cartItem.quantity >= charm.stock}
                          >
                            +
                          </button>
                        </div>
                      </div>
                    );
                  }
                  return (
                      <div style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <button
                          className="add-to-cart-btn font-inter-medium"
                          style={{ width: '120px', padding: '8px 0', borderRadius: '8px', margin: '0 auto', display: 'block', textAlign: 'center' }}
                          onClick={() => handleAddToCart(charm)}
                          disabled={charm.stock === 0}
                        >
                          {charm.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
                        </button>
                      </div>
                  );
                })()}
              </div>
            </motion.div>
          ))
        )}
      </motion.div>

      {/* Add to Cart Modal */}
      <AnimatePresence>
        {selectedCharm && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCharm(null)}
          >
            <motion.div 
              className="modal-content charm-modal"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="font-cormorant-medium">Add to Cart</h2>
              
              <div className="modal-charm-preview">
                <img 
                  src={selectedCharm.image} 
                  alt={selectedCharm.name}
                  onError={(e) => {
                    e.target.src = '/api/placeholder/200/200';
                  }}
                />
                <div>
                  <h3 className="font-inter-semibold">{selectedCharm.name}</h3>
                  <p className="font-inter-regular">₱{selectedCharm.price} each</p>
                  {selectedCharm.stock !== undefined && (
                    <p className="font-inter-regular stock-info">{selectedCharm.stock} available</p>
                  )}
                </div>
              </div>

              <div className="quantity-selector">
                <label className="font-inter-medium">Quantity:</label>
                <div className="quantity-controls">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={selectedCharm.stock !== undefined ? selectedCharm.stock : 999}
                    value={quantity}
                    onChange={(e) => {
                      const val = parseInt(e.target.value) || 1;
                      const max = selectedCharm.stock !== undefined ? selectedCharm.stock : 999;
                      setQuantity(Math.min(Math.max(1, val), max));
                    }}
                    className="font-inter-regular"
                  />
                  <button
                    onClick={() => {
                      const max = selectedCharm.stock !== undefined ? selectedCharm.stock : 999;
                      setQuantity(Math.min(quantity + 1, max));
                    }}
                    disabled={selectedCharm.stock !== undefined && quantity >= selectedCharm.stock}
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="modal-total">
                <p className="font-inter-bold">Total: ₱{(selectedCharm.price * quantity).toLocaleString()}</p>
              </div>

              <div className="modal-actions">
                <button 
                  className="cancel-btn font-inter-medium"
                  onClick={() => setSelectedCharm(null)}
                >
                  Cancel
                </button>
                <button 
                  className="confirm-btn font-inter-medium"
                  onClick={confirmAddToCart}
                >
                  Add to Cart
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Charms;