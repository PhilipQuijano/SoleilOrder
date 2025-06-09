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
    const { data, error } = await supabase.from('events').select('*').order('date', { ascending: true });
    if (!error) {
      setEvents(data);
    }
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.date || !form.description) return;

    let imageUrl = form.image;

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
        alert('Image upload failed.');
        return;
      }

      const { data: publicUrlData } = supabase.storage
        .from('event-images')
        .getPublicUrl(filePath);

      imageUrl = publicUrlData.publicUrl;
    }

    const payload = { ...form, image: imageUrl };

    if (editingId) {
      await supabase.from('events').update(payload).eq('id', editingId);
    } else {
      await supabase.from('events').insert(payload);
    }

    setForm({ title: '', date: '', description: '', image: '' });
    setUploadedFile(null);
    setEditingId(null);
    fetchEvents();
  };

  const handleEdit = (event) => {
    if (editingId === event.id) {
      setEditingId(null);
      setForm({ title: '', date: '', description: '', image: '' });
    } else {
      setEditingId(event.id);
      setForm(event);
    }
  };

  const handleDelete = async (id) => {
    await supabase.from('events').delete().eq('id', id);
    if (editingId === id) {
      setEditingId(null);
      setForm({ title: '', date: '', description: '', image: '' });
    }
    fetchEvents();
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
      </header>

      <div className="events-grid">
        {events.map((event) => (
          <div key={event.id} className="event-item">
            <div className="event-image-preview">
              <img src={event.image} alt={event.title} />
            </div>
            <div className="event-details">
              <h3>{event.title}</h3>
              <p className="event-date">{event.date}</p>
              <p className="event-description">{event.description}</p>
            </div>

            <div className="event-actions">
              <button onClick={() => handleEdit(event)} className="edit-button">Edit</button>
              <button onClick={() => handleDelete(event.id)} className="delete-button">Delete</button>
            </div>

            {editingId === event.id && (
              <form onSubmit={handleSave} className="edit-form">
                <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
                <input name="date" value={form.date} onChange={handleChange} placeholder="Date (e.g., July 15, 2025)" required />
                <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
                <input name="image" value={form.image} onChange={handleChange} placeholder="Image URL" />
                <button type="submit" className="save-button">Save</button>
              </form>
            )}
          </div>
        ))}
      </div>

      <div className="add-new-section">
        <h2>{editingId ? 'Edit Event' : 'Add New Event'}</h2>
        <form onSubmit={handleSave} className="add-form">
          <input name="title" value={form.title} onChange={handleChange} placeholder="Title" required />
          <input name="date" value={form.date} onChange={handleChange} placeholder="Date (e.g., July 15, 2025)" required />
          <textarea name="description" value={form.description} onChange={handleChange} placeholder="Description" required />
          
          <div 
            className="drop-zone"
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file) setUploadedFile(file);
            }}
            onClick={() => document.getElementById('fileInput').click()}
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
            {editingId ? 'Update Event' : 'Add Event'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AdminEvents;