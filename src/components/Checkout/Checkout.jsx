import React, { useState } from 'react';
import { motion } from 'framer-motion';
import './Checkout.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../api/supabaseClient';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passedData = location.state;

  // Philippine regions data
  const philippineRegions = [
    'National Capital Region (NCR)',
    'Cordillera Administrative Region (CAR)',
    'Region I - Ilocos Region',
    'Region II - Cagayan Valley',
    'Region III - Central Luzon',
    'Region IV-A - CALABARZON',
    'Region IV-B - MIMAROPA',
    'Region V - Bicol Region',
    'Region VI - Western Visayas',
    'Region VII - Central Visayas',
    'Region VIII - Eastern Visayas',
    'Region IX - Zamboanga Peninsula',
    'Region X - Northern Mindanao',
    'Region XI - Davao Region',
    'Region XII - SOCCSKSARGEN',
    'Region XIII - Caraga',
    'Bangsamoro Autonomous Region in Muslim Mindanao (BARMM)'
  ];

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
    // Address fields
    houseNumber: '',
    street: '',
    barangay: '',
    city: '',
    province: '',
    region: '',
    zipCode: '',
    paymentMethod: 'gcash'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    
    // Address validation
    if (!customerInfo.houseNumber.trim()) {
      newErrors.houseNumber = 'House/Unit number is required';
    }
    
    if (!customerInfo.barangay.trim()) {
      newErrors.barangay = 'Barangay is required';
    }
    
    if (!customerInfo.city.trim()) {
      newErrors.city = 'City/Municipality is required';
    }
    
    if (!customerInfo.province.trim()) {
      newErrors.province = 'Province is required';
    }
    
    if (!customerInfo.region.trim()) {
      newErrors.region = 'Region is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const getFullAddress = () => {
    const addressParts = [
      customerInfo.houseNumber,
      customerInfo.street,
      customerInfo.barangay,
      customerInfo.city,
      customerInfo.province,
      customerInfo.region,
      customerInfo.zipCode
    ].filter(part => part.trim());
    
    return addressParts.join(', ');
  };

  const handleSubmitOrder = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);

    const fullAddress = getFullAddress();

    console.log('Order submitted:', {
      customer: { ...customerInfo, fullAddress },
      order: orderData
    });

    try {
      // Step 1: Prepare charm quantities
      let charmQuantities = {};
      
      if (orderData.charms && orderData.charms.length > 0) {
        console.log('Using orderData.charms structure');
        
        orderData.charms.forEach(item => {
          if (charmQuantities[item.id]) {
            charmQuantities[item.id].totalCount += item.count;
            charmQuantities[item.id].price = item.price;
          } else {
            charmQuantities[item.id] = {
              id: item.id,
              name: item.name,
              totalCount: item.count,
              price: item.price
            };
          }
        });
      } else if (orderData.braceletPreview && orderData.braceletPreview.length > 0) {
        console.log('Using braceletPreview structure');
        
        orderData.braceletPreview.forEach(charm => {
          if (charmQuantities[charm.id]) {
            charmQuantities[charm.id].totalCount++;
          } else {
            charmQuantities[charm.id] = {
              id: charm.id,
              name: charm.name,
              totalCount: 1,
              price: charm.price
            };
          }
        });
      }

      console.log('Grouped charm quantities:', charmQuantities);

      // Step 2: Check and update stock for each unique charm type
      for (const charmId in charmQuantities) {
        const charmData = charmQuantities[charmId];
        
        console.log(`Checking stock for ${charmData.name}, need ${charmData.totalCount}`);
        
        const numericCharmId = parseInt(charmId);
        console.log(`Using numeric ID: ${numericCharmId}`);
        
        const { data: currentData, error: fetchError } = await supabase
          .from('charms')
          .select('*')
          .eq('id', numericCharmId)
          .single();

        if (fetchError) {
          console.error(`Failed to fetch stock for ${charmData.name}`, fetchError);
          alert(`Failed to find charm ${charmData.name} in database. Try again later.`);
          return;
        }

        console.log(`Current stock for ${charmData.name}: ${currentData.stock}, Needed: ${charmData.totalCount}`);

        const updatedStock = currentData.stock - charmData.totalCount;

        if (updatedStock < 0) {
          alert(`Not enough stock for ${charmData.name}. Available: ${currentData.stock}, Needed: ${charmData.totalCount}`);
          return;
        }

        const { error: updateError } = await supabase
          .from('charms')
          .update({ stock: updatedStock })
          .eq('id', numericCharmId);

        if (updateError) {
          console.error(`Failed to update stock for ${charmData.name}`, updateError);
          alert('Error updating stock. Try again later.');
          return;
        }
        
        console.log(`✅ Successfully updated ${charmData.name} stock from ${currentData.stock} to ${updatedStock}`);
      }

      // Step 3: Create the order record
      console.log('Creating order record...');
      
      const orderRecord = {
        customer_name: customerInfo.name.trim(),
        customer_phone: customerInfo.phone.trim(),
        customer_email: customerInfo.email.trim() || null,
        customer_address: fullAddress,
        payment_method: customerInfo.paymentMethod,
        status: 'awaiting_payment',
        total_amount: orderData.totalPrice,
        bracelet_size: orderData.size || null,
        bracelet_arrangement: JSON.stringify(orderData.braceletPreview), 
        created_at: new Date().toISOString()
      };
      
      console.log('Order record to insert:', orderRecord);

      const { data: insertedOrder, error: orderError } = await supabase
        .from('orders')
        .insert([orderRecord])
        .select()
        .single();

      if (orderError) {
        console.error('Failed to create order:', orderError);
        alert('Failed to create order. Please try again.');
        return;
      }

      console.log('✅ Order created successfully:', insertedOrder);

      // Step 4: Create order items
      console.log('Creating order items...');
      
      const orderItems = [];
      
      for (const charmId in charmQuantities) {
        const charmData = charmQuantities[charmId];
        const numericCharmId = parseInt(charmId);
        
        orderItems.push({
          order_id: insertedOrder.id,
          charm_id: numericCharmId,
          quantity: charmData.totalCount,
          price: charmData.price
        });
      }

      console.log('Order items to insert:', orderItems);

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Failed to create order items:', itemsError);
        alert('Order created but failed to save items. Please contact support.');
        return;
      }

      console.log('✅ Order items created successfully');

      // Step 5: Success - show confirmation and redirect
      alert(`Order #${insertedOrder.id.toString().padStart(4, '0')} placed successfully! You will be contacted shortly for payment instructions.`);
      
      // Redirect to home or order confirmation page
      navigate('/', { 
        state: { 
          orderSuccess: true, 
          orderId: insertedOrder.id 
        } 
      });
      
    } catch (error) {
      console.error('Unexpected error in handleSubmitOrder:', error);
      alert('An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>

              {/* Philippine Address Section */}
              <div className="address-section">
                <h3>🇵🇭 Delivery Address</h3>
                
                <div className="address-grid">
                  <div className="form-group">
                    <label htmlFor="houseNumber">House/Unit Number *</label>
                    <input
                      type="text"
                      id="houseNumber"
                      value={customerInfo.houseNumber}
                      onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                      className={errors.houseNumber ? 'error' : ''}
                      placeholder="123 or Blk 1 Lot 2"
                      disabled={isSubmitting}
                    />
                    {errors.houseNumber && <span className="error-message">{errors.houseNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="street">Street Name (Optional)</label>
                    <input
                      type="text"
                      id="street"
                      value={customerInfo.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      placeholder="e.g., Rizal Street"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="address-grid">
                  <div className="form-group">
                    <label htmlFor="barangay">Barangay *</label>
                    <input
                      type="text"
                      id="barangay"
                      value={customerInfo.barangay}
                      onChange={(e) => handleInputChange('barangay', e.target.value)}
                      className={errors.barangay ? 'error' : ''}
                      placeholder="e.g., Barangay San Jose"
                      disabled={isSubmitting}
                    />
                    {errors.barangay && <span className="error-message">{errors.barangay}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="city">City/Municipality *</label>
                    <input
                      type="text"
                      id="city"
                      value={customerInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={errors.city ? 'error' : ''}
                      placeholder="e.g., Quezon City"
                      disabled={isSubmitting}
                    />
                    {errors.city && <span className="error-message">{errors.city}</span>}
                  </div>
                </div>

                <div className="address-grid">
                  <div className="form-group">
                    <label htmlFor="province">Province *</label>
                    <input
                      type="text"
                      id="province"
                      value={customerInfo.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      className={errors.province ? 'error' : ''}
                      placeholder="e.g., Metro Manila"
                      disabled={isSubmitting}
                    />
                    {errors.province && <span className="error-message">{errors.province}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="region">Region *</label>
                    <select
                      id="region"
                      value={customerInfo.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      className={errors.region ? 'error' : ''}
                      disabled={isSubmitting}
                    >
                      <option value="">Select a region</option>
                      {philippineRegions.map((region, index) => (
                        <option key={index} value={region}>
                          {region}
                        </option>
                      ))}
                    </select>
                    {errors.region && <span className="error-message">{errors.region}</span>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="zipCode">ZIP Code (Optional)</label>
                  <input
                    type="text"
                    id="zipCode"
                    value={customerInfo.zipCode}
                    onChange={(e) => handleInputChange('zipCode', e.target.value)}
                    placeholder="e.g., 1100"
                    maxLength="4"
                    disabled={isSubmitting}
                  />
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="payment-section">
                <h3>💳 Payment Method</h3>
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="gcash"
                      checked={customerInfo.paymentMethod === 'gcash'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="payment-label">
                      <span className="payment-icon">📱</span>
                      GCash
                    </div>
                  </label>
                  
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="paymaya"
                      checked={customerInfo.paymentMethod === 'paymaya'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="payment-label">
                      <span className="payment-icon">💎</span>
                      PayMaya
                    </div>
                  </label>
                </div>
              </div>

              {/* Submit Button */}
              <button 
                className="finalize-order-button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                type="button"
              >
                <span className="button-text">
                  {isSubmitting ? 'Processing Order...' : 'Finalize Order'}
                </span>
                <span className="button-price">₱{orderData.totalPrice.toLocaleString()}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;