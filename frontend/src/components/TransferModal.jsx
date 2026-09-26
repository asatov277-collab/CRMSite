import React, { useState, useEffect } from 'react';
import { X, ArrowRightLeft } from 'lucide-react';
import { api } from '../services/api';

export default function TransferModal({ isOpen, student, onTransferred, onClose }) {
  const [targetGroupId, setTargetGroupId] = useState('');
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      api.getGroups().then(setAllGroups).catch(console.error);
    }
  }, [isOpen]);

  if (!isOpen || !student) return null;

  const handleTransfer = async (e) => {
    e.preventDefault();
    if (!targetGroupId) {
      setError('Iltimos, o\'tkaziladigan guruhni tanlang!');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await api.transferStudent(student.id, {
        from_group_id: student.groupIds?.[0] || '',
        to_group_id: targetGroupId
      });
      onTransferred();
      onClose();
    } catch (err) {
      setError(err.message || 'O\'tkazishda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ArrowRightLeft size={20} color="var(--primary-color)" /> O'quvchini Boshqa Guruhga O'tkazish
          </h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {error && <div className="badge badge-danger" style={{ marginBottom: '14px', width: '100%', padding: '10px' }}>{error}</div>}

        <form onSubmit={handleTransfer}>
          <div style={{ marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{student.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Tel: {student.phone} | Ota-onasi: {student.parent_phone}</div>
          </div>

          <div className="form-group">
            <label className="form-label">Yangi Guruhni Tanlang:</label>
            <select
              className="form-control"
              value={targetGroupId}
              onChange={e => setTargetGroupId(e.target.value)}
              required
            >
              <option value="">-- Guruhni tanlang --</option>
              {allGroups.map(g => (
                <option key={g.id} value={g.id}>
                  {g.name} ({g.subject} - {g.teacher_name})
                </option>
              ))}
            </select>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--info)', background: 'rgba(59, 130, 246, 0.1)', padding: '10px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
            ℹ️ O'quvchi yangi guruhga o'tkazilganda eski davomat va to'lovlar tarixi saqlanadi hamda yangi o'qituvchi bilan avtomatik share qilinadi.
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'O\'tkazilmoqda...' : 'Guruhga O\'tkazish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
