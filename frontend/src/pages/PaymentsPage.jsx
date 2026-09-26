import React, { useState, useEffect } from 'react';
import { CreditCard, Share2, Plus, Banknote, FileCheck, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '../services/api';
import PaymentModal from '../components/PaymentModal';
import ShareReportModal from '../components/ShareReportModal';

export default function PaymentsPage({ user }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [students, setStudents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modals
  const [selectedStudentForPayment, setSelectedStudentForPayment] = useState(null);
  const [selectedPaymentData, setSelectedPaymentData] = useState(null);
  const [showShareReportModal, setShowShareReportModal] = useState(false);

  useEffect(() => {
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (month) {
      loadPaymentsAndStudents();
    }
  }, [month, selectedGroupId]);

  const fetchGroups = async () => {
    try {
      const data = await api.getGroups(user?.role === 'teacher' ? user.id : null);
      setGroups(data);
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const loadPaymentsAndStudents = async () => {
    setLoading(true);
    try {
      const isTeacher = user?.role === 'teacher';
      const [stList, payList] = await Promise.all([
        api.getStudents(selectedGroupId || null, 0, isTeacher ? user.id : null),
        api.getPayments(month, selectedGroupId || null, isTeacher ? user.id : null)
      ]);
      setStudents(stList);
      setPayments(payList);
    } catch (err) {
      console.error('Failed to load payments:', err);
    } finally {
      setLoading(false);
    }
  };

  // Aggregation stats
  const totalPaidCount = payments.filter(p => p.paid === 1).length;
  const cashSum = payments.filter(p => p.paid === 1 && (p.method === 'naqd' || p.method === 'cash')).reduce((a, b) => a + (b.amount || 0), 0);
  const cardSum = payments.filter(p => p.paid === 1 && (p.method === 'karta' || p.method === 'card')).reduce((a, b) => a + (b.amount || 0), 0);
  const grandTotal = cashSum + cardSum;

  const cashPercent = grandTotal > 0 ? ((cashSum / grandTotal) * 100).toFixed(1) : 0;
  const cardPercent = grandTotal > 0 ? ((cardSum / grandTotal) * 100).toFixed(1) : 0;

  const handleOpenPaymentModal = (st) => {
    const existing = payments.find(p => p.student_id === st.id);
    setSelectedStudentForPayment(st);
    setSelectedPaymentData(existing || null);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>💳 To'lovlar va Moliya Boshqaruvi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Naqd va Karta to'lovlari, Chek (screenshot) fayllari va Oylik hisobotni ulashish
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowShareReportModal(true)}>
          <Share2 size={18} /> Oylik Hisobotni Ulashish (Share)
        </button>
      </div>

      {/* Monthly Summary Statistics Cards */}
      <div className="grid-3">
        <div className="card" style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)' }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700 }}>SHU OY YIG'ILGAN PUL</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
            {grandTotal.toLocaleString()} so'm
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            To'laganlar: {totalPaidCount} ta o'quvchi
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>💵 NAQD TO'LOVLAR</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>
            {cashSum.toLocaleString()} so'm
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, marginTop: '4px' }}>
            Jami tushumning {cashPercent}% qismi
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 700 }}>💳 KARTA TO'LOVLARI</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, marginTop: '4px' }}>
            {cardSum.toLocaleString()} so'm
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--primary-color)', fontWeight: 700, marginTop: '4px' }}>
            Jami tushumning {cardPercent}% qismi
          </div>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: '200px' }}>
          <label className="form-label">Oy (Month):</label>
          <input
            type="month"
            className="form-control"
            value={month}
            onChange={e => setMonth(e.target.value)}
          />
        </div>

        <div style={{ flex: 1, minWidth: '220px' }}>
          <label className="form-label">Guruh bo'yicha filter:</label>
          <select
            className="form-control"
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
          >
            <option value="">-- Barcha guruhlar --</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>
            ))}
          </select>
        </div>
      </div>

      {/* Payments Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>O'quvchi F.I.O.</th>
                <th>Ota-onasi</th>
                <th>Holati</th>
                <th>Usuli</th>
                <th>Summa</th>
                <th>Chek / Screenshot</th>
                <th>Sana & Izoh</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, i) => {
                const pay = payments.find(p => p.student_id === st.id);
                const isPaid = pay?.paid === 1;

                return (
                  <tr key={st.id}>
                    <td>{i + 1}</td>
                    <td><strong>{st.name}</strong></td>
                    <td><span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>📞 {st.parent_phone}</span></td>
                    <td>
                      {isPaid ? (
                        <span className="badge badge-success">✅ To'lagan</span>
                      ) : (
                        <span className="badge badge-danger">❌ Qarzdor</span>
                      )}
                    </td>
                    <td>
                      {pay ? (
                        <span className="badge badge-info">{pay.method?.toUpperCase()}</span>
                      ) : (
                        '---'
                      )}
                    </td>
                    <td>
                      <strong style={{ color: isPaid ? 'var(--success)' : 'var(--danger)' }}>
                        {pay?.amount ? `${pay.amount.toLocaleString()} so'm` : '---'}
                      </strong>
                    </td>
                    <td>
                      {pay?.receipt_file ? (
                        <a
                          href={pay.receipt_file}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.75rem', color: 'var(--primary-color)' }}
                        >
                          <FileCheck size={14} /> Chekni Ko'rish
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>Mavjud emas</span>
                      )}
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {pay?.date || '---'} {pay?.notes && `(${pay.notes})`}
                      </span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-primary btn-sm"
                        onClick={() => handleOpenPaymentModal(st)}
                      >
                        <CreditCard size={14} /> To'lov Kiritish
                      </button>
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    O'quvchilar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Payment Entry Modal */}
      {selectedStudentForPayment && (
        <PaymentModal
          isOpen={true}
          student={selectedStudentForPayment}
          group={groups.find(g => selectedStudentForPayment.group_ids?.includes(g.id))}
          payment={selectedPaymentData}
          month={month}
          teacherId={user?.id}
          onSave={loadPaymentsAndStudents}
          onClose={() => setSelectedStudentForPayment(null)}
        />
      )}

      {/* Share Report Modal */}
      <ShareReportModal
        isOpen={showShareReportModal}
        month={month}
        groupId={selectedGroupId}
        teacherId={user?.role === 'teacher' ? user.id : null}
        onClose={() => setShowShareReportModal(false)}
      />
    </div>
  );
}
