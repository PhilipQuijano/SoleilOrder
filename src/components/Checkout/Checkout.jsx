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
    if (passedData?.bracelets) {
      // New multiple bracelet structure from cart
      return {
        bracelets: passedData.bracelets,
        totalPrice: passedData.totalPrice
      };
    } else if (passedData?.charms) {
      // Legacy single bracelet structure
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
    paymentMethod: 'gcash',
    deliveryMethod: 'jnt'
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field, value) => {
    setCustomerInfo(prev => {
      const updated = {
        ...prev,
        [field]: value
      };
      
      if (field === 'paymentMethod' && value === 'cash') {
        updated.deliveryMethod = 'lbc';
      }
      
      return updated;
    });
    
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

  // Helper function to get charm quantities across all bracelets
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

  // Helper function to validate stock availability without updating
  const validateStockAvailability = async () => {
    const charmQuantities = getCharmQuantities();
    const stockValidation = [];
    
    for (const charmId in charmQuantities) {
      const charmData = charmQuantities[charmId];
      const numericCharmId = parseInt(charmId);
      
      console.log(`Checking stock availability for ${charmData.name}, need ${charmData.totalCount}`);
      
      const { data: currentData, error: fetchError } = await supabase
        .from('charms')
        .select('*')
        .eq('id', numericCharmId)
        .single();

      if (fetchError) {
        console.error(`Failed to fetch stock for ${charmData.name}`, fetchError);
        throw new Error(`Failed to find charm ${charmData.name} in database. Try again later.`);
      }

      console.log(`Current stock for ${charmData.name}: ${currentData.stock}, Needed: ${charmData.totalCount}`);

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

  // Helper function to update stock after successful order creation
  const updateCharmStock = async (stockValidation) => {
    console.log('Updating charm stock after successful order creation...');
    
    for (const stockItem of stockValidation) {
      const { error: updateError } = await supabase
        .from('charms')
        .update({ stock: stockItem.newStock })
        .eq('id', stockItem.charmId);

      if (updateError) {
        console.error(`Failed to update stock for ${stockItem.charmName}`, updateError);
        // This is a critical error - the order was created but stock wasn't updated
        // In a production environment, you might want to implement a rollback mechanism
        // or send an alert to administrators
        throw new Error(`Order created but failed to update stock for ${stockItem.charmName}. Please contact support immediately.`);
      }
      
      console.log(`✅ Successfully updated ${stockItem.charmName} stock from ${stockItem.currentStock} to ${stockItem.newStock}`);
    }
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
      // Step 1: Validate stock availability without updating
      console.log('Step 1: Validating stock availability...');
      const stockValidation = await validateStockAvailability();
      console.log('✅ Stock validation passed:', stockValidation);

      // Step 2: Create order records for each bracelet
      console.log('Step 2: Creating order records...');
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
          status: 'pending_confirmation',
          total_amount: bracelet.totalPrice,
          created_at: new Date().toISOString()
        };
        
        console.log(`Order record ${i + 1} to insert:`, orderRecord);

        const { data: insertedOrder, error: orderError } = await supabase
          .from('orders')
          .insert([orderRecord])
          .select()
          .single();

        if (orderError) {
          console.error(`Failed to create order ${i + 1}:`, orderError);
          throw new Error(`Failed to create order ${i + 1}. Please try again.`);
        }

        console.log(`✅ Order ${i + 1} created successfully:`, insertedOrder);
        orderRecords.push(insertedOrder);
        
        // Create bracelet record linked to this order
        const braceletRecord = {
          order_id: insertedOrder.id,
          size: bracelet.size || null,
          total_price: bracelet.totalPrice,
          bracelet_arrangement: bracelet.charms.map(charm => charm.id.toString())
        };

        const { data: insertedBracelet, error: braceletError } = await supabase
          .from('bracelets')
          .insert([braceletRecord])
          .select()
          .single();

        if (braceletError) {
          console.error(`Failed to create bracelet ${i + 1}:`, braceletError);
          throw new Error(`Order ${i + 1} created but failed to save bracelet. Please contact support.`);
        }

        console.log(`✅ Bracelet ${i + 1} created successfully:`, insertedBracelet);

        // Step 3: Create order items for this bracelet
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

        console.log(`Order items for bracelet ${i + 1}:`, orderItems);

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error(`Failed to create order items for bracelet ${i + 1}:`, itemsError);
          throw new Error(`Order ${i + 1} created but failed to save items. Please contact support.`);
        }

        console.log(`✅ Order items for bracelet ${i + 1} created successfully`);
      }

      // Step 3: Update stock ONLY after all orders are successfully created
      console.log('Step 3: Updating charm stock after successful order creation...');
      await updateCharmStock(stockValidation);
      console.log('✅ All stock updates completed successfully');

      // Step 4: Generate pre-filled message and redirect to Messenger
      console.log('Step 4: Generating messenger message and redirecting...');
      const orderIds = orderRecords.map(order => order.id.toString().padStart(4, '0')).join(', #');
      const totalBracelets = orderData.bracelets.length;
      
      // Generate message content
      const messageContent = generateMessengerMessage(orderRecords, customerInfo, fullAddress, orderIds, totalBracelets);
      
      // Redirect to Messenger with pre-filled message
      redirectToMessenger(messageContent, orderRecords, orderIds);
      
    } catch (error) {
      console.error('Error in handleSubmitOrder:', error);
      alert(error.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPaymentMethodName = (method) => {
    switch(method) {
      case 'gcash': return 'GCash';
      case 'paymaya': return 'PayMaya';
      case 'cash': return 'Cash';
      case 'bank': return 'Bank Transfer';
      default: return method.toUpperCase();
    }
  };

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

      const getDeliveryMethodName = (method) => {
        switch(method) {
          case 'jnt': return 'J&T Express (Cheapest Option)';
          case 'lbc': return 'LBC (COD/COP Available)';
          case 'lalamove': return 'Lalamove (Same Day Delivery)';
          default: return method;
        }
      };

    const message = ` *ORDER CONFIRMATION REQUEST*

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

  const redirectToMessenger = (message, orderRecords, orderIds) => {

    // Option 1: Direct Messenger link (if you have Facebook Page ID)
    const messengerUrl = `https://m.me/61567161596724?text=${encodeURIComponent(message)}`;

    const showSuccessPrompt = () => {
      const promptDiv = document.createElement('div');
      promptDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 10000;">
          <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div style="color: #28a745; font-size: 2rem; margin-bottom: 15px;">✓</div>
            <h3 style="color: #333; margin-bottom: 15px;">Order #${orderIds} created successfully!</h3>
            <p style="color: #666; margin-bottom: 15px;">Your order details have been prepared and copied to your clipboard.</p>
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #582e4e;">
              <h4 style="color: #582e4e; margin-bottom: 10px;">📋 Next Steps:</h4>
              <p style="color: #333; margin-bottom: 8px; text-align: left;">1. Click "Send Message to SOLEIL" below</p>
              <p style="color: #333; margin-bottom: 8px; text-align: left;">2. You'll be redirected to Messenger</p>
              <p style="color: #333; margin-bottom: 8px; text-align: left;">3. Paste the message and send it</p>
              <p style="color: #333; margin-bottom: 0; text-align: left;">4. Wait for SOLEIL to confirm and send payment details</p>
            </div>
            <p style="color: #e74c3c; font-weight: 600; margin-bottom: 20px;">⚠️ Important: You must send the message to SOLEIL to complete your order!</p>
            <button onclick="window.openMessenger('${messengerUrl}', '${orderIds}'); this.parentElement.parentElement.remove();" style="background: #582e4e; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; width: 100%; margin-bottom: 10px;">
              📱 Send Message to SOLEIL
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
              Cancel (Order will be incomplete)
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(promptDiv);
    };

    // Create a global function to handle the messenger opening
    window.openMessenger = (url, orderIds) => {
      // Open Messenger in a new window/tab
      window.open(url, '_blank');
      
    //Redirect current page to contact page after a short delay
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

    // Try to copy to clipboard, then show prompt regardless of success
    navigator.clipboard.writeText(message).then(() => {
      showSuccessPrompt();
    }).catch(() => {
      // If clipboard fails, show prompt with textarea
      const promptDiv = document.createElement('div');
      promptDiv.innerHTML = `
        <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); display: flex; justify-content: center; align-items: center; z-index: 10000;">
          <div style="background: white; padding: 30px; border-radius: 15px; max-width: 500px; text-align: center; box-shadow: 0 10px 30px rgba(0,0,0,0.3);">
            <div style="color: #28a745; font-size: 2rem; margin-bottom: 15px;">✓</div>
            <h3 style="color: #333; margin-bottom: 15px;">Order #${orderIds} created successfully!</h3>
            <p style="color: #666; margin-bottom: 15px;">Please copy the message below and send it to SOLEIL:</p>
            <textarea readonly style="width: 100%; height: 150px; padding: 10px; border: 1px solid #ddd; border-radius: 8px; font-size: 12px; margin-bottom: 15px; resize: none;" onclick="this.select(); document.execCommand('copy');">${message}</textarea>
            <div style="background: #f8f9fa; padding: 15px; border-radius: 10px; margin: 15px 0; border-left: 4px solid #582e4e;">
              <h4 style="color: #582e4e; margin-bottom: 10px;">📋 Next Steps:</h4>
              <p style="color: #333; margin-bottom: 5px; text-align: left;">1. Copy the message above (click on it)</p>
              <p style="color: #333; margin-bottom: 5px; text-align: left;">2. Click "Send Message to SOLEIL"</p>
              <p style="color: #333; margin-bottom: 5px; text-align: left;">3. Paste and send the message</p>
              <p style="color: #333; margin-bottom: 0; text-align: left;">4. Wait for payment details</p>
            </div>
            <button onclick="window.openMessenger('${messengerUrl}', '${orderIds}'); this.parentElement.parentElement.remove();" style="background: #582e4e; color: white; border: none; padding: 15px 30px; border-radius: 8px; font-size: 16px; cursor: pointer; width: 100%; margin-bottom: 10px;">
              📱 Send Message to SOLEIL
            </button>
            <button onclick="this.parentElement.parentElement.remove()" style="background: #6c757d; color: white; border: none; padding: 10px 20px; border-radius: 8px; cursor: pointer;">
              Cancel (Order will be incomplete)
            </button>
          </div>
        </div>
      `;
      document.body.appendChild(promptDiv);
    });
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
            {/* Multiple Bracelets Preview */}
            <div className="bracelets-preview">
              <h2>Your Bracelet{orderData.bracelets.length > 1 ? 's' : ''} ({orderData.bracelets.length})</h2>
              
              {orderData.bracelets.map((bracelet, braceletIndex) => (
                <div key={bracelet.id || braceletIndex} className="bracelet-final-preview">
                  <h3>Bracelet #{braceletIndex + 1}</h3>
                  <div className="final-bracelet-visual">
                    {bracelet.charms.map((charm, charmIndex) => (
                      <div key={charmIndex} className="final-bracelet-charm">
                        <img src={charm?.image} alt={charm?.name} />
                      </div>
                    ))}
                  </div>
                  <div className="bracelet-info">
                    <p className="bracelet-size">Size: {bracelet.size} cm</p>
                    <p className="bracelet-price">₱{bracelet.totalPrice.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Details */}
            <div className="order-details">
              <h2>Order Summary</h2>
              <div className="order-items">
                {orderData.bracelets.map((bracelet, braceletIndex) => {
                  // Get charm breakdown for this bracelet
                  const charmBreakdown = {};
                  bracelet.charms.forEach(charm => {
                    if (charm && charm.id) {
                      if (charmBreakdown[charm.id]) {
                        charmBreakdown[charm.id].count++;
                      } else {
                        charmBreakdown[charm.id] = {
                          ...charm,
                          count: 1
                        };
                      }
                    }
                  });

                  return (
                    <div key={bracelet.id || braceletIndex} className="bracelet-order-section">
                      <h4>Bracelet #{braceletIndex + 1} - {bracelet.size}cm</h4>
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
                              <span className="item-name">{charm.name}</span>
                              {charm.count > 1 && (
                                <span className="item-quantity">x{charm.count}</span>
                              )}
                            </div>
                          </div>
                          <span className="item-price">₱{(charm.price * charm.count).toLocaleString()}</span>
                        </motion.div>
                      ))}
                      <div className="bracelet-subtotal">
                        <span>Subtotal: ₱{bracelet.totalPrice.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
                
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
                <label htmlFor="zipCode">ZIP Code *</label>
                <input
                  type="text"
                  id="zipCode"
                  value={customerInfo.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  className={errors.zipCode ? 'error' : ''}
                  placeholder="e.g., 1100"
                  maxLength="4"
                  disabled={isSubmitting}
                />
                {errors.zipCode && <span className="error-message">{errors.zipCode}</span>}
              </div>
            </div>
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
                      Cash
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
                      Bank Transfer
                    </div>
                  </label>
                </div>
              </div>
              <div className="delivery-section">
                <h3>🚚 Delivery Method</h3>
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
                        <div className="delivery-name">J&T Express</div>
                        <div className="delivery-desc">Cheapest Option</div>
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
                        <div className="delivery-name">LBC</div>
                        <div className="delivery-desc">COD/COP Available</div>
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
                        <div className="delivery-name">Lalamove</div>
                        <div className="delivery-desc">Same Day Delivery</div>
                      </div>
                    </div>
                  </label>
                </div>
                {errors.deliveryMethod && <span className="error-message">{errors.deliveryMethod}</span>}
              </div>

              {/* Submit Button */}
              <button 
                className="finalize-order-button"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
                type="button"
              >
                <span className="button-text">
                  {isSubmitting ? 'Processing Order...' : `Place Order & Contact SOLEIL`}
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