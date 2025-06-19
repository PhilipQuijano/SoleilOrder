import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import './OrderTracking.css';
import { supabase } from '../../../api/supabaseClient';

const OrderTracking = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [editingOrder, setEditingOrder] = useState(null);
  const [viewingOrder, setViewingOrder] = useState(null);

  const statusOptions = [
    { value: 'all', label: 'All Orders', color: '#333' },
    { value: 'awaiting_payment', label: 'Awaiting Payment', color: '#ff9800' },
    { value: 'paid', label: 'Paid', color: '#4caf50' },
    { value: 'processing', label: 'Processing', color: '#2196f3' },
    { value: 'shipped', label: 'Shipped', color: '#9c27b0' },
    { value: 'delivered', label: 'Delivered', color: '#4caf50' },
    { value: 'cancelled', label: 'Cancelled', color: '#f44336' }
  ];

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            charms (
              name,
              image,
              price
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;
      
      // Update local state
      setOrders(orders.map(order => 
        order.id === orderId 
          ? { ...order, status: newStatus }
          : order
      ));
      
      setEditingOrder(null);
    } catch (error) {
      console.error('Error updating order status:', error);
      alert('Failed to update order status');
    }
  };

  const getFilteredOrders = () => {
    if (selectedStatus === 'all') return orders;
    return orders.filter(order => order.status === selectedStatus);
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : '#333';
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const calculateOrderTotal = (orderItems) => {
    return orderItems.reduce((total, item) => total + (item.quantity * item.price), 0);
  };

  const parseBraceletArrangement = (arrangementString) => {
    try {
      return JSON.parse(arrangementString || '[]');
    } catch (error) {
      console.error('Error parsing bracelet arrangement:', error);
      return [];
    }
  };

  if (loading) {
    return (
      <div className="order-tracking-page">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="order-tracking-page"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header */}
      <motion.div 
        className="order-header"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.6 }}
      >
        <h1>Order Tracking</h1>
        <div className="header-stats">
          <span className="total-orders">Total Orders: {orders.length}</span>
          <span className="filtered-orders">
            Showing: {getFilteredOrders().length}
          </span>
        </div>
      </motion.div>

      {/* Status Filter Tabs */}
      <motion.div 
        className="status-tabs"
        initial={{ y: -10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.6 }}
      >
        {statusOptions.map((status) => (
          <button
            key={status.value}
            className={`status-tab ${selectedStatus === status.value ? 'active' : ''}`}
            onClick={() => setSelectedStatus(status.value)}
            style={{
              backgroundColor: selectedStatus === status.value ? status.color : '#f0f0f0',
              color: selectedStatus === status.value ? 'white' : '#333'
            }}
          >
            {status.label}
            {status.value !== 'all' && (
              <span className="status-count">
                {orders.filter(order => order.status === status.value).length}
              </span>
            )}
          </button>
        ))}
      </motion.div>

      {/* Orders Table */}
      <motion.div 
        className="orders-table-container"
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
      >
        {getFilteredOrders().length === 0 ? (
          <div className="no-orders">
            <p>No orders found for the selected status.</p>
          </div>
        ) : (
          <table className="orders-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Items</th>
                <th>Total</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {getFilteredOrders().map((order) => (
                <motion.tr
                  key={order.id}
                  className={editingOrder === order.id ? 'editing-row' : ''}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <td className="order-id">
                    #{order.id.toString().padStart(4, '0')}
                  </td>
                  
                  <td className="customer-info">
                    <div className="customer-details">
                      <strong>{order.customer_name}</strong>
                      <small>{order.customer_phone}</small>
                    </div>
                  </td>
                  
                  <td className="order-items">
                    <div className="items-preview">
                      {order.order_items.slice(0, 3).map((item, index) => (
                        <div key={index} className="item-preview">
                          <img 
                            src={item.charms?.image || '/default-charm.jpg'} 
                            alt={item.charms?.name || 'Charm'}
                            className="item-image"
                          />
                          <span className="item-quantity">×{item.quantity}</span>
                        </div>
                      ))}
                      {order.order_items.length > 3 && (
                        <span className="more-items">
                          +{order.order_items.length - 3} more
                        </span>
                      )}
                    </div>
                  </td>
                  
                  <td className="order-total">
                    ₱{calculateOrderTotal(order.order_items).toLocaleString()}
                  </td>
                  
                  <td className="order-status">
                    {editingOrder === order.id ? (
                      <select
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="status-select"
                        autoFocus
                      >
                        {statusOptions.slice(1).map((status) => (
                          <option key={status.value} value={status.value}>
                            {status.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <span 
                        className="status-badge"
                        style={{ backgroundColor: getStatusColor(order.status) }}
                      >
                        {statusOptions.find(s => s.value === order.status)?.label || order.status}
                      </span>
                    )}
                  </td>
                  
                  <td className="order-date">
                    {formatDate(order.created_at)}
                  </td>
                  
                  <td className="actions-cell">
                    {editingOrder === order.id ? (
                      <div className="action-buttons">
                        <button
                          className="cancel-button"
                          onClick={() => setEditingOrder(null)}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="action-buttons">
                        <button
                          className="edit-button"
                          onClick={() => setEditingOrder(order.id)}
                        >
                          Edit Status
                        </button>
                        <button
                          className="view-button"
                          onClick={() => setViewingOrder(order)}
                        >
                          View Details
                        </button>
                      </div>
                    )}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        )}
      </motion.div>

      {/* Order Details Modal */}
      {viewingOrder && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setViewingOrder(null)}
        >
          <motion.div 
            className="modal-content"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Order Details #{viewingOrder.id.toString().padStart(4, '0')}</h2>
              <button 
                className="close-button"
                onClick={() => setViewingOrder(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              {/* Customer Information */}
              <div className="details-section">
                <h3>Customer Information</h3>
                <div className="customer-grid">
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{viewingOrder.customer_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{viewingOrder.customer_phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{viewingOrder.customer_email || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{viewingOrder.customer_address}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Payment Method:</span>
                    <span className="detail-value">
                      {viewingOrder.payment_method === 'gcash' ? '📱 GCash' : 
                       viewingOrder.payment_method === 'bank' ? '🏦 Bank Transfer' : 
                       viewingOrder.payment_method}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bracelet Design */}
              {viewingOrder.bracelet_arrangement && (
                <div className="details-section">
                  <h3>Bracelet Design</h3>
                  <div className="bracelet-preview">
                    <div className="bracelet-visual">
                      {parseBraceletArrangement(viewingOrder.bracelet_arrangement).map((charm, index) => (
                        <div key={index} className="bracelet-charm">
                          <img src={charm.image} alt={charm.name} />
                        </div>
                      ))}
                    </div>
                    {viewingOrder.bracelet_size && (
                      <p className="bracelet-info">Size: {viewingOrder.bracelet_size} cm</p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div className="details-section">
                <h3>Order Items</h3>
                <div className="items-list">
                  {viewingOrder.order_items.map((item, index) => (
                    <div key={index} className="order-item-detail">
                      <img 
                        src={item.charms?.image || '/default-charm.jpg'} 
                        alt={item.charms?.name || 'Charm'}
                        className="item-detail-image"
                      />
                      <div className="item-detail-info">
                        <span className="item-name">{item.charms?.name || 'Unknown Charm'}</span>
                        <span className="item-quantity">Quantity: {item.quantity}</span>
                        <span className="item-price">₱{item.price.toLocaleString()} each</span>
                      </div>
                      <div className="item-total">
                        ₱{(item.quantity * item.price).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="order-summary">
                  <div className="summary-row">
                    <span className="summary-label">Total Amount:</span>
                    <span className="summary-value">₱{calculateOrderTotal(viewingOrder.order_items).toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Status:</span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(viewingOrder.status) }}
                    >
                      {statusOptions.find(s => s.value === viewingOrder.status)?.label || viewingOrder.status}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Order Date:</span>
                    <span className="summary-value">{formatDate(viewingOrder.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default OrderTracking;