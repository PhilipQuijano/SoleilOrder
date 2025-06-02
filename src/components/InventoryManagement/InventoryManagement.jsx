// InventoryManagement.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../api/supabaseClient';
import './InventoryManagement.css'; // Use dedicated CSS file

const InventoryManagement = () => {
  const [charms, setCharms] = useState([]);
  const [filteredCharms, setFilteredCharms] = useState([]);
  const [form, setForm] = useState({ name: '', price: '', category: '', image: '', type: '' });
  const [editingId, setEditingId] = useState(null);
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  const [activeType, setActiveType] = useState('All');
  const [availableTypes, setAvailableTypes] = useState(['All']);
  const [uploadedFile, setUploadedFile] = useState(null);

  useEffect(() => {
    fetchCharms();
    // Hide navbar on component mount
    const navbar = document.querySelector('nav');
    if (navbar) {
      navbar.style.display = 'none';
      setIsNavbarHidden(true);
    }
    
    // Restore navbar visibility when component unmounts
    return () => {
      if (navbar) navbar.style.display = 'flex';
    };
  }, []);

  useEffect(() => {
    // Update filtered charms whenever the active type or charms list changes
    if (activeType === 'All') {
      setFilteredCharms(charms);
    } else {
      setFilteredCharms(charms.filter(charm => 
        charm.category === activeType || charm.type === activeType
      ));
    }
  }, [activeType, charms]);

  const fetchCharms = async () => {
    const { data, error } = await supabase.from('charms').select('*').order('id', { ascending: true });
    if (!error) {
      setCharms(data);
      
      // Extract unique categories and types for the filter tabs
      const types = ['All'];
      const categories = new Set();
      const subTypes = new Set();
      
      data.forEach(charm => {
        if (charm.category) categories.add(charm.category);
        if (charm.type) subTypes.add(charm.type);
      });
      
      setAvailableTypes([...types, ...Array.from(categories), ...Array.from(subTypes)]);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
  e.preventDefault();
  if (!form.name || !form.price || !form.category) return;

  let imageUrl = form.image;

  // Upload to Supabase if file provided
  if (uploadedFile) {
    const fileExt = uploadedFile.name.split('.').pop();
    const fileName = `${Date.now()}.${fileExt}`;
    const filePath = `newly-added/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('charm-images') // Replace with actual bucket name
      .upload(filePath, uploadedFile);

    if (uploadError) {
      console.error('Upload failed:', uploadError.message);
      alert('Image upload failed.');
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from('charm-images') // Replace with actual bucket name
      .getPublicUrl(filePath);

    imageUrl = publicUrlData.publicUrl;
  }

  const payload = { ...form, price: parseFloat(form.price), image: imageUrl };

  if (editingId) {
    await supabase.from('charms').update(payload).eq('id', editingId);
  } else {
    await supabase.from('charms').insert(payload);
  }

  setForm({ name: '', price: '', category: '', image: '', type: '' });
  setUploadedFile(null);
  setEditingId(null);
  fetchCharms();
};


  const handleEdit = (charm) => {
    if (editingId === charm.id) {
      setEditingId(null);
      setForm({ name: '', price: '', category: '', image: '', type: '' });
    } else {
      setEditingId(charm.id);
      setForm(charm);
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('charms').delete().eq('id', id);
    if (editingId === id) {
      setEditingId(null);
      setForm({ name: '', price: '', category: '', image: '', type: '' });
    }
    fetchCharms();
  };

  const handleTypeSelect = (type) => {
    setActiveType(type);
  };

  return (
    <div className="inventory-page">
      <header className="inventory-header">
        <h1>Inventory Manager</h1>
      </header>

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

      <div className="inventory-grid">
        {filteredCharms.map((charm) => (
        <div key={charm.id} className="inventory-item">
          <div className="item-image">
            <img src={charm.image} alt={charm.name} style={{ maxWidth: '80px', maxHeight: '80px', objectFit: 'contain' }} />
          </div>
          <div className="item-details">
            <h3 style={{ fontSize: '0.9rem' }}>{charm.name}</h3>
            <p className="item-price" style={{ fontSize: '1rem' }}>₱{charm.price}</p>
            <p className="item-category" style={{ fontSize: '0.8rem' }}>
              {charm.category}{charm.type ? ` > ${charm.type}` : ''}
            </p>
          </div>

          <div className="item-actions">
            <button onClick={() => handleEdit(charm)} className="edit-button">✏️</button>
            <button onClick={() => handleDelete(charm.id)} className="delete-button">🗑️</button>
          </div>

          {editingId === charm.id && (
            <form onSubmit={handleSave} className="edit-form">
              <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
              <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price" required />
              <input name="category" value={form.category} onChange={handleChange} placeholder="Category" required />
              <input name="type" value={form.type || ''} onChange={handleChange} placeholder="Type" />
              <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL" />
              <button type="submit" className="save-button">Save</button>
            </form>
          )}
        </div>
        ))}
      </div>

      <div className="add-new-section">
        <h2>Add New Charm</h2>
        <form onSubmit={handleSave} className="add-form">
          <div className="form-row">
            <input name="name" value={form.name} onChange={handleChange} placeholder="Name" required />
            <input name="price" type="number" value={form.price} onChange={handleChange} placeholder="Price" required />
          </div>
          <div className="form-row">
            <input name="category" value={form.category} onChange={handleChange} placeholder="Category" required />
            <input name="type" value={form.type || ''} onChange={handleChange} placeholder="Type" />
          </div>

          <div 
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) setUploadedFile(file);
            }}
            onClick={() => document.getElementById('fileInput').click()}
            style={{ border: '2px dashed #aaa', padding: '10px', marginBottom: '10px', cursor: 'pointer' }}
          >
            {uploadedFile ? uploadedFile.name : 'Drag & drop image here or click to browse'}
            <input
              type="file"
              accept="image/*"
              id="fileInput"
              style={{ display: 'none' }}
              onChange={(e) => setUploadedFile(e.target.files[0])}
            />
          </div>

          <input 
            name="image" 
            value={form.image} 
            onChange={handleChange} 
            placeholder="Image URL (optional if uploading)" 
          />

          <button type="submit" className="add-button">
            {editingId ? 'Update Charm' : 'Add Charm'}
          </button>
        </form>

              </div>
            </div>
          );
        };
export default InventoryManagement;