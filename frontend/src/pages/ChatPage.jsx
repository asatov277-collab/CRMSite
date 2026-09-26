import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, Image as ImageIcon, Trash2, Building2 } from 'lucide-react';
import { api } from '../services/api';

export default function ChatPage({ user, activeBranch }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [imageFile, setImageFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState(null);
  const messagesEndRef = useRef(null);

  const isAdmin = user?.role === 'admin';
  const branchId = activeBranch ? activeBranch.id : null;

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 3000);
    return () => clearInterval(interval);
  }, [branchId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchMessages = async () => {
    try {
      const data = await api.getChatMessages(branchId);
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
      formData.append('branch_id', branchId || 'b_main');
      if (imageFile) {
        formData.append('image_file', imageFile);
      }

      await api.sendChatMessage(formData);
      setText('');
      setImageFile(null);
      fetchMessages();
    } catch (err) {
      alert(err.message || 'Xabar yuborishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (msgId, senderId) => {
    // Permission check
    if (!isAdmin && senderId !== user.id) {
      alert("Siz faqat o'zingiz yozgan xabarni o'chira olasiz!");
      return;
    }

    if (!window.confirm("Haqiqatan ham ushbu xabarni o'chirmoqchimisiz?")) {
      return;
    }

    setDeletingId(msgId);
    try {
      await api.deleteChatMessage(msgId, user.id, user.role);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (err) {
      alert(err.message || 'Xabarni o\'chirishda xatolik yuz berdi');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            💬 O'qituvchilar Chati {activeBranch && <span style={{ fontSize: '1rem', color: 'var(--primary-color)', fontWeight: 600 }}>({activeBranch.name})</span>}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            {isAdmin 
              ? "👑 Administrator barcha xabarlarni o'chirish huquqiga ega." 
              : "O'qituvchilar jonli muloqoti. Faqat o'zingiz yozgan xabarlarni o'chira olasiz."}
          </p>
        </div>

        {activeBranch && (
          <div className="badge badge-info" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Building2 size={14} /> Filial: {activeBranch.name}
          </div>
        )}
      </div>

      {/* Chat Container Card */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflow: 'hidden' }}>
        {/* Messages Body */}
        <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {messages.length === 0 ? (
            <div style={{ textAlign: 'center', color: 'var(--text-muted)', margin: 'auto' }}>
              Ushbu chatda hali hech qanday xabar yo'q. Birinchi bo'lib yozing!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user.id;
              // Can delete if user is admin OR message is authored by current teacher
              const canDelete = isAdmin || isMe;

              return (
                <div
                  key={msg.id}
                  style={{
                    alignSelf: isMe ? 'flex-end' : 'flex-start',
                    maxWidth: '72%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isMe ? 'flex-end' : 'flex-start',
                    position: 'relative'
                  }}
                >
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span>{msg.sender_name}</span>
                    <span>•</span>
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexDirection: isMe ? 'row-reverse' : 'row' }}>
                    <div style={{
                      padding: '12px 16px',
                      borderRadius: isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: isMe ? 'linear-gradient(135deg, var(--primary-color), #6366F1)' : 'var(--bg-card-hover)',
                      color: '#FFF',
                      border: isMe ? 'none' : '1px solid var(--border-color)',
                      boxShadow: isMe ? '0 4px 12px var(--primary-glow)' : 'none',
                      wordBreak: 'break-word'
                    }}>
                      {msg.text && <p style={{ fontSize: '0.94rem', margin: 0, whiteSpace: 'pre-wrap' }}>{msg.text}</p>}
                      {msg.image_file && (
                        <a href={msg.image_file} target="_blank" rel="noopener noreferrer">
                          <img
                            src={msg.image_file}
                            alt="Biriktirilgan rasm"
                            style={{ maxWidth: '100%', maxHeight: '250px', borderRadius: 'var(--radius-md)', marginTop: msg.text ? '8px' : 0, display: 'block' }}
                          />
                        </a>
                      )}
                    </div>

                    {/* Delete button (Visible for admin on all messages, or for teachers on their own messages) */}
                    {canDelete && (
                      <button
                        onClick={() => handleDeleteMessage(msg.id, msg.sender_id)}
                        disabled={deletingId === msg.id}
                        title={isAdmin && !isMe ? "Admin sifatida bu xabarni o'chirish" : "O'z xabaringizni o'chirish"}
                        style={{
                          background: 'rgba(239, 68, 68, 0.1)',
                          border: 'none',
                          color: 'var(--danger)',
                          borderRadius: '8px',
                          padding: '6px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          opacity: 0.75,
                          transition: 'opacity 0.2s ease'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = 1}
                        onMouseLeave={e => e.currentTarget.style.opacity = 0.75}
                      >
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
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
            <span className="badge badge-info" style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              📎 {imageFile.name.slice(0, 15)}...
              <button
                type="button"
                onClick={() => setImageFile(null)}
                style={{ background: 'transparent', border: 'none', color: '#FFF', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </span>
          )}

          <input
            type="text"
            className="form-control"
            placeholder={activeBranch ? `[${activeBranch.name}] xabaringizni yozing...` : "Xabaringizni yozing..."}
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
