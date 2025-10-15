import React, { useState } from 'react';

interface Contact {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  company?: string | null;
  created_at: string;
}

interface ContactListProps {
  contacts: Contact[];
  onAnalyzeMessage: (contactId: number, message: string) => void;
  onUpdateContact: (id: number, contact: Partial<Contact>) => void;
  onDeleteContact: (id: number) => void;
}

function ContactList({ contacts, onAnalyzeMessage, onUpdateContact, onDeleteContact }: ContactListProps) {
  const [message, setMessage] = useState('');
  const [selectedContactId, setSelectedContactId] = useState('');
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const handleAnalyze = () => {
    if (!selectedContactId || !message.trim()) {
      alert('Please select a contact and enter a message');
      return;
    }
    
    onAnalyzeMessage(parseInt(selectedContactId), message);
    setMessage('');
    setSelectedContactId('');
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact({...contact});
  };

  const handleSaveEdit = () => {
    if (!editingContact.name || !editingContact.email) {
      alert('Name and email are required');
      return;
    }
    onUpdateContact(editingContact.id, editingContact);
    setEditingContact(null);
  };

  const handleCancelEdit = () => {
    setEditingContact(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="contact-list">
      <h2>Contacts ({contacts.length})</h2>
      
      {/* Sentiment Analysis Section */}
      <div className="sentiment-analysis">
        <h3>Analyze Customer Message</h3>
        <div className="analysis-form">
          <select 
            value={selectedContactId}
            onChange={(e) => setSelectedContactId(e.target.value)}
            className="form-select"
          >
            <option value="">Select a contact...</option>
            {contacts.map(contact => (
              <option key={contact.id} value={contact.id}>
                {contact.name} - {contact.email}
              </option>
            ))}
          </select>
          
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type a customer message to analyze sentiment..."
            rows={3}
            className="form-textarea"
          />
          
          <button 
            onClick={handleAnalyze}
            className="btn btn-analyze"
            disabled={!selectedContactId || !message.trim()}
          >
            Analyze Emotion
          </button>
        </div>
      </div>

      {/* Contacts List */}
      <div className="contacts-grid">
        {contacts.length === 0 ? (
          <div className="no-contacts">
            <p>No contacts found. Add your first contact to get started!</p>
          </div>
        ) : (
          contacts.map(contact => (
            <div key={contact.id} className="contact-card">
              {editingContact && editingContact.id === contact.id ? (
                <div className="contact-edit-form">
                  <input
                    type="text"
                    value={editingContact.name}
                    onChange={(e) => setEditingContact({...editingContact, name: e.target.value})}
                    placeholder="Name"
                    className="form-input"
                  />
                  <input
                    type="email"
                    value={editingContact.email}
                    onChange={(e) => setEditingContact({...editingContact, email: e.target.value})}
                    placeholder="Email"
                    className="form-input"
                  />
                  <input
                    type="tel"
                    value={editingContact.phone || ''}
                    onChange={(e) => setEditingContact({...editingContact, phone: e.target.value})}
                    placeholder="Phone"
                    className="form-input"
                  />
                  <input
                    type="text"
                    value={editingContact.company || ''}
                    onChange={(e) => setEditingContact({...editingContact, company: e.target.value})}
                    placeholder="Company"
                    className="form-input"
                  />
                  <div className="edit-actions">
                    <button onClick={handleSaveEdit} className="btn btn-success">Save</button>
                    <button onClick={handleCancelEdit} className="btn btn-secondary">Cancel</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="contact-info">
                    <h4>{contact.name}</h4>
                    <p className="contact-email">{contact.email}</p>
                    {contact.phone && <p className="contact-phone">{contact.phone}</p>}
                    {contact.company && <p className="contact-company">{contact.company}</p>}
                    <p className="contact-date">Added: {formatDate(contact.created_at)}</p>
                  </div>
                  <div className="contact-actions">
                    <button 
                      onClick={() => handleEdit(contact)}
                      className="btn btn-small btn-secondary"
                    >
                      Edit
                    </button>
                    <button 
                      onClick={() => onDeleteContact(contact.id)}
                      className="btn btn-small btn-danger"
                    >
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default ContactList;