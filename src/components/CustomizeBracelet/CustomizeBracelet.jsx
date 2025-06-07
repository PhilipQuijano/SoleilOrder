import React, { useState, useEffect } from 'react';
import './CustomizeBracelet.css';
import defaultSilverCharmImage from '../../assets/default-silver-charm.jpg';
import { fetchCharms } from '../../../api/getCharms';
import { motion, AnimatePresence } from 'framer-motion';
import '../GlobalTransitions.css';

const CustomizeBracelet = () => {
  // State for bracelet size
  const [size, setSize] = useState(17);
  const [charms, setCharms] = useState([]);
  const [selectedCharm, setSelectedCharm] = useState(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [availableCharms, setAvailableCharms] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeType, setActiveType] = useState('All');
  const [availableTypes, setAvailableTypes] = useState(['All']);
  const [defaultSilverCharm, setDefaultSilverCharm] = useState(null);

  // Size options with charm counts
  const sizeOptions = [
    { value: 16.5, label: 'Small - 16.5 cm', charms: 17 },
    { value: 17, label: 'Small - 17 cm', charms: 17 },
    { value: 18, label: 'Medium - 18 cm', charms: 18 },
    { value: 19, label: 'Medium - 19 cm', charms: 19 },
    { value: 20, label: 'Large - 20 cm', charms: 20 },
    { value: 21, label: 'Large - 21 cm', charms: 21 },
    { value: 22, label: 'Extra Large - 22 cm', charms: 22 }
  ];

  // Initialize with default silver charms
  useEffect(() => {
    if (defaultSilverCharm) {
      const selectedSize = sizeOptions.find(s => s.value === size);
      const initialCharmsCount = selectedSize ? selectedSize.charms : 17;
      const defaultCharms = Array(initialCharmsCount).fill({
        ...defaultSilverCharm,
        type: 'default'
      });
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

        // Find the default silver charm from database
        const silverCharm = charmsFromDB.find(charm => 
          charm.name?.includes('Silver Plain') && 
          charm.category?.includes('Plain Charms')
        ) || {
          id: 'default-silver',
          name: 'Silver Plain',
          price: 30,
          image: defaultSilverCharmImage
        };
        
        setDefaultSilverCharm(silverCharm);

        // Extract unique categories and types for the filter tabs
        const types = ['All'];
        const categories = new Set();
        const subTypes = new Set();
        
        charmsFromDB.forEach(charm => {
          if (charm.category && charm.category !== 'default') categories.add(charm.category);
          if (charm.type) subTypes.add(charm.type);
        });
        
        setAvailableTypes([...types, ...Array.from(categories), ...Array.from(subTypes)]);

        // Organize charms into categories (exclude default charms from selection)
        const categoriesObj = {};
        
        charmsFromDB.filter(charm => charm.category !== 'default').forEach((charm) => {
          if (!charm) return;
          
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
      } catch (error) {
        console.error('Error loading charms:', error);
      } finally {
        setLoading(false);
      }
    }
    
    loadCharms();
  }, []);

  // Filter charms by active type
  const filterCharmsByType = (charmsData) => {
    if (activeType === 'All') return charmsData;
    
    return charmsData.filter(charm => 
      charm.category === activeType || 
      charm.type === activeType ||
      `${charm.category.charAt(0).toUpperCase()}${charm.category.slice(1)} Charms` === activeType
    );
  };

  // Handle type selection
  const handleTypeSelect = (type) => {
    setActiveType(type);
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
        <h2>Size</h2>
        <div className="size-selector">
            <select value={size} onChange={(e) => handleSizeChange(e.target.value)}>
                {sizeOptions.map((sizeOption) => (
                    <option key={sizeOption.value} value={sizeOption.value}>
                        {sizeOption.label.replace(/\(.*\)/, '')} {/* Remove charm count */}
                    </option>
                ))}
            </select>
        </div>
            
        <div className="bracelet-preview-section">
          <div className="bracelet-visual">
                  {charms.map((charm, index) => (
                      <div 
                          key={index} 
                          className={`bracelet-charm ${selectedCharm ? 'selectable' : ''}`}
                          onClick={() => selectedCharm && applyCharmToPosition(index)}
                          title={selectedCharm ? 'Click to place charm here' : charm.name}
                          style={{
                              zIndex: selectedCharm ? 10 : 1
                          }}
                      >
                          <img 
                              src={charm.image || defaultSilverCharmImage} 
                              alt={charm.name} 
                              className={charm.type === 'default' ? 'default-charm' : 'custom-charm'}
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
        
{/* Category Selection Cards */}
        <div className="category-cards">
          <div 
            className={`category-card ${activeType === 'All' ? 'active' : ''}`}
            onClick={() => handleTypeSelect('All')}
          >
            <div className="category-image-container">
              <div className="category-image-grid">
                {Object.values(availableCharms).slice(0, 4).map((category, index) => (
                  <img 
                    key={index}
                    src={category.charms?.[0]?.image || category.subcategories?.[0]?.charms?.[0]?.image || defaultSilverCharmImage} 
                    alt=""
                    className="grid-image"
                  />
                ))}
              </div>
            </div>
            <span className="category-name">All</span>
          </div>
          
          {Object.entries(availableCharms).map(([key, category]) => (
            <div 
              key={key}
              className={`category-card ${activeType === category.name || activeType === key ? 'active' : ''}`}
              onClick={() => handleTypeSelect(category.name)}
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
        
        {loading ? (
          <div className="loading">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              style={{ display: 'inline-block', marginRight: '10px' }}
            >
              ⚙️
            </motion.div>
            Loading charms...
          </div>
        ) : (
          <div className="charm-categories">
            {Object.keys(availableCharms).length === 0 ? (
              <div className="no-charms">
                <p>No charms available at the moment</p>
                <p>Please check back later!</p>
              </div>
            ) : (
              Object.entries(availableCharms).map(([key, category]) => {
                // Filter charms based on active type
                const filteredCategory = {
                  ...category,
                  charms: filterCharmsByType(category.charms || []),
                  subcategories: category.subcategories?.map(sub => ({
                    ...sub,
                    charms: filterCharmsByType(sub.charms || [])
                  }))
                };

                // Skip rendering if no charms after filtering
                if (
                  (filteredCategory.charms && filteredCategory.charms.length === 0) &&
                  (!filteredCategory.subcategories || 
                   filteredCategory.subcategories.every(sub => sub.charms.length === 0))
                ) {
                  return null;
                }

                return (
                  <motion.div 
                    key={key} 
                    className="charm-category"
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1, duration: 0.4 }}
                  >
                    <h3>{category.name}</h3>
                    
                    <div className="charm-options">
                      {filteredCategory.subcategories ? (
                        filteredCategory.subcategories.map((subcategory, i) => (
                          subcategory.charms.length > 0 && (
                            <div key={i} className="charm-subcategory">
                              <h4>{subcategory.name}</h4>
                              <div className="subcategory-charms">
                                {subcategory.charms.map((charm) => (
                                  <motion.div 
                                    key={charm.id} 
                                    className={`charm-option ${selectedCharm && selectedCharm.id === charm.id ? 'selected' : ''}`}
                                    onClick={() => selectCharm(charm)}
                                    whileHover={{ scale: 1.02 }}
                                    whileTap={{ scale: 0.98 }}
                                    title={`${charm.name} - ₱${charm.price}`}
                                  >
                                    <img src={charm.image} alt={charm.name} />
                                    <p>{charm.name} - ₱{charm.price}</p>
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          )
                        ))
                      ) : (
                        filteredCategory.charms.map((charm) => (
                          <motion.div 
                            key={charm.id} 
                            className={`charm-option ${selectedCharm && selectedCharm.id === charm.id ? 'selected' : ''}`}
                            onClick={() => selectCharm(charm)}
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            title={`${charm.name} - ₱${charm.price}`}
                          >
                            <img src={charm.image} alt={charm.name} />
                            <p>{charm.name} - ₱{charm.price}</p>
                          </motion.div>
                        ))
                      )}
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        )}
      </motion.div>
      
      {/* Enhanced Price Summary Section */}
      <motion.div 
        className="price-summary-container"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <div className="price-summary">
          <div className="price-header">
            <div className="price-divider"></div>
          </div>
          
          <div className="price-content">
            {getUniqueCharmsForPricing().map((charm, index) => (
              <motion.div 
                key={`${charm.id}-${index}`} 
                className="price-item"
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 * index, duration: 0.3 }}
              >
                <div className="price-item-left">
                  <img src={charm.image || defaultSilverCharmImage} alt={charm.name} className="price-charm-image" />
                  <span className="price-charm-name">
                    {charm.name} {charm.count > 1 && <span className="charm-count">x{charm.count}</span>}
                  </span>
                </div>
                <span className="price-value">₱{(charm.price * charm.count).toLocaleString()}</span>
              </motion.div>
            ))}
            
            <div className="price-divider"></div>
            
            <motion.div 
              className="price-item price-total"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.4 }}
            >
              <span className="total-label">✨ Total Amount</span>
              <span className="total-value">₱{totalPrice.toLocaleString()}</span>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default CustomizeBracelet;