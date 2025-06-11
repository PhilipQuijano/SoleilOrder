// src/pages/admin/events/AdminEvents.jsx
import React, { useEffect, useState } from 'react';
import { supabase } from '../../../api/supabaseClient';
import './AdminEvents.css';
import PasswordPrompt from '../PasswordPrompt/PasswordPrompt';

const AdminEvents = () => {
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState({ 
    title: '', 
    date: '', 
    description: '', 
    image: '' 
  });
  const [editingId, setEditingId] = useState(null);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
    // Hide navbar
    const navbar = document.querySelector('nav');
    if (navbar) navbar.style.display = 'none';
    
    return () => {
      if (navbar) navbar.style.display = 'flex';
    };
  }, []);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('date', { ascending: true });
      
      if (!error) {
        setEvents(data || []);
      } else {
        console.error('Error fetching events:', error);
        alert('Failed to fetch events');
      }
    } catch (error) {
      console.error('Error fetching events:', error);
      alert('Failed to fetch events');
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.description) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    let imageUrl = form.image;

    try {
      // Upload to Supabase if file provided
      if (uploadedFile) {
        const fileExt = uploadedFile.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `events/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('event-images')
          .upload(filePath, uploadedFile);

        if (uploadError) {
          console.error('Upload failed:', uploadError.message);
          alert(`Image upload failed: ${uploadError.message}`);
          setLoading(false);
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('event-images')
          .getPublicUrl(filePath);

        imageUrl = publicUrlData.publicUrl;
      }

      const payload = { ...form, image: imageUrl };

      let result;
      if (editingId) {
        result = await supabase
          .from('events')
          .update(payload)
          .eq('id', editingId);
      } else {
        result = await supabase
          .from('events')
          .insert(payload);
      }

      if (result.error) {
        console.error('Database error:', result.error);
        alert(`Failed to save event: ${result.error.message}`);
        setLoading(false);
        return;
      }

      // Reset form
      setForm({ title: '', date: '', description: '', image: '' });
      setUploadedFile(null);
      setEditingId(null);
      
      // Refresh events list
      await fetchEvents();
      
      alert(editingId ? 'Event updated successfully!' : 'Event added successfully!');
    } catch (error) {
      console.error('Error saving event:', error);
      alert('Failed to save event');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (event) => {
    if (editingId === event.id) {
      // Cancel editing
      setEditingId(null);
      setForm({ title: '', date: '', description: '', image: '' });
      setUploadedFile(null);
    } else {
      // Start editing
      setEditingId(event.id);
      setForm(event);
      setUploadedFile(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this event?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Delete error:', error);
        alert(`Failed to delete event: ${error.message}`);
        return;
      }

      if (editingId === id) {
        setEditingId(null);
        setForm({ title: '', date: '', description: '', image: '' });
        setUploadedFile(null);
      }
      
      await fetchEvents();
      alert('Event deleted successfully!');
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const handleFileChange = (file) => {
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }
      
      setUploadedFile(file);
    }
  };

  if (!isAuthenticated) {
    return <PasswordPrompt 
      correctPassword="SoleilQuijano1234@@" 
      onSuccess={() => setIsAuthenticated(true)} 
    />;
  }

  return (
    <div className="admin-events-page">
      <header className="admin-events-header">
        <h1>Events Manager</h1>
        <p>Manage events that appear on the homepage</p>
      </header>

      <div className="events-grid">
        {events.length === 0 ? (
          <div className="no-events">
            <p>No events yet. Add your first event below!</p>
          </div>
        ) : (
          events.map((event) => (
            <div key={event.id} className="event-item">
              <div className="event-image-preview">
                {event.image ? (
                  <img src={event.image} alt={event.title} />
                ) : (
                  <div className="no-image-placeholder">No Image</div>
                )}
              </div>
              <div className="event-details">
                <h3>{event.title}</h3>
                <p className="event-date">{event.date}</p>
                <p className="event-description">{event.description}</p>
              </div>

              <div className="event-actions">
                <button 
                  onClick={() => handleEdit(event)} 
                  className={`edit-button ${editingId === event.id ? 'cancel-button' : ''}`}
                >
                  {editingId === event.id ? 'Cancel' : 'Edit'}
                </button>
                <button 
                  onClick={() => handleDelete(event.id)} 
                  className="delete-button"
                >
                  Delete
                </button>
              </div>

              {editingId === event.id && (
                <form onSubmit={handleSave} className="edit-form">
                  <input 
                    name="title" 
                    value={form.title} 
                    onChange={handleChange} 
                    placeholder="Title" 
                    required 
                  />
                  <input 
                    name="date" 
                    value={form.date} 
                    onChange={handleChange} 
                    placeholder="Date (e.g., July 15, 2025)" 
                    required 
                  />
                  <textarea 
                    name="description" 
                    value={form.description} 
                    onChange={handleChange} 
                    placeholder="Description" 
                    required 
                  />
                  <input 
                    name="image" 
                    value={form.image} 
                    onChange={handleChange} 
                    placeholder="Image URL (optional if uploading file)" 
                  />
                  <button type="submit" className="save-button" disabled={loading}>
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </form>
              )}
            </div>
          ))
        )}
      </div>

      <div className="add-new-section">
        <h2>{editingId ? 'Edit Event' : 'Add New Event'}</h2>
        <form onSubmit={handleSave} className="add-form">
          <input 
            name="title" 
            value={form.title} 
            onChange={handleChange} 
            placeholder="Event Title" 
            required 
          />
          <input 
            name="date" 
            value={form.date} 
            onChange={handleChange} 
            placeholder="Date (e.g., July 15, 2025)" 
            required 
          />
          <textarea 
            name="description" 
            value={form.description} 
            onChange={handleChange} 
            placeholder="Event Description" 
            required 
            rows="4"
          />
          
          <div 
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              handleFileChange(file);
            }}
            onClick={() => document.getElementById('fileInput').click()}
          >
            {uploadedFile ? (
              <div>
                <strong>Selected:</strong> {uploadedFile.name}
                <button 
                  type="button" 
                  onClick={(e) => {
                    e.stopPropagation();
                    setUploadedFile(null);
                  }}
                  className="remove-file-button"
                >
                  Remove
                </button>
              </div>
            ) : (
              'Drag & drop image here or click to browse'
            )}
            <input
              type="file"
              accept="image/*"
              id="fileInput"
              style={{ display: 'none' }}
              onChange={(e) => handleFileChange(e.target.files[0])}
            />
          </div>

          <input 
            name="image" 
            value={form.image} 
            onChange={handleChange} 
            placeholder="Or paste image URL here (optional)" 
          />

          <button type="submit" className="add-button" disabled={loading}>
            {loading ? 'Processing...' : (editingId ? 'Update Event' : 'Add Event')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminEvents;