import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';

export default function AttendanceModal({ isOpen, student, status, onConfirm, onClose }) {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !student) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('Iltimos, sababini yoki izohni yozing!');
      return;
    }
    onConfirm(student.id, status, reason);
    setReason('');
    setError('');
    onClose();
  };

  const isAbsent = status === 'kelmagan';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ color: isAbsent ? 'var(--danger)' : 'var(--warning)' }}>
            {isAbsent ? '❌ Kelmaganlik izohi' : '⚠️ Kechikish izohi'}
          </h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '4px' }}>{student.name}</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Holati: <strong style={{ color: isAbsent ? 'var(--danger)' : 'var(--warning)' }}>{status.toUpperCase()}</strong>
            </p>
          </div>

          <div className="form-group">
            <label className="form-label">Sababi / Izoh (Majburiy):</label>
            <textarea
              className="form-control"
              placeholder={isAbsent ? "Masalan: Betobligi sababli kelmadi..." : "Masalan: Tirbandlikda 15 minut kechikdi..."}
              value={reason}
              onChange={e => { setReason(e.target.value); setError(''); }}
              autoFocus
              rows={3}
            />
            {error && (
              <div style={{ color: 'var(--danger)', fontSize: '0.8rem', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AlertCircle size={14} /> {error}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className={isAbsent ? "btn btn-danger" : "btn btn-warning"}>
              Saqlash
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
