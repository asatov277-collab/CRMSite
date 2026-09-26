import React, { useState, useEffect } from 'react';
import { BookOpen, Upload, Video, FileText, Share2, Download, Trash2, Eye } from 'lucide-react';
import { api } from '../services/api';

export default function MaterialsPage({ user }) {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Upload Form
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMaterials();
  }, [user]);

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const data = await api.getMaterials(user?.role === 'teacher' ? user.id : null);
      setMaterials(data);
    } catch (err) {
      console.error('Failed to fetch materials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Iltimos faylni tanlang!');
      return;
    }

    setUploading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('teacher_id', user.id);
      formData.append('title', title);
      formData.append('description', description);
      formData.append('file', file);

      await api.uploadMaterial(formData);
      setShowUploadModal(false);
      setTitle('');
      setDescription('');
      setFile(null);
      fetchMaterials();
    } catch (err) {
      setError(err.message || 'Fayl yuklashda xatolik');
    } finally {
      setUploading(false);
    }
  };

  const handleShareToChat = async (mat) => {
    try {
      const formData = new FormData();
      formData.append('sender_id', user.id);
      formData.append('sender_name', user.name);
      formData.append('text', `📚 **Darslik ulashildi**: ${mat.title}\n🔗 Fayl: ${mat.file_url}`);
      await api.sendChatMessage(formData);
      alert("✅ Darslik Chatga muvaffaqiyatli ulashildi!");
    } catch (err) {
      alert("Chatga ulashishda xatolik");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>📚 Darsliklar va Video Darslar</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            O'qituvchining shaxsiy ta'lim resurslari, PDF va video fayllari (Chatga ulashish bilan)
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowUploadModal(true)}>
          <Upload size={18} /> Yangi Darslik / Video Yuklash
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : (
        <div className="grid-3">
          {materials.map((m) => (
            <div key={m.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span className={`badge ${m.file_type === 'video' ? 'badge-danger' : m.file_type === 'pdf' ? 'badge-warning' : 'badge-info'}`}>
                    {m.file_type === 'video' ? '🎥 VIDEO' : m.file_type === 'pdf' ? '📄 PDF' : '📁 MANBAlAR'}
                  </span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{m.created_at}</span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '6px' }}>{m.title}</h3>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
                  {m.description || 'Tavsif berilmagan'}
                </p>
              </div>

              <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <a href={m.file_url} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm">
                  <Eye size={14} /> Ochish / Ko'rish
                </a>
                <button className="btn btn-primary btn-sm" onClick={() => handleShareToChat(m)}>
                  <Share2 size={14} /> Chatga Share
                </button>
              </div>
            </div>
          ))}
          {materials.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Hozircha saqlangan darsliklar yoki videolar yo'q
            </div>
          )}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="modal-overlay" onClick={() => setShowUploadModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">📚 Darslik yoki Video Yuklash</h3>
              <button className="close-btn" onClick={() => setShowUploadModal(false)}>✕</button>
            </div>

            {error && <div className="badge badge-danger" style={{ marginBottom: '14px', width: '100%' }}>{error}</div>}

            <form onSubmit={handleUpload}>
              <div className="form-group">
                <label className="form-label">Darslik / Video Sarlavhasi:</label>
                <input type="text" className="form-control" placeholder="Masalan: Present Perfect Tense Video Lesson" value={title} onChange={e => setTitle(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Tavsif (Description):</label>
                <textarea className="form-control" placeholder="Dars bo'yicha qisqacha ko'rsatma..." value={description} onChange={e => setDescription(e.target.value)} />
              </div>

              <div className="form-group" style={{ background: 'rgba(79, 70, 229, 0.08)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary-color)' }}>
                <label className="form-label" style={{ color: 'var(--primary-color)' }}>
                  Faylni Tanlang (Video: 500MB, PDF: 50MB, Rasm: 20MB gacha):
                </label>
                <input type="file" className="form-control" style={{ background: 'transparent' }} onChange={e => setFile(e.target.files[0])} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowUploadModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary" disabled={uploading}>
                  {uploading ? 'Yuklanmoqda...' : 'Yuklash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
