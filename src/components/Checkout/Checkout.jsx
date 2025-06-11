import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Checkout.css';
import { useLocation } from 'react-router-dom';
import { supabase } from '../../../api/supabaseClient';
const CheckoutPage = () => {
  // Sample data - this would come from the customize page
const location = useLocation();
const passedData = location.state;

const [orderData] = useState(() => {
  if (passedData) return passedData;

  // fallback demo data
  return {
        charms: [
        {
            id: 'silver-plain',
            name: 'Silver Plain',
            price: 30,
            count: 17,
            image: '/api/placeholder/60/60'
        }
        ],
        totalPrice: 510,
        size: 17,
        braceletPreview: Array(17).fill({
        id: 'silver-plain',
        name: 'Silver Plain',
        price: 30,
        image: '/api/placeholder/60/60'
        })
    };
    });


  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    paymentMethod: 'gcash'
  });

  const [errors, setErrors] = useState({});

  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!customerInfo.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!customerInfo.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10,11}$/.test(customerInfo.phone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number';
    }
    
    if (!customerInfo.address.trim()) {
      newErrors.address = 'Address is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;

    console.log('Order submitted:', {
      customer: customerInfo,
      order: orderData
    });

    // DEBUG: Log the orderData structure
    console.log('Order data charms:', orderData.charms);
    console.log('Bracelet preview length:', orderData.braceletPreview?.length);

    try {
      // Option 1: If orderData.charms represents individual quantities
      if (orderData.charms && orderData.charms.length > 0) {
        console.log('Using orderData.charms structure');
        
        // Group charms by ID and calculate total quantities needed
        const charmQuantities = {};
        
        orderData.charms.forEach(item => {
          console.log('Processing charm:', item);
          
          if (charmQuantities[item.id]) {
            charmQuantities[item.id].totalCount += item.count;
          } else {
            charmQuantities[item.id] = {
              id: item.id,
              name: item.name,
              totalCount: item.count
            };
          }
        });

        console.log('Grouped charm quantities:', charmQuantities);

        // Check and update stock for each unique charm type
        for (const charmId in charmQuantities) {
          const charmData = charmQuantities[charmId];
          
          console.log(`Checking stock for ${charmData.name}, need ${charmData.totalCount}`);
          console.log(`Using charm ID: ${charmId} (type: ${typeof charmId})`);
          
          // Convert charmId to number since your database uses int8
          const numericCharmId = parseInt(charmId);
          console.log(`Converted to numeric ID: ${numericCharmId}`);
          
          const { data: currentData, error: fetchError } = await supabase
            .from('charms')
            .select('*')
            .eq('id', numericCharmId)
            .single();

          if (fetchError) {
            console.error(`Failed to fetch stock for ${charmData.name}`, fetchError);
            console.error('Fetch error details:', fetchError);
            alert(`Failed to find charm ${charmData.name} in database. Try again later.`);
            return;
          }

          console.log(`Current stock for ${charmData.name}:`, currentData);
          console.log(`Available stock: ${currentData.stock}, Needed: ${charmData.totalCount}`);

          const updatedStock = currentData.stock - charmData.totalCount;

          if (updatedStock < 0) {
            alert(`Not enough stock for ${charmData.name}. Available: ${currentData.stock}, Needed: ${charmData.totalCount}`);
            return;
          }

          console.log(`Updating stock from ${currentData.stock} to ${updatedStock}`);

          const { error: updateError } = await supabase
            .from('charms')
            .update({ stock: updatedStock })
            .eq('id', numericCharmId);

          if (updateError) {
            console.error(`Failed to update stock for ${charmData.name}`, updateError);
            console.error('Update error details:', updateError);
            alert('Error updating stock. Try again later.');
            return;
          }
          
          console.log(`✅ Successfully updated ${charmData.name} stock from ${currentData.stock} to ${updatedStock}`);
        }
      } 
      // Option 2: If we need to count from braceletPreview array
      else if (orderData.braceletPreview && orderData.braceletPreview.length > 0) {
        console.log('Using braceletPreview structure');
        
        // Count charms from braceletPreview
        const charmCounts = {};
        
        orderData.braceletPreview.forEach(charm => {
          if (charmCounts[charm.id]) {
            charmCounts[charm.id].count++;
          } else {
            charmCounts[charm.id] = {
              id: charm.id,
              name: charm.name,
              count: 1
            };
          }
        });

        console.log('Charm counts from braceletPreview:', charmCounts);

        // Check and update stock
        for (const charmId in charmCounts) {
          const charmData = charmCounts[charmId];
          
          console.log(`Checking stock for ${charmData.name}, need ${charmData.count}`);
          console.log(`Using charm ID: ${charmId} (type: ${typeof charmId})`);
          
          // Convert charmId to number since your database uses int8
          const numericCharmId = parseInt(charmId);
          console.log(`Converted to numeric ID: ${numericCharmId}`);
          
          const { data: currentData, error: fetchError } = await supabase
            .from('charms')
            .select('*')
            .eq('id', numericCharmId)
            .single();

          if (fetchError) {
            console.error(`Failed to fetch stock for ${charmData.name}`, fetchError);
            console.error('Fetch error details:', fetchError);
            alert(`Failed to find charm ${charmData.name} in database. Try again later.`);
            return;
          }

          console.log(`Current stock for ${charmData.name}:`, currentData);
          console.log(`Available stock: ${currentData.stock}, Needed: ${charmData.count}`);

          const updatedStock = currentData.stock - charmData.count;

          if (updatedStock < 0) {
            alert(`Not enough stock for ${charmData.name}. Available: ${currentData.stock}, Needed: ${charmData.count}`);
            return;
          }

          console.log(`Updating stock from ${currentData.stock} to ${updatedStock}`);

          const { error: updateError } = await supabase
            .from('charms')
            .update({ stock: updatedStock })
            .eq('id', numericCharmId);

          if (updateError) {
            console.error(`Failed to update stock for ${charmData.name}`, updateError);
            console.error('Update error details:', updateError);
            alert('Error updating stock. Try again later.');
            return;
          }
          
          console.log(`✅ Successfully updated ${charmData.name} stock from ${currentData.stock} to ${updatedStock}`);
        }
      }

      // Step 3: Confirm order
      alert('Order placed successfully!');
      
    } catch (error) {
      console.error('Unexpected error in handleSubmitOrder:', error);
      alert('An unexpected error occurred. Please try again.');
    }
  };

  return (
    <div className="checkout-page">
      <motion.div 
        className="checkout-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div 
          className="checkout-header"
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.5 }}
        >
          <h1>Complete Your Order</h1>
          <p>Review your work of art and fill in your details!</p>
        </motion.div>

        <div className="checkout-content">
          {/* Left Column - Order Summary */}
          <motion.div 
            className="order-summary-section"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Bracelet Preview */}
            <div className="bracelet-final-preview">
              <h2>Your Bracelet Design</h2>
              <div className="final-bracelet-visual">
                {orderData.braceletPreview.map((charm, index) => (
                  <div key={index} className="final-bracelet-charm">
                    <img src={charm.image} alt={charm.name} />
                  </div>
                ))}
              </div>
              <p className="bracelet-size">Size: {orderData.size} cm</p>
            </div>

            {/* Order Details */}
            <div className="order-details">
              <h2>Order Summary</h2>
              <div className="order-items">
                {orderData.charms.map((charm, index) => (
                  <motion.div 
                    key={index}
                    className="order-item"
                    initial={{ x: -10, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.1 * index, duration: 0.3 }}
                  >
                    <div className="item-info">
                      <img src={charm.image} alt={charm.name} className="item-image" />
                      <div className="item-details">
                        <span className="item-name">{charm.name}</span>
                        {charm.count > 1 && (
                          <span className="item-quantity">x{charm.count}</span>
                        )}
                      </div>
                    </div>
                    <span className="item-price">₱{(charm.price * charm.count).toLocaleString()}</span>
                  </motion.div>
                ))}
                
                <div className="order-total">
                  <div className="total-divider"></div>
                  <div className="total-row">
                    <span className="total-label">Total Amount</span>
                    <span className="total-amount">₱{orderData.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Column - Customer Information */}
          <motion.div 
            className="customer-info-section"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="customer-form">
              <h2>Fill in Your Details</h2>
              
              <div className="form-group">
                <label htmlFor="name">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  value={customerInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={errors.name ? 'error' : ''}
                  placeholder="Enter your full name"
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={errors.phone ? 'error' : ''}
                  placeholder="09XXXXXXXXX"
                />
                {errors.phone && <span className="error-message">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email (Optional)</label>
                <input
                  type="email"
                  id="email"
                  value={customerInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="form-group">
                <label htmlFor="address">Complete Address *</label>
                <textarea
                  id="address"
                  value={customerInfo.address}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  className={errors.address ? 'error' : ''}
                  placeholder="House/Unit Number, Street, Barangay, City, Province"
                  rows="3"
                />
                {errors.address && <span className="error-message">{errors.address}</span>}
              </div>

              <div className="form-group">
                <label>Payment Method *</label>
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="payment"
                      value="gcash"
                      checked={customerInfo.paymentMethod === 'gcash'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    />
                    <span className="payment-label">
                      <span className="payment-icon">📱</span>
                      GCash
                    </span>
                  </label>
                  
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="payment"
                      value="bank"
                      checked={customerInfo.paymentMethod === 'bank'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                    />
                    <span className="payment-label">
                      <span className="payment-icon">🏦</span>
                      Bank Transfer
                    </span>
                  </label>
                </div>
              </div>

              <motion.button 
                className="finalize-order-button"
                onClick={handleSubmitOrder}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5, duration: 0.4 }}
              >
                <span className="button-text">Place Order</span>
                <span className="button-price">₱{orderData.totalPrice.toLocaleString()}</span>
              </motion.button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;