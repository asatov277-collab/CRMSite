import React, { useState, useEffect } from 'react';
import { Database, Download, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '../services/api';

export default function BackupPage() {
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchBackups();
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const data = await api.getBackups();
      setBackups(data);
    } catch (err) {
      console.error('Failed to fetch backups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const res = await api.createBackup();
      alert(`✅ Zaxira nusxa (Backup) muvaffaqiyatli yaratildi!\nFayl: ${res.filename}`);
      fetchBackups();
    } catch (err) {
      alert("Backup yaratishda xatolik");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>💾 Zaxira Nusxa (Backup) Boshqaruvi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Avtomatik va qo'lda zaxira nusxalar shakllantirish, ma'lumotlarni saqlash
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleCreateBackup} disabled={creating}>
          <Database size={18} /> {creating ? 'Yaratilmoqda...' : 'Hozir Backup Yaratish'}
        </button>
      </div>

      <div className="card" style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid var(--success)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <ShieldCheck size={28} color="var(--success)" />
          <div>
            <h4 style={{ color: 'var(--success)', fontWeight: 800 }}>🛡️ Ma'lumotlar xavfsizligi ta'minlangan</h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Har kuni avtomatik zaxira nusxalar shakllantiriladi va SQLite bazasi to'liq eksport qilinadi.
            </p>
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Fayl Nomi</th>
                <th>Yaratilgan Vaqti</th>
                <th>Hajmi</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {backups.map((b, idx) => (
                <tr key={b.id || idx}>
                  <td>{idx + 1}</td>
                  <td><strong>{b.filename}</strong></td>
                  <td>{new Date(b.timestamp).toLocaleString()}</td>
                  <td>{(b.size_bytes / 1024).toFixed(1)} KB</td>
                  <td style={{ textAlign: 'right' }}>
                    <a
                      href={`/backups/${b.filename}`}
                      download
                      className="btn btn-secondary btn-sm"
                    >
                      <Download size={14} /> Yuklab Olish (JSON)
                    </a>
                  </td>
                </tr>
              ))}
              {backups.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Hali saqlangan backup fayllar yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
