import React, { useState, useEffect } from 'react';
import './CustomizeBracelet.css';
import defaultSilverCharmImage from '../../assets/default-silver-charm.jpg';
import { fetchCharms } from '../../../api/getCharms';
import { motion, AnimatePresence } from 'framer-motion';
import '../GlobalTransitions.css';
import { useNavigate } from 'react-router-dom';

const CustomizeBracelet = () => {
  // State for bracelet size
  const navigate = useNavigate();
  const [size, setSize] = useState(17);
  const [charms, setCharms] = useState([]);
  const [selectedCharm, setSelectedCharm] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [availableCharms, setAvailableCharms] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubtype, setSelectedSubtype] = useState(null);
  const [defaultSilverCharm, setDefaultSilverCharm] = useState(null);
  const [draggedCharm, setDraggedCharm] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState(null);
  const [plainCharms, setPlainCharms] = useState([]);
  const [showModal, setShowModal] = useState(false);

  // Size options with charm counts
  const sizeOptions = [
    { value: 17, label: '17 Charms - 17 cm', charms: 17 },
    { value: 18, label: '18 Charms - 18 cm', charms: 18 },
    { value: 19, label: '19 Charms - 19 cm', charms: 19 },
    { value: 20, label: '20 Charms - 20 cm', charms: 20 },
    { value: 21, label: '21 Charms - 21 cm', charms: 21 },
    { value: 22, label: '22 Charms - 22 cm', charms: 22 },
    { value: 23, label: '23 Charms - 23 cm', charms: 23 },
    { value: 24, label: '24 Charms - 24 cm', charms: 24 },
  ];

    // Handle drag start for selected charm
  const handleDragStart = (e, charm) => {
    setDraggedCharm(charm);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    // Also select the charm when dragging starts
    setSelectedCharm(charm);
  };

  // Handle drag over bracelet positions
  const handleDragOver = (e, position) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverPosition(position);
  };

  // Handle drag leave
  const handleDragLeave = (e) => {
    // Only clear if we're actually leaving the drop zone
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverPosition(null);
    }
  };

  // Handle drop on bracelet position
  const handleDrop = (e, position) => {
    e.preventDefault();
    if (draggedCharm) {
      const newCharms = [...charms];
      newCharms[position] = draggedCharm;
      setCharms(newCharms);
      calculateTotalPrice(newCharms);
      setSelectedCharm(null);
    }
    setDraggedCharm(null);
    setDragOverPosition(null);
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedCharm(null);
    setDragOverPosition(null);
  };

  // Initialize with default silver charms
  useEffect(() => {
    if (defaultSilverCharm) {
      const selectedSize = sizeOptions.find(s => s.value === size);
      const initialCharmsCount = selectedSize ? selectedSize.charms : 17;
      // Use the actual charm from database instead of adding a 'type' property
      const defaultCharms = Array(initialCharmsCount).fill(defaultSilverCharm);
      setCharms(defaultCharms);
      calculateTotalPrice(defaultCharms);
    }
  }, [size, defaultSilverCharm]);

  useEffect(() => {
    async function loadCharms() {
      setLoading(true);
      try {
        const charmsFromDB = await fetchCharms();
        
        if (!charmsFromDB || charmsFromDB.length === 0) {
          console.error('No charms data received from Supabase');
          setLoading(false);
          return;
        }

        // Get all plain charms for selection
        const plainCharms = charmsFromDB.filter(charm => 
          charm.category === 'Plain Charms'
        );

        // Set default to Silver Plain (ID 146) initially
        const defaultCharm = plainCharms.find(charm => charm.id === 146) || plainCharms[0];
        setDefaultSilverCharm(defaultCharm);
                

        // Organize charms into categories (exclude the default silver charm from selection)
        const categoriesObj = {};
        
        charmsFromDB
          .filter(charm => charm && charm.category !== 'Plain Charms') // Exclude all plain charms from selection
          .forEach((charm) => {
            if (charm.category === 'letters' && charm.subcategory) {
              if (!categoriesObj.letters) {
                categoriesObj.letters = { name: 'Letters', subcategories: [] };
              }
              
              let sub = categoriesObj.letters.subcategories.find(sc => sc.name === charm.subcategory);
              if (!sub) {
                sub = { name: charm.subcategory, charms: [] };
                categoriesObj.letters.subcategories.push(sub);
              }
              
              sub.charms.push(charm);
            } else if (charm.category) {
              const categoryKey = charm.category.toLowerCase();
              
              if (!categoriesObj[categoryKey]) {
                categoriesObj[categoryKey] = {
                  name: `${charm.category.charAt(0).toUpperCase()}${charm.category.slice(1)} Charms`,
                  charms: [],
                };
              }
              
              categoriesObj[categoryKey].charms.push(charm);
            }
          });
        
        setAvailableCharms(categoriesObj);
        setPlainCharms(plainCharms);
      } catch (error) {
        console.error('Error loading charms:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadCharms();
  }, []);

  // Handle category selection
  const handleCategorySelect = (categoryKey, categoryName) => {
    setSelectedCategory({ key: categoryKey, name: categoryName });
    setSelectedSubtype(null);
    setSelectedCharm(null);
  };

  // Handle subtype selection for Gold/Silver categories
  const handleSubtypeSelect = (subtype) => {
    setSelectedSubtype(subtype);
    setSelectedCharm(null);
  };

  const handlePlainCharmChange = (charmId) => {
  const selectedPlainCharm = plainCharms.find(charm => charm.id === parseInt(charmId));
    if (selectedPlainCharm) {
      setDefaultSilverCharm(selectedPlainCharm);
    }
  };

  // Get available subtypes for Gold/Silver categories
  const getAvailableSubtypes = () => {
    if (!selectedCategory) return [];
    
    const category = availableCharms[selectedCategory.key];
    if (!category || !category.charms) return [];
    
    // For Gold/Silver categories, extract Plain/Special subtypes
    if (selectedCategory.key === 'gold' || selectedCategory.key === 'silver') {
      const subtypes = [...new Set(category.charms.map(charm => charm.type || 'Plain'))];
      return subtypes.map(type => ({
        key: type.toLowerCase(),
        name: type,
        charms: category.charms.filter(charm => (charm.type || 'Plain') === type)
      }));
    }
    
    return [];
  };

   const getPriceBreakdown = () => {
        const breakdown = {};
        charms.forEach(charm => {
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
        
        // Update total prices
        Object.keys(breakdown).forEach(key => {
            breakdown[key].totalPrice = breakdown[key].count * breakdown[key].charm.price;
        });
        
        return Object.values(breakdown);
    };

    // Handle finalize button click
    const handleFinalize = () => {
        setShowModal(true);
    };

    // Handle checkout
// Handle checkout
const handleCheckout = () => {
    // Process charms to get counts for pricing/inventory
    const charmCounts = {};
    
    charms.forEach(charm => {
        if (charm && charm.id) {
            const key = charm.id;
            if (charmCounts[key]) {
                charmCounts[key].count++;
            } else {
                charmCounts[key] = {
                    id: charm.id,
                    name: charm.name,
                    price: charm.price,
                    image: charm.image,
                    count: 1
                };
            }
        }
    });

    // Navigate with cleaner data structure
    navigate('/checkout', {
        state: {
            // For pricing and inventory management
            charms: Object.values(charmCounts),
            // For bracelet preview (IMPORTANT: This preserves the exact arrangement)
            braceletPreview: charms.map((charm, index) => ({
                position: index,
                id: charm.id,
                name: charm.name,
                image: charm.image,
                price: charm.price
            })),
            totalPrice: totalPrice,
            size: size
        }
    });
};

  // Get charms to display based on current selection
  const getCharmsToDisplay = () => {
    if (!selectedCategory) return [];
    
    const category = availableCharms[selectedCategory.key];
    if (!category) return [];
    
    // For Gold/Silver with subtype selection
    if ((selectedCategory.key === 'gold' || selectedCategory.key === 'silver') && selectedSubtype) {
      return category.charms.filter(charm => (charm.type || 'Plain').toLowerCase() === selectedSubtype);
    }
    
    // For Gold/Silver without subtype selection, don't show charms yet
    if (selectedCategory.key === 'gold' || selectedCategory.key === 'silver') {
      return [];
    }
    
    // For other categories, return all charms or subcategories
    if (category.subcategories) {
      return category.subcategories;
    }
    
    return category.charms || [];
  };

  // Handle size change
  const handleSizeChange = (newSize) => {
    setSize(parseFloat(newSize));
  };

  // Handle charm selection
  const selectCharm = (charm) => {
    setSelectedCharm(charm);
  };

  // Apply selected charm to position
  const applyCharmToPosition = (position) => {
    if (selectedCharm) {
      const newCharms = [...charms];
      newCharms[position] = selectedCharm;
      setCharms(newCharms);
      calculateTotalPrice(newCharms);
      setSelectedCharm(null);
    }
  };

  // Calculate total price
  const calculateTotalPrice = (currentCharms) => {
    const charmsPrice = currentCharms.reduce((sum, charm) => {
      return sum + (charm ? charm.price : 0);
    }, 0);
    setTotalPrice(charmsPrice);
  };

  // Get unique charms for price breakdown
  const getUniqueCharmsForPricing = () => {
    const charmCounts = {};
    
    charms.forEach(charm => {
      if (charm) {
        const key = `${charm.id}-${charm.name}`;
        if (charmCounts[key]) {
          charmCounts[key].count++;
        } else {
          charmCounts[key] = {
            ...charm,
            count: 1
          };
        }
      }
    });
    
    return Object.values(charmCounts);
  };

  // Reset selection flow
  const resetSelection = () => {
    setSelectedCategory(null);
    setSelectedSubtype(null);
    setSelectedCharm(null);
  };

  return (
    <motion.div 
      className="customize-bracelet-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
    {/* Sticky Bracelet Display */}
    <motion.div 
        className="bracelet-display"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
    >
    <div className="bracelet-controls">
        <div className="control-group">
            <h3>Size</h3>
            <select value={size} onChange={(e) => handleSizeChange(e.target.value)}>
                {sizeOptions.map((sizeOption) => (
                    <option key={sizeOption.value} value={sizeOption.value}>
                        {sizeOption.label.replace(/\(.*\)/, '')}
                    </option>
                ))}
            </select>
        </div>
        <div className="control-group">
            <h3>Starting Charm</h3>
            <select 
                value={defaultSilverCharm?.id || ''} 
                onChange={(e) => handlePlainCharmChange(e.target.value)}
            >
                {plainCharms.map((charm) => (
                    <option key={charm.id} value={charm.id}>
                        {charm.name}
                    </option>
                ))}
            </select>
        </div>
    </div>
        <div className="bracelet-preview-section">
          <div className="bracelet-visual">
                  {charms.map((charm, index) => (
                          <div 
                              key={index} 
                              className={`bracelet-charm ${selectedCharm ? 'selectable' : ''} ${dragOverPosition === index ? 'drag-over' : ''}`}
                              onClick={() => selectedCharm && applyCharmToPosition(index)}
                              onDragOver={(e) => handleDragOver(e, index)}
                              onDragLeave={handleDragLeave}
                              onDrop={(e) => handleDrop(e, index)}
                              title={selectedCharm ? 'Click to place charm here or drag a charm here' : charm.name}
                              style={{
                                  zIndex: selectedCharm ? 10 : 1
                              }}
                          >
                          <img 
                              src={charm.image || defaultSilverCharmImage} 
                              alt={charm.name} 
                              className={charm.id === 146 || charm.id === 'fallback-silver' ? 'default-charm' : 'custom-charm'}
                          />
                      </div>
                ))}
            </div>
        </div>
    </motion.div>

      {/* Charm Selection Section */}
      <motion.div 
        className="charm-selection"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        <h2>Select Your Charms</h2>
        
        {/* Step-by-step selection process */}
        {loading ? (
          <div className="loading">
            Loading charms...
          </div>
        ) : (
          <div className="selection-steps">
            {/* Step 1: Category Selection */}
            {!selectedCategory && (
              <motion.div 
                className="selection-step"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="step-title">Step 1: Choose Category</h3>
                <div className="category-cards-container">
                  <div className="category-cards">
                    {Object.entries(availableCharms).map(([key, category]) => (
                      <div 
                        key={key}
                        className="category-card"
                        onClick={() => handleCategorySelect(key, category.name)}
                      >
                        <div className="category-image-container">
                          <img 
                            src={category.charms?.[0]?.image || category.subcategories?.[0]?.charms?.[0]?.image || defaultSilverCharmImage} 
                            alt={category.name}
                            className="category-preview-image"
                          />
                        </div>
                        <span className="category-name">{category.name.replace(' Charms', '')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Subtype Selection (for Gold/Silver) */}
            {selectedCategory && (selectedCategory.key === 'gold' || selectedCategory.key === 'silver') && !selectedSubtype && (
              <motion.div 
                className="selection-step"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="step-header">
                  <h3 className="step-title">Step 2: Choose {selectedCategory.name.replace(' Charms', '')} Type</h3>
                  <button className="back-button" onClick={resetSelection}>
                    ← Back to Categories
                  </button>
                </div>
                <div className="category-cards-container">
                  <div className="category-cards">
                    {getAvailableSubtypes().map((subtype) => (
                      <div 
                        key={subtype.key}
                        className="category-card"
                        onClick={() => handleSubtypeSelect(subtype.key)}
                      >
                        <div className="category-image-container">
                          <img 
                            src={subtype.charms?.[0]?.image || defaultSilverCharmImage} 
                            alt={subtype.name}
                            className="category-preview-image"
                          />
                        </div>
                        <span className="category-name">{subtype.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Charm Selection */}
            {selectedCategory && (
              (selectedCategory.key !== 'gold' && selectedCategory.key !== 'silver') || 
              (selectedSubtype)
            ) && (
              <motion.div 
                className="selection-step"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <div className="step-header">
                  <h3 className="step-title">
                    Step {(selectedCategory.key === 'gold' || selectedCategory.key === 'silver') ? '3' : '2'}: Choose Your Charm
                  </h3>
                  <button 
                    className="back-button" 
                    onClick={() => {
                      if (selectedSubtype) {
                        setSelectedSubtype(null);
                        setSelectedCharm(null);
                      } else {
                        resetSelection();
                      }
                    }}
                  >
                    ← Back
                  </button>
                </div>

                <div className="charm-selection-area">
                  <div className="charm-options">
                    {getCharmsToDisplay().map((item) => {
                      if (item.charms) {
                        return (
                          <div key={item.name} className="charm-subcategory">
                            <h4>{item.name}</h4>
                            <div className="subcategory-charms">
                              {item.charms.map((charm) => (
                               <motion.div 
                                  key={charm.id} 
                                  className={`charm-option ${selectedCharm && selectedCharm.id === charm.id ? 'selected' : ''}`}
                                  onClick={() => selectCharm(charm)}
                                  draggable={true}
                                  onDragStart={(e) => handleDragStart(e, charm)}
                                  onDragEnd={handleDragEnd}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  title={`${charm.name} - ₱${charm.price}`}
                                  style={{
                                    cursor: 'grab',
                                    opacity: draggedCharm && draggedCharm.id === charm.id ? 0.5 : 1
                                  }}
                                >
                                  <img 
                                    src={charm.image} 
                                    alt={charm.name} 
                                    onDragStart={(e) => e.preventDefault()}
                                  />
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      
                      // Handle regular charms
                      return (
                        <motion.div 
                            key={item.id} 
                            className={`charm-option ${selectedCharm && selectedCharm.id === item.id ? 'selected' : ''}`}
                            onClick={() => selectCharm(item)}
                            draggable={true}
                            onDragStart={(e) => handleDragStart(e, item)}
                            onDragEnd={handleDragEnd}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            title={`${item.name} - ₱${item.price}`}
                            style={{
                              cursor: 'grab',
                              opacity: draggedCharm && draggedCharm.id === item.id ? 0.5 : 1
                            }}
                          >
                            <img 
                              src={item.image} 
                              alt={item.name} 
                              onDragStart={(e) => e.preventDefault()}
                            />
                          </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
      
            {/* Sticky Price Footer */}
            <div className="price-footer">
                <div className="price-info">
                    <span className="price-label">Total Price:</span>
                    <span className="price-amount">₱{totalPrice.toFixed(2)}</span>
                </div>
                <button className="finalize-button" onClick={handleFinalize}>
                    Finalize your Bracelet
                </button>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2 className="modal-title">Bracelet Summary</h2>
                            <button className="close-button" onClick={() => setShowModal(false)}>
                                ×
                            </button>
                        </div>
                        
                        <div className="modal-price-content">
                            <div className="modal-price-item">
                                <div className="modal-price-item-left">
                                    <span className="modal-price-charm-name">Bracelet Size</span>
                                </div>
                                <div className="modal-price-value">{size} cm</div>
                            </div>
                            
                            {getPriceBreakdown().map((item, index) => (
                                <div key={index} className="modal-price-item">
                                    <div className="modal-price-item-left">
                                        <img
                                            src={item.charm.image}
                                            alt={item.charm.name}
                                            className="modal-price-charm-image"
                                        />
                                        <div>
                                            <div className="modal-price-charm-name">
                                                {item.charm.name}
                                                <span className="modal-charm-count">× {item.count}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="modal-price-value">₱{item.totalPrice.toFixed(2)}</div>
                                </div>
                            ))}
                            
                            <div className="modal-price-total">
                                <div className="modal-price-item">
                                    <div className="modal-total-label">Total</div>
                                    <div className="modal-total-value">₱{totalPrice.toFixed(2)}</div>
                                </div>
                            </div>
                        </div>
                        
                        <div className="modal-buttons">
                            <button className="modal-cancel-button" onClick={() => setShowModal(false)}>
                                Continue Editing
                            </button>
                            <button className="modal-checkout-button" onClick={handleCheckout}>
                                <span className="modal-checkout-icon">🛒</span>
                                Proceed to Checkout
                            </button>
                        </div>
                    </div>
                </div>
            )}
      </motion.div>
    );
};

export default CustomizeBracelet;

