import React, { useState } from 'react';

interface ContactFormData {
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
}

interface ContactFormProps {
  onAddContact: (contact: ContactFormData) => void;
  onCancel: () => void;
}

function ContactForm({ onAddContact, onCancel }: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [company, setCompany] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!name.trim() || !email.trim()) {
      alert('Name and email are required');
      return;
    }

    setLoading(true);
    
    try {
      await onAddContact({ 
        name: name.trim(), 
        email: email.trim(), 
        phone: phone.trim() || null,
        company: company.trim() || null
      });
      
      // Reset form
      setName('');
      setEmail('');
      setPhone('');
      setCompany('');
    } catch (error) {
      console.error('Error adding contact:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-form-container">
      <h3>Add New Contact</h3>
      <form onSubmit={handleSubmit} className="contact-form">
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="name">Name *</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter full name"
              required
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter email address"
              required
              className="form-input"
            />
          </div>
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="phone">Phone</label>
            <input
              id="phone"
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="Enter phone number"
              className="form-input"
            />
          </div>
          <div className="form-group">
            <label htmlFor="company">Company</label>
            <input
              id="company"
              type="text"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              placeholder="Enter company name"
              className="form-input"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            disabled={loading}
            className="btn btn-primary"
          >
            {loading ? 'Adding...' : 'Add Contact'}
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="btn btn-secondary"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export default ContactForm;