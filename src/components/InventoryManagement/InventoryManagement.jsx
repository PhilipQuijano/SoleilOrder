import React, { useEffect, useState } from 'react';
import { supabase } from '../../../api/supabaseClient';
import './InventoryManagement.css';
import PasswordPrompt from '../PasswordPrompt/PasswordPrompt';
import Papa from 'papaparse';

const InventoryManagement = () => {
  const [charms, setCharms] = useState([]);
  const [filteredCharms, setFilteredCharms] = useState([]);
  const [editingRows, setEditingRows] = useState({});
  const [isNavbarHidden, setIsNavbarHidden] = useState(false);
  const [activeType, setActiveType] = useState('All');
  const [availableTypes, setAvailableTypes] = useState(['All']);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [csvFile, setCsvFile] = useState(null);
  const [newCharm, setNewCharm] = useState({
    name: '',
    category: '',
    type: '',
    price: '',
    stock: '',
    image: ''
  });
  const [uploadingImage, setUploadingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchCharms();
    const navbar = document.querySelector('nav');
    if (navbar) {
      navbar.style.display = 'none';
      setIsNavbarHidden(true);
    }
    
    return () => {
      if (navbar) navbar.style.display = 'flex';
    };
  }, []);

  useEffect(() => {
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

  const handleEdit = (id, field, value) => {
    setEditingRows(prev => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
    
    // Add to pending changes if not already there
    if (!pendingChanges.includes(id)) {
      setPendingChanges(prev => [...prev, id]);
    }
  };

  const handleSaveChanges = async () => {
    try {
      const updates = pendingChanges.map(id => {
        const changes = editingRows[id];
        return supabase.from('charms').update(changes).eq('id', id);
      });
      
      await Promise.all(updates);
      setEditingRows({});
      setPendingChanges([]);
      fetchCharms();
      alert('Changes saved successfully!');
    } catch (error) {
      console.error('Error saving changes:', error);
      alert('Failed to save changes.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      await supabase.from('charms').delete().eq('id', id);
      fetchCharms();
    }
  };

  const handleTypeSelect = (type) => {
    setActiveType(type);
  };

  // Fixed: Handle new charm form changes
  const handleNewCharmChange = (field, value) => {
    setNewCharm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Fixed: Add new charm function
  const handleAddNewCharm = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    if (!newCharm.name || !newCharm.category || !newCharm.price || !newCharm.image) {
      alert('Please fill in all required fields (Name, Category, Price, Image)');
      return;
    }

    try {
      const { error } = await supabase.from('charms').insert([{
        name: newCharm.name,
        category: newCharm.category,
        type: newCharm.type || null,
        price: parseFloat(newCharm.price),
        stock: parseInt(newCharm.stock) || 0,
        image: newCharm.image
      }]);

      if (error) {
        console.error('Error adding new charm:', error);
        alert('Failed to add new charm: ' + error.message);
      } else {
        // Reset form
        setNewCharm({
          name: '',
          category: '',
          type: '',
          price: '',
          stock: '',
          image: ''
        });
        fetchCharms();
        alert('New charm added successfully!');
      }
    } catch (error) {
      console.error('Error adding new charm:', error);
      alert('Failed to add new charm.');
    }
  };

  // New: Upload image to Supabase storage
  const uploadImage = async (file) => {
    try {
      setUploadingImage(true);
      
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      
      // Upload to charm-images bucket
      const { data, error } = await supabase.storage
        .from('charm-images')
        .upload(fileName, file);

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('charm-images')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + error.message);
      return null;
    } finally {
      setUploadingImage(false);
    }
  };

  // New: Handle drag and drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));
    
    if (!imageFile) {
      alert('Please drop an image file');
      return;
    }

    const imageUrl = await uploadImage(imageFile);
    if (imageUrl) {
      setNewCharm(prev => ({ ...prev, image: imageUrl }));
    }
  };

  // New: Handle file input change
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const imageUrl = await uploadImage(file);
    if (imageUrl) {
      setNewCharm(prev => ({ ...prev, image: imageUrl }));
    }
  };

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const validData = results.data.filter(item => 
          item.id && item.name && item.category && item.price && item.image
        );
        
        if (validData.length === 0) {
          alert('No valid data found in CSV');
          return;
        }

        if (window.confirm(`Import ${validData.length} items? This will replace your current inventory.`)) {
          // Clear existing data
          await supabase.from('charms').delete().neq('id', 0);
          
          // Insert new data
          const { error } = await supabase.from('charms').insert(validData);
          
          if (error) {
            console.error('CSV import error:', error);
            alert('Error importing CSV');
          } else {
            fetchCharms();
            alert('Inventory imported successfully!');
          }
        }
      },
      error: (error) => {
        console.error('CSV parsing error:', error);
        alert('Error parsing CSV file');
      }
    });
  };

  const exportToCsv = () => {
    const csv = Papa.unparse(charms);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'inventory_export.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isAuthenticated) {
    return <PasswordPrompt 
      correctPassword="SoleilQuijano1234@@" 
      onSuccess={() => setIsAuthenticated(true)} 
    />;
  }

  return (
    <div className="inventory-page">
      <header className="inventory-header">
        <h1>Inventory Manager</h1>
        <div className="header-actions">
          <button onClick={exportToCsv} className="csv-button">Export to CSV</button>
          <label className="csv-upload">
            Import from CSV
            <input type="file" accept=".csv" onChange={handleCsvUpload} style={{ display: 'none' }} />
          </label>
          {pendingChanges.length > 0 && (
            <button onClick={handleSaveChanges} className="save-changes-button">
              Confirm Changes ({pendingChanges.length})
            </button>
          )}
        </div>
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

      <div className="inventory-table-container">
        <table className="inventory-table">
          <thead>
            <tr>
              <th>Image</th>
              <th>ID</th>
              <th>Name</th>
              <th>Category</th>
              <th>Type</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCharms.map((charm) => (
              <tr key={charm.id} className={editingRows[charm.id] ? 'editing-row' : ''}>
                <td className="image-cell">
                  <img 
                    src={charm.image} 
                    alt={charm.name} 
                    className="charm-image" 
                    onError={(e) => e.target.style.display = 'none'}
                  />
                </td>
                <td>{charm.id}</td>
                <td>
                  <input
                    type="text"
                    value={editingRows[charm.id]?.name || charm.name}
                    onChange={(e) => handleEdit(charm.id, 'name', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={editingRows[charm.id]?.category || charm.category}
                    onChange={(e) => handleEdit(charm.id, 'category', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="text"
                    value={editingRows[charm.id]?.type || charm.type || ''}
                    onChange={(e) => handleEdit(charm.id, 'type', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={editingRows[charm.id]?.price || charm.price}
                    onChange={(e) => handleEdit(charm.id, 'price', e.target.value)}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={editingRows[charm.id]?.stock || charm.stock || 0}
                    onChange={(e) => handleEdit(charm.id, 'stock', e.target.value)}
                  />
                </td>
                <td className="actions-cell">
                  <button onClick={() => handleDelete(charm.id)} className="delete-button">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="add-new-section">
        <h2>Add New Charm</h2>
        <form onSubmit={handleAddNewCharm} className="add-form">
          <div className="form-row">
            <input 
              name="name" 
              placeholder="Name" 
              required 
              value={newCharm.name}
              onChange={(e) => handleNewCharmChange('name', e.target.value)}
            />
            <input 
              name="category" 
              placeholder="Category" 
              required 
              value={newCharm.category}
              onChange={(e) => handleNewCharmChange('category', e.target.value)}
            />
          </div>
          <div className="form-row">
            <input 
              name="type" 
              placeholder="Type" 
              value={newCharm.type}
              onChange={(e) => handleNewCharmChange('type', e.target.value)}
            />
            <input 
              name="price" 
              type="number" 
              placeholder="Price" 
              required 
              value={newCharm.price}
              onChange={(e) => handleNewCharmChange('price', e.target.value)}
            />
          </div>
          <div className="form-row">
            <input 
              name="stock" 
              type="number" 
              placeholder="Stock" 
              value={newCharm.stock}
              onChange={(e) => handleNewCharmChange('stock', e.target.value)}
            />
            <input 
              name="image" 
              placeholder="Image URL" 
              required 
              value={newCharm.image}
              onChange={(e) => handleNewCharmChange('image', e.target.value)}
            />
          </div>
          
          {/* New: Image Upload Section */}
          <div className="image-upload-section">
            <h3>Or Upload Image</h3>
            <div 
              className={`drop-zone ${dragOver ? 'drag-over' : ''}`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploadingImage ? (
                <p>Uploading image...</p>
              ) : (
                <>
                  <p>Drag and drop an image here, or</p>
                  <label className="upload-button">
                    Choose File
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </>
              )}
            </div>
            {newCharm.image && (
              <div className="image-preview">
                <img src={newCharm.image} alt="Preview" style={{ maxWidth: '100px', maxHeight: '100px' }} />
              </div>
            )}
          </div>

          <button type="submit" className="add-button" disabled={uploadingImage}>
            Add New Charm
          </button>
        </form>
      </div>
    </div>
  );
};

export default InventoryManagement;