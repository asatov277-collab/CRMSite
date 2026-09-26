import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Image as ImageIcon, Paperclip } from 'lucide-react';
import { api } from '../services/api';

export default function ChatPage({ user }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const data = await api.getChatMessages();
      setMessages(data);
    } catch (err) {
      console.error('Chat fetch error:', err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !imageFile) return;

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('sender_id', user.id);
      formData.append('sender_name', user.name);
      formData.append('text', text);
      if (imageFile) {
        formData.append('image_file', imageFile);
      }

      await api.sendChatMessage(formData);
      setText('');
      setImageFile(null);
      fetchMessages();
    } catch (err) {
      alert(err.message || 'Xabar yuborishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>💬 O'qituvchilar Chati</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          O'qituvchilar o'rtasida jonli muloqot va rasm ulashish
        </p>
      </div>

      {/* Chat Container Card */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Messages Body */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {messages.map((msg) => {
            const isMe = msg.sender_id === user.id;

            return (
              <div
                key={msg.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '70%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: isMe ? 'flex-end' : 'flex-start'
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  {msg.sender_name} • {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>

                <div style={{
                  padding: '12px 16px',
                  borderRadius: isMe ? '18px 18px 2px 18px' : '18px 18px 18px 2px',
                  background: isMe ? 'linear-gradient(135deg, var(--primary-color), #6366F1)' : 'var(--bg-card-hover)',
                  color: '#FFF',
                  border: isMe ? 'none' : '1px solid var(--border-color)',
                  boxShadow: isMe ? '0 4px 12px var(--primary-glow)' : 'none'
                }}>
                  {msg.text && <p style={{ fontSize: '0.95rem', margin: 0 }}>{msg.text}</p>}
                  {msg.image_file && (
                    <img
                      src={msg.image_file}
                      alt="Chat attachment"
                      style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: 'var(--radius-md)', marginTop: msg.text ? '8px' : 0 }}
                    />
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} style={{ padding: '16px 20px', borderTop: '1px solid var(--border-color)', background: 'rgba(0,0,0,0.3)', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <label style={{ cursor: 'pointer', color: 'var(--primary-color)', display: 'flex', alignItems: 'center' }} title="Rasm biriktirish">
            <ImageIcon size={22} />
            <input
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={e => setImageFile(e.target.files[0])}
            />
          </label>

          {imageFile && (
            <span className="badge badge-info" style={{ fontSize: '0.75rem' }}>
              📎 {imageFile.name.slice(0, 15)}...
            </span>
          )}

          <input
            type="text"
            className="form-control"
            placeholder="Xabaringizni yozing..."
            value={text}
            onChange={e => setText(e.target.value)}
            style={{ flex: 1 }}
          />

          <button type="submit" className="btn btn-primary" disabled={loading}>
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}
