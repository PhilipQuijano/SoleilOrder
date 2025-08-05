
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../../contexts/CartContext';
import { fetchCharms } from '../../../api/getCharms';
import './CustomizeBracelet.css';
import '../GlobalTransitions.css';
import defaultSilverCharmImage from '../../assets/default-silver-charm.jpg';

const CustomizeBracelet = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { addBraceletToCart, getBraceletCount, editBracelet } = useCart();
  
  // Edit mode detection
  const editData = location.state?.editBracelet;
  const isEditing = !!editData;

  // Core state
  const [size, setSize] = useState(editData?.size || 17);
  const [charms, setCharms] = useState([]);
  const [selectedCharm, setSelectedCharm] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Selection and UI state
  const [availableCharms, setAvailableCharms] = useState({});
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSubtype, setSelectedSubtype] = useState(null);
  const [defaultSilverCharm, setDefaultSilverCharm] = useState(null);
  const [plainCharms, setPlainCharms] = useState([]);
  
  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);
  
  // Drag and drop state
  const [draggedCharm, setDraggedCharm] = useState(null);
  const [dragOverPosition, setDragOverPosition] = useState(null);

  // Configuration
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

  // Initialize charms based on size and edit mode
  useEffect(() => {
    if (defaultSilverCharm) {
      const selectedSize = sizeOptions.find(s => s.value === size);
      const initialCharmsCount = selectedSize ? selectedSize.charms : 17;
      
      if (isEditing && editData && editData.charms) {
        const currentCharms = [...editData.charms];
        
        if (currentCharms.length < initialCharmsCount) {
          while (currentCharms.length < initialCharmsCount) {
            currentCharms.push(defaultSilverCharm);
          }
        } else if (currentCharms.length > initialCharmsCount) {
          currentCharms.splice(initialCharmsCount);
        }
        
        setCharms(currentCharms);
        calculateTotalPrice(currentCharms);
      } else if (!isEditing) {
        const defaultCharms = Array(initialCharmsCount).fill(defaultSilverCharm);
        setCharms(defaultCharms);
        calculateTotalPrice(defaultCharms);
      }
    }
  }, [size, defaultSilverCharm, isEditing]);

  // Load charms from API
  useEffect(() => {
    const loadCharms = async () => {
      setLoading(true);
      try {
        const charmsFromDB = await fetchCharms();
        
        if (!charmsFromDB || charmsFromDB.length === 0) {
          setLoading(false);
          return;
        }

        const sortedPlainCharms = charmsFromDB
          .filter(charm => 
            charm.category === 'Plain Charms' && (charm.stock > 0 || charm.stock === undefined)
          )
          .sort((a, b) => {
            const order = ['Silver', 'Gold', 'Rose Gold', 'Bronze (Matte)', 'Black (Matte)', 'Pink'];
            const aIndex = order.indexOf(a.name);
            const bIndex = order.indexOf(b.name);
            
            if (aIndex !== -1 && bIndex !== -1) {
              return aIndex - bIndex;
            }
            if (aIndex !== -1) return -1;
            if (bIndex !== -1) return 1;
            return a.name.localeCompare(b.name);
          });

        // Set default charm with stock consideration
        const findDefaultCharm = (requiredStock) => {
          const silverCharm = sortedPlainCharms.find(charm => 
            charm.name === 'Silver' && (charm.stock >= requiredStock || charm.stock === undefined)
          );
          if (silverCharm) return silverCharm;

          const preferredOrder = ['Gold', 'Rose Gold', 'Bronze (Matte)', 'Black (Matte)', 'Pink'];
          
          for (const charmName of preferredOrder) {
            const charm = sortedPlainCharms.find(c => 
              c.name === charmName && (c.stock >= requiredStock || c.stock === undefined)
            );
            if (charm) return charm;
          }

          return sortedPlainCharms.find(charm => 
            charm.stock >= requiredStock || charm.stock === undefined
          ) || sortedPlainCharms[0];
        };

        const currentSize = sizeOptions.find(s => s.value === size) || sizeOptions[0];
        const requiredStock = currentSize.charms;

        const defaultCharm = findDefaultCharm(requiredStock);
        setDefaultSilverCharm(defaultCharm);

        // Organize charms into categories
        const categoriesObj = {};
        
        charmsFromDB
          .filter(charm => charm && (charm.stock > 0 || charm.stock === undefined))
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
              const categoryKey = charm.category.toLowerCase().replace(/\s+/g, '');
              
              if (!categoriesObj[categoryKey]) {
                categoriesObj[categoryKey] = {
                  name: charm.category === 'Plain Charms' ? 'Plain Charms' : `${charm.category.charAt(0).toUpperCase()}${charm.category.slice(1)} Charms`,
                  charms: [],
                };
              }
              
              categoriesObj[categoryKey].charms.push(charm);
            }
          });
        
        setAvailableCharms(categoriesObj);
        setPlainCharms(sortedPlainCharms);
      } catch (error) {
        // Handle error gracefully without exposing internal details
        console.error('Failed to load charms');
      } finally {
        setLoading(false);
      }
    };
    
    loadCharms();
  }, []);

  // Show welcome instructions for new users
  useEffect(() => {
    if (!isEditing) {
      const hasVisited = localStorage.getItem('soleil-bracelet-visited');
      if (!hasVisited) {
        setShowInstructions(true);
        localStorage.setItem('soleil-bracelet-visited', 'true');
      }
    }
  }, [isEditing]);

  // Global drag event handlers
  useEffect(() => {
    const handleGlobalDragOver = (e) => {
      if (document.body.classList.contains('dragging-active')) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        document.body.style.cursor = 'grabbing';
      }
    };

    const handleGlobalDragEnter = (e) => {
      if (document.body.classList.contains('dragging-active')) {
        e.preventDefault();
        document.body.style.cursor = 'grabbing';
      }
    };

    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('dragenter', handleGlobalDragEnter);

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('dragenter', handleGlobalDragEnter);
    };
  }, []);

  // Event handlers
  const handleSizeChange = (newSize) => {
    const parsedSize = parseFloat(newSize);
    setSize(parsedSize);
    
    const newSizeOption = sizeOptions.find(s => s.value === parsedSize);
    const requiredStock = newSizeOption ? newSizeOption.charms : 17;
    
    if (defaultSilverCharm && defaultSilverCharm.stock !== undefined && defaultSilverCharm.stock < requiredStock) {
      const findDefaultCharm = (requiredStock) => {
        const silverCharm = plainCharms.find(charm => 
          charm.name === 'Silver' && (charm.stock >= requiredStock || charm.stock === undefined)
        );
        if (silverCharm) return silverCharm;

        const preferredOrder = ['Gold', 'Rose Gold', 'Bronze (Matte)', 'Black (Matte)', 'Pink'];
        
        for (const charmName of preferredOrder) {
          const charm = plainCharms.find(c => 
            c.name === charmName && (c.stock >= requiredStock || c.stock === undefined)
          );
          if (charm) return charm;
        }

        return plainCharms.find(charm => 
          charm.stock >= requiredStock || charm.stock === undefined
        ) || plainCharms[0];
      };

      const newDefaultCharm = findDefaultCharm(requiredStock);
      setDefaultSilverCharm(newDefaultCharm);
    }
  };

  const handleCategorySelect = (categoryKey, categoryName) => {
    setSelectedCategory({ key: categoryKey, name: categoryName });
    setSelectedSubtype(null);
    setSelectedCharm(null);
  };

  const handlePlainCharmChange = (charmId) => {
    const selectedPlainCharm = plainCharms.find(charm => charm.id === parseInt(charmId));
    if (selectedPlainCharm) {
      setDefaultSilverCharm(selectedPlainCharm);
    }
  };

  const selectCharm = (charm) => {
    setSelectedCharm(charm);
  };

  const applyCharmToPosition = (position) => {
    if (selectedCharm) {
      const newCharms = [...charms];
      newCharms[position] = selectedCharm;
      setCharms(newCharms);
      calculateTotalPrice(newCharms);
      setSelectedCharm(null);
    }
  };

  const calculateTotalPrice = (currentCharms) => {
    const charmsPrice = currentCharms.reduce((sum, charm) => {
      return sum + (charm ? charm.price : 0);
    }, 0);
    setTotalPrice(charmsPrice);
  };

  const resetSelection = () => {
    setSelectedCategory(null);
    setSelectedSubtype(null);
    setSelectedCharm(null);
  };

  // Drag and drop handlers
  const handleDragStart = (e, charm) => {
    setDraggedCharm(charm);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', '');
    setSelectedCharm(charm);
    
    document.body.classList.add('dragging-active');
    document.body.style.cursor = 'grabbing';
    e.currentTarget.classList.add('dragging');
    
    // Create clean drag image
    const dragContainer = document.createElement('div');
    dragContainer.style.width = '80px';
    dragContainer.style.height = '80px';
    dragContainer.style.background = 'transparent';
    dragContainer.style.border = 'none';
    dragContainer.style.borderRadius = '0';
    dragContainer.style.boxShadow = 'none';
    dragContainer.style.position = 'absolute';
    dragContainer.style.top = '-1000px';
    dragContainer.style.left = '-1000px';
    dragContainer.style.display = 'flex';
    dragContainer.style.alignItems = 'center';
    dragContainer.style.justifyContent = 'center';
    dragContainer.style.zIndex = '9999';
    dragContainer.style.pointerEvents = 'none';
    
    const img = e.currentTarget.querySelector('img');
    if (img) {
      const clonedImg = img.cloneNode(true);
      clonedImg.style.width = '70px';
      clonedImg.style.height = '70px';
      clonedImg.style.objectFit = 'contain';
      clonedImg.style.padding = '0';
      clonedImg.style.margin = '0';
      clonedImg.style.border = 'none';
      clonedImg.style.borderRadius = '0';
      clonedImg.style.background = 'transparent';
      clonedImg.style.boxShadow = 'none';
      clonedImg.style.pointerEvents = 'none';
      clonedImg.style.userSelect = 'none';
      clonedImg.style.webkitUserDrag = 'none';
      dragContainer.appendChild(clonedImg);
    }
    
    document.body.appendChild(dragContainer);
    e.dataTransfer.setDragImage(dragContainer, 40, 40);
    
    setTimeout(() => {
      if (document.body.contains(dragContainer)) {
        document.body.removeChild(dragContainer);
      }
    }, 0);
  };

  const handleDragEnd = (e) => {
    e.currentTarget.classList.remove('dragging');
    document.body.classList.remove('dragging-active');
    document.body.style.cursor = 'default';
    setDraggedCharm(null);
    setDragOverPosition(null);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    
    document.body.style.cursor = 'grabbing';
    
    if (dragOverPosition !== index) {
      setDragOverPosition(index);
    }
  };

  const handleDragEnter = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragOverPosition(index);
    document.body.style.cursor = 'grabbing';
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!e.currentTarget.contains(e.relatedTarget)) {
      setDragOverPosition(null);
    }
  };

  const handleDrop = (e, index) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragOverPosition(null);
    
    if (draggedCharm) {
      applyCharmToPosition(index);
      setDraggedCharm(null);
    }
    
    document.body.style.cursor = 'default';
  };

  // Modal handlers
  const handleFinalize = () => {
    setShowModal(true);
  };

  const handleCheckout = () => {
    const braceletData = {
      size: size,
      charms: charms,
      totalPrice: totalPrice,
      charmCounts: processCharmsForCheckout()
    };

    if (isEditing) {
      editBracelet(editData.id, braceletData);
      setShowModal(false);
      navigate('/cart', { 
        state: { 
          message: 'Bracelet updated successfully!' 
        }
      });
    } else {
      addBraceletToCart(braceletData);
      setShowModal(false);
      navigate('/cart');
    }
  };

  // Utility functions
  const processCharmsForCheckout = () => {
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

    return Object.values(charmCounts);
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
    
    Object.keys(breakdown).forEach(key => {
      breakdown[key].totalPrice = breakdown[key].count * breakdown[key].charm.price;
    });
    
    return Object.values(breakdown);
  };

  const getCharmsToDisplay = () => {
    if (!selectedCategory) return [];
    
    const category = availableCharms[selectedCategory.key];
    if (!category) return [];
    
    if ((selectedCategory.key === 'gold' || selectedCategory.key === 'silver') && selectedSubtype) {
      return category.charms.filter(charm => (charm.type || 'Plain').toLowerCase() === selectedSubtype);
    }
    
    if (selectedCategory.key === 'gold' || selectedCategory.key === 'silver') {
      return [];
    }
    
    if (category.subcategories) {
      return category.subcategories;
    }
    
    return category.charms || [];
  };

  return (
    <motion.div 
      className="customize-bracelet-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Edit Mode Banner */}
      {isEditing && (
        <motion.div 
          className="edit-mode-banner"
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="edit-banner-content">
            <span>Editing Bracelet</span>
            <button 
              className="cancel-edit-button"
              onClick={() => navigate('/cart')}
            >
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Bracelet Display */}
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
              style={{ textAlign: 'center' }}
            >
              {plainCharms.map((charm) => {
                const currentSize = sizeOptions.find(s => s.value === size);
                const requiredStock = currentSize ? currentSize.charms : 17;
                const hasEnoughStock = charm.stock === undefined || charm.stock >= requiredStock;
                
                return (
                  <option 
                    key={charm.id} 
                    value={charm.id}
                    disabled={!hasEnoughStock}
                    style={{ 
                      color: hasEnoughStock ? 'inherit' : '#999999',
                      fontStyle: hasEnoughStock ? 'normal' : 'italic'
                    }}
                  >
                    {charm.name}{!hasEnoughStock ? ' (INSUFFICIENT STOCK)' : ''}
                  </option>
                );
              })}
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
                onDragEnter={(e) => handleDragEnter(e, index)}
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
                  draggable={false}
                />
              </div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Cart Indicator */}
      {getBraceletCount() > 0 && (
        <div className="cart-indicator">
          <button 
            className="cart-button font-montserrat-medium"
            onClick={() => navigate('/cart')}
          >
            Cart ({getBraceletCount()})
          </button>
        </div>
      )}

      {/* Charm Selection */}
      <motion.div 
        className="charm-selection"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {loading ? (
          <div className="loading">
            Loading charms...
          </div>
        ) : (
          <div className="selection-steps">
            {/* Category Selection */}
            {!selectedCategory && (
              <motion.div 
                className="selection-step"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4 }}
              >
                <h3 className="step-title font-montserrat-semibold">CHOOSE A CATEGORY</h3>
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
            
            {/* Charm Selection */}
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
                                  <div className="price-tooltip">₱{charm.price}</div>
                                </motion.div>
                              ))}
                            </div>
                          </div>
                        );
                      }
                      
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
                          <div className="price-tooltip">₱{item.price}</div> 
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
      
      {/* Price Footer */}
      <div className="price-footer">
        <div className="price-info">
          <span className="price-label font-montserrat-semibold">Total Price:</span>
          <span className="price-amount font-montserrat-semibold">₱{totalPrice.toFixed(2)}</span>
        </div>
        <div className="footer-actions">
          <button 
            className="terms-button font-inter-regular" 
            onClick={() => setShowTermsModal(true)}
            title="View Terms and Conditions"
          >
            Terms
          </button>
          <button className="finalize-button" onClick={handleFinalize}>
            {isEditing ? 'Update Bracelet' : 'Finalize your Bracelet'}
          </button>
        </div>
      </div>


      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {isEditing ? 'Update Bracelet' : 'Bracelet Summary'}
              </h2>
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
                <span className="modal-checkout-icon">
                  {isEditing ? '💾' : '🛒'}
                </span>
                {isEditing ? 'Save Changes' : 'Add to Cart'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Instructions Modal - only show for new bracelets */}
      {showInstructions && !isEditing && (
        <div className="modal-overlay" onClick={() => setShowInstructions(false)}>
          <div className="instructions-modal" onClick={(e) => e.stopPropagation()}>
            <div className="instructions-header">
              <h2 className="instructions-title">Welcome to Soleil!</h2>
            </div>
            
            <div className="instructions-content">
              <div className="instruction-step">
                <div className="step-number">1</div>
                <div className="step-text">
                  <h3>Choose Your Category</h3>
                  <p>Select from different charm categories like Letters, Gold, Silver, and more!</p>
                </div>
              </div>
              
              <div className="instruction-step">
                <div className="step-number">2</div>
                <div className="step-text">
                  <h3>Pick Your Charm</h3>
                  <p>Click on any charm to select it, then click on a position in your bracelet to place it.</p>
                </div>
              </div>
              
              <div className="instruction-step">
                <div className="step-number">3</div>
                <div className="step-text">
                  <h3>Drag & Drop</h3>
                  <p>You can also drag charms directly from the selection area to your bracelet!</p>
                </div>
              </div>
              
              <div className="instruction-step">
                <div className="step-number">4</div>
                <div className="step-text">
                  <h3>Customize & Checkout</h3>
                  <p>Adjust your bracelet size, change starting charms, and finalize when ready!</p>
                </div>
              </div>
            </div>
            
            <div className="instructions-footer">
              <button className="charmed-button" onClick={() => setShowInstructions(false)}>
                I'm Charmed!
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Terms and Conditions Modal */}
        {showTermsModal && (
          <div className="modal-overlay" onClick={() => setShowTermsModal(false)}>
            <div className="terms-modal" onClick={(e) => e.stopPropagation()}>
              <div className="terms-header">
                <h2 className="terms-title">Terms and Conditions</h2>
                <button className="close-button" onClick={() => setShowTermsModal(false)}>
                  ×
                </button>
              </div>
              
              <div className="terms-content">
                <div className="terms-section">
                  <h3>1. Product Information</h3>
                  <p>All charm bracelets are handcrafted with care. Product images are for reference only and actual products may vary slightly in appearance.</p>
                </div>
                
                <div className="terms-section">
                  <h3>2. Customization Policy</h3>
                  <p>Custom bracelets are made to order based on your selections. Once an order is placed, modifications may not be possible. Please review your bracelet carefully before finalizing.</p>
                </div>
                
                <div className="terms-section">
                  <h3>3. Pricing and Payment</h3>
                  <p>All prices are displayed in Philippine Peso (₱) and are inclusive of applicable taxes. Payment is required in full before processing your order.</p>
                </div>
                
                <div className="terms-section">
                  <h3>4. Processing Time</h3>
                  <p>Custom bracelets typically require 3-5 business days for processing before shipping. Rush orders may be available upon request for an additional fee.</p>
                </div>
                
                <div className="terms-section">
                  <h3>5. Shipping and Delivery</h3>
                  <p>Shipping times vary by location. We are not responsible for delays caused by courier services or customs procedures. Please provide accurate shipping information.</p>
                </div>
                
                <div className="terms-section">
                  <h3>6. Returns and Exchanges</h3>
                  <p>Due to the custom nature of our products, returns and exchanges are only accepted for defective items within 7 days of delivery. Items must be unused and in original condition.</p>
                </div>
                
                <div className="terms-section">
                  <h3>7. Care Instructions</h3>
                  <p>To maintain the quality of your bracelet, avoid exposure to water, perfumes, and harsh chemicals. Store in a dry place when not in use.</p>
                </div>
                
                <div className="terms-section">
                  <h3>8. Limitation of Liability</h3>
                  <p>Soleil's liability is limited to the purchase price of the item. We are not responsible for any indirect, incidental, or consequential damages.</p>
                </div>
                
                <div className="terms-section">
                  <h3>9. Privacy Policy</h3>
                  <p>We respect your privacy and will not share your personal information with third parties except as necessary to fulfill your order.</p>
                </div>
                
                <div className="terms-section">
                  <h3>10. Contact Information</h3>
                  <p>For questions about these terms or your order, please contact us through our customer service channels.</p>
                </div>
              </div>
              
              <div className="terms-footer">
                <p className="terms-last-updated">Last updated: July 2025</p>
                <button className="terms-close-button" onClick={() => setShowTermsModal(false)}>
                  I Understand
                </button>
              </div>
            </div>
          </div>
        )}
    </motion.div>
  );
};

export default CustomizeBracelet;