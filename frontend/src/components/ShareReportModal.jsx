import React, { useState, useEffect } from 'react';
import { X, Share2, Copy, Printer, Check, Download } from 'lucide-react';
import { api } from '../services/api';

export default function ShareReportModal({ isOpen, month, groupId, teacherId, onClose }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (isOpen && month) {
      fetchReport();
    }
  }, [isOpen, month, groupId, teacherId]);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const data = await api.getPaymentShareReport(month, groupId, teacherId);
      setReport(data);
    } catch (err) {
      console.error('Failed to fetch payment share report:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const generateFormattedText = () => {
    if (!report) return '';
    let text = `📊 **${report.center_name} - Oylik To'lovlar Hisoboti**\n`;
    text += `📅 **Oy**: ${report.month}\n\n`;
    text += `👥 **Jami o'quvchilar**: ${report.total_students} ta\n`;
    text += `✅ **To'laganlar**: ${report.paid_count} ta\n`;
    text += `❌ **Qarzdorlar**: ${report.unpaid_count} ta\n\n`;
    text += `💰 **Jami tushgan pul**: ${report.total_collected.toLocaleString()} ${report.currency}\n`;
    text += `💵 **Naqd**: ${report.cash_amount.toLocaleString()} ${report.currency} (${report.cash_percentage}%)\n`;
    text += `💳 **Karta**: ${report.card_amount.toLocaleString()} ${report.currency} (${report.card_percentage}%)\n\n`;
    text += `📋 **O'quvchilar ro'yxati va to'lov holati**:\n`;

    report.records.forEach((r, idx) => {
      const statusIcon = r.paid === 1 ? '✅' : '❌';
      const statusText = r.paid === 1 ? `To'langan (${r.method.toUpperCase()})` : 'Qarzdor';
      text += `${idx + 1}. ${r.student_name} (${r.group_name}) - ${r.amount.toLocaleString()} ${report.currency} -> ${statusIcon} ${statusText}\n`;
    });

    return text;
  };

  const handleCopyText = () => {
    const txt = generateFormattedText();
    navigator.clipboard.writeText(txt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '700px' }}>
        <div className="modal-header">
          <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Share2 size={20} color="var(--primary-color)" /> Oylik To'lovlar Hisoboti (Share)
          </h3>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>Hisobot shakllantirilmoqda...</div>
        ) : report ? (
          <div>
            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
              <button className="btn btn-primary" onClick={handleCopyText} style={{ flex: 1 }}>
                {copied ? <Check size={16} /> : <Copy size={16} />} {copied ? 'Nusxalandi!' : 'Telegram uchun nusxalash'}
              </button>
              <button className="btn btn-secondary" onClick={handlePrint}>
                <Printer size={16} /> Chop etish / PDF
              </button>
            </div>

            {/* Visual Printable Report Card */}
            <div id="printable-report" style={{
              background: '#0F172A',
              border: '1px solid var(--border-color)',
              borderRadius: 'var(--radius-lg)',
              padding: '20px',
              color: '#F8FAFC'
            }}>
              <div style={{ textAlign: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '12px' }}>
                <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary-color)' }}>{report.center_name}</h2>
                <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Oylik to'lov va davomat hisoboti • Oy: <strong>{report.month}</strong></div>
              </div>

              {/* Stat Summary Boxes */}
              <div className="grid-3" style={{ marginBottom: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>JAMI O'QUVCHILAR</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800 }}>{report.total_students} ta</div>
                </div>
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--success)' }}>TO'LAGANLAR</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)' }}>{report.paid_count} ta</div>
                </div>
                <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', padding: '12px', borderRadius: 'var(--radius-md)', textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--danger)' }}>QARZDORLAR</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger)' }}>{report.unpaid_count} ta</div>
                </div>
              </div>

              {/* Revenue & Cash/Card Percentages */}
              <div style={{ background: 'rgba(0,0,0,0.4)', padding: '14px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontWeight: 700 }}>
                  <span>Jami yig'ilgan mablag':</span>
                  <span style={{ color: 'var(--success)', fontSize: '1.1rem' }}>{report.total_collected.toLocaleString()} {report.currency}</span>
                </div>
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.85rem' }}>
                  <div>💵 Naqd: <strong>{report.cash_amount.toLocaleString()} {report.currency}</strong> ({report.cash_percentage}%)</div>
                  <div>💳 Karta: <strong>{report.card_amount.toLocaleString()} {report.currency}</strong> ({report.card_percentage}%)</div>
                </div>
              </div>

              {/* Individual Table */}
              <h4 style={{ fontSize: '0.9rem', marginBottom: '8px', color: 'var(--text-muted)' }}>Tafsilotlar (Barcha o'quvchilar):</h4>
              <div style={{ maxHeight: '250px', overflowY: 'auto' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>O'quvchi</th>
                      <th>Guruh</th>
                      <th>Summa</th>
                      <th>Usuli</th>
                      <th>Holati</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.records.map((r, i) => (
                      <tr key={r.id || i}>
                        <td>{i + 1}</td>
                        <td><strong>{r.student_name}</strong></td>
                        <td>{r.group_name}</td>
                        <td>{r.amount.toLocaleString()} {report.currency}</td>
                        <td>{r.method ? r.method.toUpperCase() : 'NAQD'}</td>
                        <td>
                          {r.paid === 1 ? (
                            <span className="badge badge-success">✅ To'lagan</span>
                          ) : (
                            <span className="badge badge-danger">❌ Qarzdor</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
