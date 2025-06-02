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

  // Initialize with default silver charms
  useEffect(() => {
    const initialCharmsCount = size + Math.floor(Math.random() * 2);
    const defaultCharms = Array(initialCharmsCount).fill({
      id: 'default-silver',
      name: 'Silver Link',
      type: 'default',
      price: 10,
      image: defaultSilverCharmImage
    });
    setCharms(defaultCharms);
    calculateTotalPrice(defaultCharms);
  }, [size]);

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

        // Extract unique categories and types for the filter tabs
        const types = ['All'];
        const categories = new Set();
        const subTypes = new Set();
        
        charmsFromDB.forEach(charm => {
          if (charm.category) categories.add(charm.category);
          if (charm.type) subTypes.add(charm.type);
        });
        
        setAvailableTypes([...types, ...Array.from(categories), ...Array.from(subTypes)]);

        // Organize charms into categories
        const categoriesObj = {};
        
        charmsFromDB.forEach((charm) => {
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
      charm.category === activeType || charm.type === activeType
    );
  };

  // Handle type selection
  const handleTypeSelect = (type) => {
    setActiveType(type);
  };

  // Handle size change
  const handleSizeChange = (newSize) => {
    setSize(newSize);
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
    const basePrice = 20;
    const charmsPrice = currentCharms.reduce((sum, charm) => {
      return sum + (charm ? charm.price : 0);
    }, 0);
    setTotalPrice(basePrice + charmsPrice);
  };

  return (
  <motion.div 
    className="customize-bracelet-page"
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.5 }}
    >
      <motion.div 
      className="bracelet-display"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.2, duration: 0.6 }}
      >
        <h2>Your Custom Bracelet</h2>
        <div className="size-selector">
          <label>Bracelet Size:</label>
          <select value={size} onChange={(e) => handleSizeChange(parseInt(e.target.value))}>
            {[17, 18, 19, 20, 21, 22].map((sizeOption) => (
              <option key={sizeOption} value={sizeOption}>{sizeOption}cm</option>
            ))}
          </select>
          <span className="charm-count">({charms.length} charms)</span>
        </div>
        
        <div className="bracelet-visual">
          {charms.map((charm, index) => (
            <div 
              key={index} 
              className={`bracelet-charm ${selectedCharm ? 'selectable' : ''}`}
              onClick={() => selectedCharm && applyCharmToPosition(index)}
            >
              <img 
                src={charm.image || defaultSilverCharmImage} 
                alt={charm.name} 
                className={charm.type === 'default' ? 'default-charm' : 'custom-charm'}
              />
            </div>
          ))}
        </div>
      </motion.div>

      <motion.div 
        className="charm-selection"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4, duration: 0.6 }}
      >
        <h2>Select Your Charms</h2>
        
        {/* Add type tabs similar to InventoryManagement */}
        <div className="type-tabs">
          {availableTypes.map((type) => (
            <button 
              key={type} 
              className={`type-tab ${activeType === type ? 'active' : ''}`}
              onClick={() => handleTypeSelect(type)}
            >
              {type}
            </button>
          ))}
        </div>
        
        {loading ? (
          <div className="loading">Loading charms...</div>
        ) : (
          <div className="charm-categories">
            {Object.keys(availableCharms).length === 0 ? (
              <div className="no-charms">No charms available</div>
            ) : (
              Object.entries(availableCharms).map(([key, category]) => {
                // Filter charms based on active type
                const filteredCategory = {
                  ...category,
                  charms: filterCharmsByType(category.charms),
                  subcategories: category.subcategories?.map(sub => ({
                    ...sub,
                    charms: filterCharmsByType(sub.charms)
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
                  <div key={key} className="charm-category">
                    <h3>{category.name}</h3>
                    
                    <div className="charm-options">
                      {filteredCategory.subcategories ? (
                        filteredCategory.subcategories.map((subcategory, i) => (
                          <div key={i} className="charm-subcategory">
                            <h4>{subcategory.name}</h4>
                            <div className="subcategory-charms">
                              {subcategory.charms.map((charm) => (
                                <div 
                                  key={charm.id} 
                                  className={`charm-option ${selectedCharm && selectedCharm.id === charm.id ? 'selected' : ''}`}
                                  onClick={() => selectCharm(charm)}
                                >
                                  <img src={charm.image} alt={charm.name} />
                                  <p>{charm.name} - ₱{charm.price}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        filteredCategory.charms.map((charm) => (
                          <div 
                            key={charm.id} 
                            className={`charm-option ${selectedCharm && selectedCharm.id === charm.id ? 'selected' : ''}`}
                            onClick={() => selectCharm(charm)}
                          >
                            <img src={charm.image} alt={charm.name} />
                            <p>{charm.name} - ₱{charm.price}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
   </motion.div>
      
    <motion.div 
      className="price-footer"
      initial={{ y: 20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.6, duration: 0.6 }}
    >
        <div className="total-price">
          Total: ₱{totalPrice}
        </div>
        <button className="add-to-cart">Add to Cart</button>
      </motion.div>
    </motion.div>
  );
};

export default CustomizeBracelet;