import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '../../../api/supabaseClient';
import './Checkout.css';

const CheckoutPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const passedData = location.state;

  // Philippine regions for address form
  const philippineRegions = [
    'National Capital Region (NCR)',
    'Cordilliner Administrative Region (CAR)',
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

  // Initialize order data from various sources
  const [orderData] = useState(() => {
    if (passedData?.bracelets) {
      return {
        bracelets: passedData.bracelets,
        totalPrice: passedData.totalPrice
      };
    } else if (passedData?.charms) {
      return {
        bracelets: [{
          id: 'single-bracelet',
          charms: passedData.braceletPreview || [],
          totalPrice: passedData.totalPrice,
          size: passedData.size
        }],
        totalPrice: passedData.totalPrice
      };
    }

    // Fallback demo data
    return {
      bracelets: [{
        id: 'demo-bracelet',
        charms: Array(17).fill({
          id: 'silver-plain',
          name: 'Silver Plain',
          price: 30,
          image: '/api/placeholder/60/60'
        }),
        totalPrice: 510,
        size: 17
      }],
      totalPrice: 510
    };
  });

  // Customer information form state
  const [customerInfo, setCustomerInfo] = useState({
    name: '',
    phone: '',
    email: '',
    houseNumber: '',
    street: '',
    barangay: '',
    city: '',
    province: '',
    region: '',
    zipCode: '',
    paymentMethod: 'gcash',
    deliveryMethod: 'jnt'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => {
      const updated = { ...prev, [field]: value };
      
      // Auto-set delivery method based on payment method
      if (field === 'paymentMethod' && value === 'cash') {
        updated.deliveryMethod = 'lbc';
      }
      
      return updated;
    });
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Form validation
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

    if (!customerInfo.zipCode.trim()) {
      newErrors.zipCode = 'ZIP code is required';
    } else if (!/^\d{4}$/.test(customerInfo.zipCode.trim())) {
      newErrors.zipCode = 'Please enter a valid 4-digit ZIP code';
    }

    if (!customerInfo.deliveryMethod.trim()) {
      newErrors.deliveryMethod = 'Delivery method is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Generate full address string
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

  // Calculate charm quantities across all bracelets
  const getCharmQuantities = () => {
    const charmQuantities = {};
    
    orderData.bracelets.forEach(bracelet => {
      bracelet.charms.forEach(charm => {
        if (charm && charm.id) {
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
        }
      });
    });
    
    return charmQuantities;
  };

  // Validate stock availability without updating database
  const validateStockAvailability = async () => {
    const charmQuantities = getCharmQuantities();
    const stockValidation = [];
    
    for (const charmId in charmQuantities) {
      const charmData = charmQuantities[charmId];
      const numericCharmId = parseInt(charmId);
      
      const { data: currentData, error: fetchError } = await supabase
        .from('charms')
        .select('*')
        .eq('id', numericCharmId)
        .single();

      if (fetchError) {
        throw new Error(`Unable to verify stock availability. Please try again later.`);
      }

      const updatedStock = currentData.stock - charmData.totalCount;

      if (updatedStock < 0) {
        throw new Error(`Not enough stock for ${charmData.name}. Available: ${currentData.stock}, Needed: ${charmData.totalCount}`);
      }

      stockValidation.push({
        charmId: numericCharmId,
        charmName: charmData.name,
        currentStock: currentData.stock,
        neededQuantity: charmData.totalCount,
        newStock: updatedStock
      });
    }
    
    return stockValidation;
  };

  // Update charm stock after successful order creation
  const updateCharmStock = async (stockValidation) => {
    for (const stockItem of stockValidation) {
      const { error: updateError } = await supabase
        .from('charms')
        .update({ stock: stockItem.newStock })
        .eq('id', stockItem.charmId);

      if (updateError) {
        throw new Error(`Order created but failed to update inventory. Please contact support immediately.`);
      }
    }
  };

  // Format payment method display name
  const getPaymentMethodName = (method) => {
    switch(method) {
      case 'gcash': return 'GCash';
      case 'paymaya': return 'PayMaya';
      case 'cash': return 'Cash';
      case 'bank': return 'Bank Transfer';
      default: return method.toUpperCase();
    }
  };

  // Format delivery method display name
  const getDeliveryMethodName = (method) => {
    switch(method) {
      case 'jnt': return 'J&T Express (Cheapest Option)';
      case 'lbc': return 'LBC (COD/COP Available)';
      case 'lalamove': return 'Lalamove (Same Day Delivery)';
      default: return method;
    }
  };

  // Generate message for Messenger
  const generateMessengerMessage = (orderRecords, customerInfo, fullAddress, orderIds, totalBracelets) => {
    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('en-PH', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getCharmSummary = () => {
      const charmQuantities = getCharmQuantities();
      return Object.values(charmQuantities)
        .map(charm => `• ${charm.name} (x${charm.totalCount}) - ₱${(charm.price * charm.totalCount).toLocaleString()}`)
        .join('\n');
    };

    const message = `*ORDER CONFIRMATION REQUEST*

*Order Details:*
Order ID(s): #${orderIds}
Date: ${formatDate(orderRecords[0].created_at)}
Total Bracelets: ${totalBracelets}
Total Amount: ₱${orderData.totalPrice.toLocaleString()}

*Customer Information:*
Name: ${customerInfo.name}
Phone: ${customerInfo.phone}
Email: ${customerInfo.email || 'Not provided'}

*Delivery Address:*
${fullAddress}

*Delivery Method:* ${getDeliveryMethodName(customerInfo.deliveryMethod)}

*Charm Summary:*
${getCharmSummary()}

*Payment Method:* ${getPaymentMethodName(customerInfo.paymentMethod)}

---
Hi SOLEIL! I would like to confirm my bracelet order above. Please send me the payment details so I can proceed with the payment. Thank you! < 3`;

    return message;
  };

  // Handle messenger redirection and success prompt
  const redirectToMessenger = (message, orderRecords, orderIds) => {
    // Detect if user is on mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    let messengerUrl;
    if (isMobile) {
      // For mobile: Use fb-messenger:// protocol first, fallback to web version
      messengerUrl = `fb-messenger://user-thread/61567161596724`;
    } else {
      // For desktop: Use web version with pre-filled message
      messengerUrl = `https://m.me/61567161596724?text=${encodeURIComponent(message)}`;
    }

    const showSuccessPrompt = () => {
      const promptDiv = document.createElement('div');
      promptDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 10000;">
          <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div style="color: #28a745; font-size: 2rem; margin-bottom: 15px;">✓</div>
            <h3 style="color: #333; margin-bottom: 15px;">Order #${orderIds} created successfully!</h3>
            <p style="color: #666; margin-bottom: 15px;">${isMobile ? 'Your order details are ready to copy.' : 'Your order details have been prepared and copied to your clipboard.'}</p>
            ${isMobile ? `
              <textarea readonly style="width: 100%; height: 120px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 12px; margin-bottom: 15px; resize: none;" onclick="this.select(); document.execCommand('copy'); alert('Message copied! Now paste it in Messenger.');">${message}</textarea>
              <p style="color: #007bff; font-weight: 600; margin-bottom: 15px;">👆 Tap the message above to copy it</p>
            ` : ''}
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #582e4e;">
              <h4 style="color: #582e4e; margin-bottom: 10px;">📋 Next Steps:</h4>
              <p style="color: #333; margin-bottom: 8px; text-align: left;">1. ${isMobile ? 'Copy the message above' : 'Message copied to clipboard'}</p>
              <p style="color: #333; margin-bottom: 8px; text-align: left;">2. Click "Open Messenger" below</p>
              <p style="color: #333; margin-bottom: 8px; text-align: left;">3. Find SOLEIL's chat and paste the message</p>
              <p style="color: #333; margin-bottom: 0; text-align: left;">4. Send it and wait for payment details</p>
            </div>
            <p style="color: #e74c3c; font-weight: 600; margin-bottom: 20px;">⚠️ Important: You must send the message to SOLEIL to complete your order!</p>
            <button onclick="window.openMessenger('${messengerUrl}', '${orderIds}', ${isMobile}); this.parentElement.parentElement.remove();" style="background: #582e4e; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; width: 100%; margin-bottom: 10px;">
              📱 Open Messenger
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
              Cancel (Order will be incomplete)
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(promptDiv);
    };

    // Create global function to handle messenger opening
    window.openMessenger = (url, orderIds, isMobile) => {
      if (isMobile) {
        // Try to open native app first
        window.location.href = url;
        
        // Fallback to web version after a short delay if app doesn't open
        setTimeout(() => {
          window.open(`https://m.me/61567161596724`, '_blank');
        }, 1000);
      } else {
        window.open(url, '_blank');
      }
      
      setTimeout(() => {
        navigate('/contact', { 
          state: { 
            orderSuccess: true, 
            orderIds: orderRecords.map(order => order.id),
            redirectedToMessenger: true
          } 
        });
      }, 2000);
    };

    // Copy to clipboard for desktop, show prompt for both
    if (!isMobile) {
      navigator.clipboard.writeText(message).then(() => {
        showSuccessPrompt();
      }).catch(() => {
        showSuccessPrompt();
      });
    } else {
      showSuccessPrompt();
    }
  };

  // Main order submission handler
  const handleSubmitOrder = async () => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    const fullAddress = getFullAddress();

    try {
      // Step 1: Validate stock availability
      const stockValidation = await validateStockAvailability();

      // Step 2: Create order records for each bracelet
      const orderRecords = [];

      for (let i = 0; i < orderData.bracelets.length; i++) {
        const bracelet = orderData.bracelets[i];
        
        // Create the main order record
        const orderRecord = {
          customer_name: customerInfo.name.trim(),
          customer_phone: customerInfo.phone.trim(),
          customer_email: customerInfo.email.trim() || null,
          customer_address: fullAddress,
          payment_method: customerInfo.paymentMethod,
          delivery_method: customerInfo.deliveryMethod,
          status: 'awaiting_confirmation',
          total_amount: bracelet.totalPrice,
          created_at: new Date().toISOString()
        };

        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert([orderRecord])
          .select()
          .single();

        if (orderError) {
          throw new Error('Failed to create order. Please try again.');
        }

        orderRecords.push(insertedOrder);
        
        // Create bracelet record linked to this order
        const braceletRecord = {
          order_id: insertedOrder.id,
          size: bracelet.size || null,
          total_price: bracelet.totalPrice,
          bracelet_arrangement: bracelet.charms.map(charm => charm.id.toString())
        };

        const { error: braceletError } = await supabase
          .from('bracelets')
          .insert([braceletRecord])
          .select()
          .single();

        if (braceletError) {
          throw new Error('Order created but failed to save bracelet details. Please contact support.');
        }

        // Create order items for this bracelet
        const braceletCharmQuantities = {};
        
        bracelet.charms.forEach(charm => {
          if (charm && charm.id) {
            if (braceletCharmQuantities[charm.id]) {
              braceletCharmQuantities[charm.id].totalCount++;
            } else {
              braceletCharmQuantities[charm.id] = {
                id: charm.id,
                name: charm.name,
                totalCount: 1,
                price: charm.price
              };
            }
          }
        });

        const orderItems = [];
        
        for (const charmId in braceletCharmQuantities) {
          const charmData = braceletCharmQuantities[charmId];
          const numericCharmId = parseInt(charmId);
          
          orderItems.push({
            order_id: insertedOrder.id,
            charm_id: numericCharmId,
            quantity: charmData.totalCount,
            price: charmData.price
          });
        }

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          throw new Error('Order created but failed to save order items. Please contact support.');
        }
      }

      // Step 3: Update stock after all orders are successfully created
      await updateCharmStock(stockValidation);

      // Step 4: Generate message and redirect to Messenger
      const orderIds = orderRecords.map(order => order.id.toString().padStart(4, '0')).join(', #');
      const totalBracelets = orderData.bracelets.length;
      const messageContent = generateMessengerMessage(orderRecords, customerInfo, fullAddress, orderIds, totalBracelets);
      
      redirectToMessenger(messageContent, orderRecords, orderIds);
      
    } catch (error) {
      const errorMessage = error.message || 'An unexpected error occurred. Please try again.';
      alert(errorMessage);
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
          {/* Order Summary Section */}
          <motion.div 
            className="order-summary-section"
            initial={{ x: -20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            {/* Bracelets Preview */}
            <div className="bracelets-preview">
              <h2 className="font-cormorant-medium">Your Bracelet{orderData.bracelets.length > 1 ? 's' : ''} ({orderData.bracelets.length})</h2>
              
              {orderData.bracelets.map((bracelet, braceletIndex) => (
                <div key={bracelet.id || braceletIndex} className="bracelet-final-preview">
                  <h3 className="font-cormorant-medium">Bracelet #{braceletIndex + 1}</h3>
                  <div className="final-bracelet-visual">
                    {bracelet.charms.map((charm, charmIndex) => (
                      <div key={charmIndex} className="final-bracelet-charm">
                        <img src={charm?.image} alt={charm?.name} />
                      </div>
                    ))}
                  </div>
                  <div className="bracelet-info">
                    <p className="bracelet-size font-inter-regular">Size: {bracelet.size} cm</p>
                    <p className="bracelet-price font-montserrat-medium">₱{bracelet.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Details */}
            <div className="order-details">
              <h2 className="font-montserrat-semibold">Order Summary</h2>
              <div className="order-items">
                {orderData.bracelets.map((bracelet, braceletIndex) => {
                  const charmBreakdown = {};
                  bracelet.charms.forEach(charm => {
                    if (charm && charm.id) {
                      if (charmBreakdown[charm.id]) {
                        charmBreakdown[charm.id].count++;
                      } else {
                        charmBreakdown[charm.id] = { ...charm, count: 1 };
                      }
                    }
                  });

                  return (
                    <div key={bracelet.id || braceletIndex} className="bracelet-order-section">
                      <h4 className="font-cormorant-medium">Bracelet #{braceletIndex + 1} - {bracelet.size}cm</h4>
                      {Object.values(charmBreakdown).map((charm, index) => (
                        <motion.div 
                          key={`${bracelet.id}-${charm.id}-${index}`}
                          className="order-item"
                          initial={{ x: -10, opacity: 0 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.1 * index, duration: 0.3 }}
                        >
                          <div className="item-info">
                            <img src={charm.image} alt={charm.name} className="item-image" />
                            <div className="item-details">
                              <span className="item-name font-inter-regular">{charm.name}</span>
                              {charm.count > 1 && (
                                <span className="item-quantity font-inter-regular">x{charm.count}</span>
                              )}
                            </div>
                          </div>
                          <span className="item-price font-montserrat-medium">₱{(charm.price * charm.count).toLocaleString()}</span>
                        </motion.div>
                      ))}
                      <div className="bracelet-subtotal">
                        <span className="font-montserrat-medium">Subtotal: ₱{bracelet.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
                
                <div className="order-total">
                  <div className="total-divider"></div>
                  <div className="total-row">
                    <span className="total-label font-montserrat-semibold">Total Amount</span>
                    <span className="total-amount font-montserrat-semibold">₱{orderData.totalPrice.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Customer Information Section */}
          <motion.div 
            className="customer-info-section"
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            <div className="customer-form">
              <h2 className="font-montserrat-semibold">Fill in Your Details</h2>
              
              {/* Personal Information */}
              <div className="form-group">
                <label htmlFor="name" className="font-inter-medium">Full Name *</label>
                <input
                  type="text"
                  id="name"
                  value={customerInfo.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`font-inter-regular ${errors.name ? 'error' : ''}`}
                  placeholder="Enter your full name"
                  disabled={isSubmitting}
                />
                {errors.name && <span className="error-message font-inter-regular">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="font-inter-medium">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  value={customerInfo.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  className={`font-inter-regular ${errors.phone ? 'error' : ''}`}
                  placeholder="09XXXXXXXXX"
                  disabled={isSubmitting}
                />
                {errors.phone && <span className="error-message font-inter-regular">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email" className="font-inter-medium">Email (Optional)</label>
                <input
                  type="email"
                  id="email"
                  value={customerInfo.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="font-inter-regular"
                  placeholder="your.email@example.com"
                  disabled={isSubmitting}
                />
              </div>

              {/* Address Section */}
              <div className="address-section">
                <h3 className="font-montserrat-medium">🇵🇭 Delivery Address</h3>
                
                <div className="address-grid">
                  <div className="form-group">
                    <label htmlFor="houseNumber" className="font-inter-medium">House/Unit Number *</label>
                    <input
                      type="text"
                      id="houseNumber"
                      value={customerInfo.houseNumber}
                      onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                      className={`font-inter-regular ${errors.houseNumber ? 'error' : ''}`}
                      placeholder="123 or Blk 1 Lot 2"
                      disabled={isSubmitting}
                    />
                    {errors.houseNumber && <span className="error-message font-inter-regular">{errors.houseNumber}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="street" className="font-inter-medium">Street Name (Optional)</label>
                    <input
                      type="text"
                      id="street"
                      value={customerInfo.street}
                      onChange={(e) => handleInputChange('street', e.target.value)}
                      className="font-inter-regular"
                      placeholder="e.g., Rizal Street"
                      disabled={isSubmitting}
                    />
                  </div>
                </div>

                <div className="address-grid">
                  <div className="form-group">
                    <label htmlFor="barangay" className="font-inter-medium">Barangay *</label>
                    <input
                      type="text"
                      id="barangay"
                      value={customerInfo.barangay}
                      onChange={(e) => handleInputChange('barangay', e.target.value)}
                      className={`font-inter-regular ${errors.barangay ? 'error' : ''}`}
                      placeholder="e.g., Barangay San Jose"
                      disabled={isSubmitting}
                    />
                    {errors.barangay && <span className="error-message font-inter-regular">{errors.barangay}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="city" className="font-inter-medium">City/Municipality *</label>
                    <input
                      type="text"
                      id="city"
                      value={customerInfo.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`font-inter-regular ${errors.city ? 'error' : ''}`}
                      placeholder="e.g., Quezon City"
                      disabled={isSubmitting}
                    />
                    {errors.city && <span className="error-message font-inter-regular">{errors.city}</span>}
                  </div>
                </div>

                <div className="address-grid">
                  <div className="form-group">
                    <label htmlFor="province" className="font-inter-medium">Province *</label>
                    <input
                      type="text"
                      id="province"
                      value={customerInfo.province}
                      onChange={(e) => handleInputChange('province', e.target.value)}
                      className={`font-inter-regular ${errors.province ? 'error' : ''}`}
                      placeholder="e.g., Metro Manila"
                      disabled={isSubmitting}
                    />
                    {errors.province && <span className="error-message font-inter-regular">{errors.province}</span>}
                  </div>

                  <div className="form-group">
                    <label htmlFor="region" className="font-inter-medium">Region *</label>
                    <select
                      id="region"
                      value={customerInfo.region}
                      onChange={(e) => handleInputChange('region', e.target.value)}
                      className={`font-inter-regular ${errors.region ? 'error' : ''}`}
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
                <label htmlFor="zipCode" className="font-inter-medium">ZIP Code *</label>
                <input
                  type="text"
                  id="zipCode"
                  value={customerInfo.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className={`font-inter-regular ${errors.zipCode ? 'error' : ''}`}
                  placeholder="e.g., 1100"
                  maxLength="4"
                  disabled={isSubmitting}
                />
                {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
              </div>
            </div>
<div className="payment-section">
                <h3 className="font-montserrat-medium">💳 Payment Method</h3>
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
                      <span className="font-inter-regular">GCash</span>
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
                      <span className="font-inter-regular">PayMaya</span>
                    </div>
                  </label>
                  
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={customerInfo.paymentMethod === 'cash'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="payment-label">
                      <span className="payment-icon">💵</span>
                      <span className="font-inter-regular">Cash</span>
                    </div>
                  </label>
                  
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="bank"
                      checked={customerInfo.paymentMethod === 'bank'}
                      onChange={(e) => handleInputChange('paymentMethod', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="payment-label">
                      <span className="payment-icon">🏦</span>
                      <span className="font-inter-regular">Bank Transfer</span>
                    </div>
                  </label>
                </div>
              </div>
              
              <div className="delivery-section">
                <h3 className="font-montserrat-medium">🚚 Delivery Method</h3>
                <div className="delivery-options">
                  <label className="delivery-option">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="jnt"
                      checked={customerInfo.deliveryMethod === 'jnt'}
                      onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="delivery-label">
                      <span className="delivery-icon">📦</span>
                      <div className="delivery-details">
                        <div className="delivery-name font-inter-medium">J&T Express</div>
                        <div className="delivery-desc font-inter-regular">Cheapest Option</div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="delivery-option">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="lbc"
                      checked={customerInfo.deliveryMethod === 'lbc'}
                      onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="delivery-label">
                      <span className="delivery-icon">💰</span>
                      <div className="delivery-details">
                        <div className="delivery-name font-inter-medium">LBC</div>
                        <div className="delivery-desc font-inter-regular">COD/COP Available</div>
                      </div>
                    </div>
                  </label>
                  
                  <label className="delivery-option">
                    <input
                      type="radio"
                      name="deliveryMethod"
                      value="lalamove"
                      checked={customerInfo.deliveryMethod === 'lalamove'}
                      onChange={(e) => handleInputChange('deliveryMethod', e.target.value)}
                      disabled={isSubmitting}
                    />
                    <div className="delivery-label">
                      <span className="delivery-icon">⚡</span>
                      <div className="delivery-details">
                        <div className="delivery-name font-inter-medium">Lalamove</div>
                        <div className="delivery-desc font-inter-regular">Same Day Delivery</div>
                      </div>
                    </div>
                  </label>
                </div>
                {errors.deliveryMethod && <span className="error-message font-inter-regular">{errors.deliveryMethod}</span>}
              </div>

              {/* Submit Button */}
              <button 
                className="finalize-order-button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                type="button"
              >
                <span className="button-text font-montserrat-medium">
                  {isSubmitting ? 'Processing Order...' : `Place Order & Contact SOLEIL`}
                </span>
                <span className="button-price font-montserrat-semibold">₱{orderData.totalPrice.toLocaleString()}</span>
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default CheckoutPage;