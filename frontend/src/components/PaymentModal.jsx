import React, { useState, useEffect } from 'react';
import { X, Upload, CreditCard, Banknote, FileCheck } from 'lucide-react';
import { api } from '../services/api';

export default function PaymentModal({ isOpen, payment, student, group, month, teacherId, onSave, onClose }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('naqd');
  const [paid, setPaid] = useState(1);
  const [notes, setNotes] = useState('');
  const [receiptFile, setReceiptFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount || group?.price || '');
      setMethod(payment.method || 'naqd');
      setPaid(payment.paid !== undefined ? payment.paid : 1);
      setNotes(payment.notes || '');
    } else {
      setAmount(group?.price || 450000);
      setMethod('naqd');
      setPaid(1);
      setNotes('');
    }
    setReceiptFile(null);
    setError('');
  }, [payment, group, isOpen]);

  if (!isOpen || !student) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      formData.append('student_id', student.id);
      formData.append('group_id', group?.id || '');
      formData.append('teacher_id', teacherId);
      formData.append('month', month);
      formData.append('amount', amount);
      formData.append('method', method);
      formData.append('paid', paid);
      formData.append('notes', notes || '');

      if (receiptFile) {
        formData.append('receipt_file', receiptFile);
      }

      await api.recordPayment(formData);
      onSave();
      onClose();
    } catch (err) {
      setError(err.message || 'To\'lov saqlashda xatolik');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={20} color="var(--primary-color)" /> To'lov Kiritish / Tahrirlash
          </h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {error && <div className="badge badge-danger" style={{ marginBottom: '14px', width: '100%', padding: '10px' }}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px', background: 'rgba(0,0,0,0.3)', padding: '12px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{student.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Guruh: {group?.name || '---'} | Oy: {month}
            </div>
          </div>

          {/* Status Toggle */}
          <div className="form-group">
            <label className="form-label">To'lov Holati:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${paid === 1 ? 'btn-success' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setPaid(1)}
              >
                ✅ To'langan
              </button>
              <button
                type="button"
                className={`btn ${paid === 0 ? 'btn-danger' : 'btn-secondary'}`}
                style={{ flex: 1 }}
                onClick={() => setPaid(0)}
              >
                ❌ To'lanmagan (Qarzdor)
              </button>
            </div>
          </div>

          {/* Amount */}
          <div className="form-group">
            <label className="form-label">To'lov Summasi (so'm):</label>
            <input
              type="number"
              className="form-control"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
            />
          </div>

          {/* Payment Method */}
          <div className="form-group">
            <label className="form-label">To'lov Usuli:</label>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                className={`btn ${method === 'naqd' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, display: 'flex', gap: '8px' }}
                onClick={() => setMethod('naqd')}
              >
                <Banknote size={18} /> Naqd
              </button>
              <button
                type="button"
                className={`btn ${method === 'karta' ? 'btn-primary' : 'btn-secondary'}`}
                style={{ flex: 1, display: 'flex', gap: '8px' }}
                onClick={() => setMethod('karta')}
              >
                <CreditCard size={18} /> Karta
              </button>
            </div>
          </div>

          {/* Receipt Upload if Card */}
          {method === 'karta' && (
            <div className="form-group" style={{ background: 'rgba(79, 70, 229, 0.08)', padding: '14px', borderRadius: 'var(--radius-md)', border: '1px dashed var(--primary-color)' }}>
              <label className="form-label" style={{ color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Upload size={16} /> Chek / Screenshot Fayli (PNG, JPG, PDF max 20MB/50MB):
              </label>
              <input
                type="file"
                accept="image/*,application/pdf"
                className="form-control"
                style={{ background: 'transparent' }}
                onChange={e => setReceiptFile(e.target.files[0])}
              />
              {payment?.receipt_file && !receiptFile && (
                <div style={{ fontSize: '0.8rem', color: 'var(--success)', marginTop: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <FileCheck size={14} /> Yuklangan chek mavjud: <a href={payment.receipt_file} target="_blank" rel="noreferrer" style={{ color: 'var(--primary-color)' }}>Ko'rish</a>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div className="form-group">
            <label className="form-label">Izoh / Qo'shimcha ma'lumot:</label>
            <input
              type="text"
              className="form-control"
              placeholder="Masalan: Click orqali o'tkazildi"
              value={notes}
              onChange={e => setNotes(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>Bekor qilish</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saqlanmoqda...' : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
