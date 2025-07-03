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
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting');

  const statusOptions = [
    { value: 'all', label: 'All Orders', color: '#6B7280' },
    { value: 'awaiting_payment', label: 'Awaiting Payment', color: '#F59E0B' },
    { value: 'paid', label: 'Paid', color: '#10B981' },
    { value: 'processing', label: 'Processing', color: '#3B82F6' },
    { value: 'shipped', label: 'Shipped', color: '#8B5CF6' },
    { value: 'delivered', label: 'Delivered', color: '#059669' },
    { value: 'cancelled', label: 'Cancelled', color: '#EF4444' }
  ];

    useEffect(() => {
  fetchOrders();
  
  const channel = supabase
    .channel('public:orders')
    .on('postgres_changes', 
      { event: 'INSERT', schema: 'public', table: 'orders' }, 
      async (payload) => {
        console.log('New order created:', payload);
        // Fetch the complete order data with relations
        const { data: newOrder, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              charms (
                id,
                name,
                image,
                price
              )
            ),
            bracelets (
              id,
              size,
              total_price,
              bracelet_arrangement
            )
          `)
          .eq('id', payload.new.id)
          .single();
        
        if (!error && newOrder) {
          setOrders(prevOrders => [newOrder, ...prevOrders]);
        }
      }
    )
    .on('postgres_changes', 
      { event: 'UPDATE', schema: 'public', table: 'orders' }, 
      (payload) => {
        console.log('Order updated:', payload);
        setOrders(prevOrders => 
          prevOrders.map(order => 
            order.id === payload.new.id 
              ? { ...order, ...payload.new }
              : order
          )
        );
      }
    )
    .on('postgres_changes', 
      { event: 'DELETE', schema: 'public', table: 'orders' }, 
      (payload) => {
        console.log('Order deleted:', payload);
        setOrders(prevOrders => 
          prevOrders.filter(order => order.id !== payload.old.id)
        );
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}, []);

   const fetchOrders = async () => {
      setLoading(true);
      try {
        setConnectionStatus('connecting');
        const { data, error } = await supabase
          .from('orders')
          .select(`
            *,
            order_items (
              *,
              charms (
                id,
                name,
                image,
                price
              )
            ),
            bracelets (
              id,
              size,
              total_price,
              bracelet_arrangement
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setOrders(data || []);
        setConnectionStatus('connected');
      } catch (error) {
        console.error('Error fetching orders:', error);
        setConnectionStatus('error');
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

  const deleteOrder = async (orderId) => {
    try {
      // First delete order items
      const { error: itemsError } = await supabase
        .from('order_items')
        .delete()
        .eq('order_id', orderId);

      if (itemsError) throw itemsError;

      // Then delete the order
      const { error: orderError } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (orderError) throw orderError;

      // Update local state
      setOrders(orders.filter(order => order.id !== orderId));
      setDeleteConfirm(null);
      setViewingOrder(null);
    } catch (error) {
      console.error('Error deleting order:', error);
      alert('Failed to delete order');
    }
  };

  const getFilteredOrders = () => {
    if (selectedStatus === 'all') return orders;
    return orders.filter(order => order.status === selectedStatus);
  };

  const getStatusColor = (status) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return statusOption ? statusOption.color : '#6B7280';
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
      if (!arrangementString) return [];
      
      // Handle both string and already parsed array
      const parsed = typeof arrangementString === 'string' 
        ? JSON.parse(arrangementString) 
        : arrangementString;
      
      // Ensure it's an array of IDs
      if (Array.isArray(parsed)) {
        return parsed.map(id => id.toString());
      }
      
      return [];
    } catch (error) {
      console.error('Error parsing bracelet arrangement:', error);
      return [];
    }
  };

  // Add this new function to get charm details by IDs
  const getCharmsByIds = async (charmIds) => {
    try {
      if (!charmIds || charmIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from('charms')
        .select('*')
        .in('id', charmIds);
      
      if (error) throw error;
      
      // Return charms in the same order as the IDs
      return charmIds.map(id => 
        data.find(charm => charm.id.toString() === id.toString())
      ).filter(Boolean);
    } catch (error) {
      console.error('Error fetching charm details:', error);
      return [];
    }
  };

    const BraceletPreviewModal = ({ arrangement, orderCharms, size }) => {
      const [charmDetails, setCharmDetails] = useState([]);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const fetchCharmDetails = async () => {
          try {
            if (!arrangement) {
              setCharmDetails([]);
              setLoading(false);
              return;
            }

            // Parse the arrangement - handle both string and array formats
            let charmIds = [];
            if (typeof arrangement === 'string') {
              try {
                charmIds = JSON.parse(arrangement);
              } catch (e) {
                console.error('Error parsing arrangement:', e);
                charmIds = [];
              }
            } else if (Array.isArray(arrangement)) {
              charmIds = arrangement;
            }

            if (charmIds.length === 0) {
              setCharmDetails([]);
              setLoading(false);
              return;
            }

            const { data, error } = await supabase
              .from('charms')
              .select('*')
              .in('id', charmIds);

            if (error) throw error;

            // Order charms according to bracelet arrangement
            const orderedCharms = charmIds.map(id => 
              data.find(charm => charm.id.toString() === id.toString())
            ).filter(Boolean);

            setCharmDetails(orderedCharms);
          } catch (error) {
            console.error('Error fetching charm details:', error);
            setCharmDetails([]);
          } finally {
            setLoading(false);
          }
        };

        fetchCharmDetails();
      }, [arrangement]);

      if (loading) {
        return <div className="loading-bracelet">Loading bracelet design...</div>;
      }

      if (charmDetails.length === 0) {
        return <div className="no-bracelet">No bracelet design available</div>;
      }

      return (
        <div className="bracelet-preview-section">
          <div className="bracelet-visual">
            {charmDetails.map((charm, index) => (
              <div key={index} className="bracelet-charm">
                <img 
                  src={charm.image || '/default-charm.jpg'} 
                  alt={charm.name || 'Charm'} 
                  title={charm.name}
                />
              </div>
            ))}
          </div>
          <div className="bracelet-info">
            <p><strong>Size:</strong> {size || 'Not specified'} cm</p>
            <p><strong>Total Charms:</strong> {charmDetails.length}</p>
            <p><strong>Bracelet Price:</strong> ₱{charmDetails.reduce((sum, charm) => sum + (charm.price || 0), 0).toLocaleString()}</p>
          </div>
        </div>
      );
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
        <h1>Order Management</h1>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{orders.length}</span>
            <span className="stat-label">Total Orders</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{getFilteredOrders().length}</span>
            <span className="stat-label">Showing</span>
          </div>
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
              backgroundColor: selectedStatus === status.value ? status.color : 'transparent',
              color: selectedStatus === status.value ? 'white' : status.color,
              borderColor: status.color
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
            <div className="empty-state">
              <div className="empty-icon">📋</div>
              <h3>No orders found</h3>
              <p>No orders match the selected status filter.</p>
            </div>
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
                      initial={{ opacity: 0, x: -20, backgroundColor: '#e8f5e9' }}
                      animate={{ opacity: 1, x: 0, backgroundColor: 'transparent' }}
                      transition={{ duration: 0.5 }}
                      layout
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
                          +{order.order_items.length - 3}
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
                          Edit
                        </button>
                        <button
                          className="view-button"
                          onClick={() => setViewingOrder(order)}
                        >
                          View
                        </button>
                        <button
                          className="delete-button"
                          onClick={() => setDeleteConfirm(order)}
                        >
                          Delete
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
                    <span className="detail-label">Name</span>
                    <span className="detail-value">{viewingOrder.customer_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone</span>
                    <span className="detail-value">{viewingOrder.customer_phone}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email</span>
                    <span className="detail-value">{viewingOrder.customer_email || 'Not provided'}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address</span>
                    <span className="detail-value">{viewingOrder.customer_address}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Payment Method</span>
                    <span className="detail-value">
                      {viewingOrder.payment_method === 'gcash' ? 'GCash' : 
                       viewingOrder.payment_method === 'bank' ? 'Bank Transfer' : 
                       viewingOrder.payment_method}
                    </span>
                  </div>
                </div>
              </div>

              {/* Bracelet Design */}
                {viewingOrder.bracelets && viewingOrder.bracelets.length > 0 && (
                  <div className="details-section">
                    <h3>Bracelet Design</h3>
                    <BraceletPreviewModal 
                      arrangement={viewingOrder.bracelets[0].bracelet_arrangement}
                      orderCharms={viewingOrder.order_items}
                      size={viewingOrder.bracelets[0].size}
                    />
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
                    <span className="summary-label">Total Amount</span>
                    <span className="summary-value total-amount">₱{calculateOrderTotal(viewingOrder.order_items).toLocaleString()}</span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Status</span>
                    <span 
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(viewingOrder.status) }}
                    >
                      {statusOptions.find(s => s.value === viewingOrder.status)?.label || viewingOrder.status}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span className="summary-label">Order Date</span>
                    <span className="summary-value">{formatDate(viewingOrder.created_at)}</span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <motion.div 
          className="modal-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setDeleteConfirm(null)}
        >
          <motion.div 
            className="modal-content delete-modal"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>Confirm Delete</h2>
              <button 
                className="close-button"
                onClick={() => setDeleteConfirm(null)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="delete-confirmation">
                <div className="warning-icon">⚠️</div>
                <h3>Are you sure you want to delete this order?</h3>
                <p>
                  Order #{deleteConfirm.id.toString().padStart(4, '0')} by {deleteConfirm.customer_name} 
                  will be permanently deleted. This action cannot be undone.
                </p>
                <div className="delete-actions">
                  <button 
                    className="cancel-delete-button"
                    onClick={() => setDeleteConfirm(null)}
                  >
                    Cancel
                  </button>
                  <button 
                    className="confirm-delete-button"
                    onClick={() => deleteOrder(deleteConfirm.id)}
                  >
                    Delete Order
                  </button>
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