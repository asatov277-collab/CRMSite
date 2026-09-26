import React, { useState, useEffect } from 'react';
import { Archive, RefreshCw, Undo2 } from 'lucide-react';
import { api } from '../services/api';

export default function ArchivePage() {
  const [archivedStudents, setArchivedStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArchived();
  }, []);

  const fetchArchived = async () => {
    setLoading(true);
    try {
      const data = await api.getStudents(null, 1); // archived = 1
      setArchivedStudents(data);
    } catch (err) {
      console.error('Failed to fetch archived students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnarchive = async (studentId) => {
    try {
      await api.archiveStudent(studentId, false);
      alert("✅ O'quvchi Arxivdan qaytarildi!");
      fetchArchived();
    } catch (err) {
      alert("Qaytarishda xatolik");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>📁 Arxiv (Bitirgan va Ketgan O'quvchilar)</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          O'chirilmagan, lekin arxivga o'tkazilgan o'quvchilar va ularning tarixiy to'lov hamda davomat ma'lumotlari
        </p>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : (
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>O'quvchi F.I.O.</th>
                <th>Telefon</th>
                <th>Ota-onasi</th>
                <th>Ro'yxatga Olingan Date</th>
                <th>Holati</th>
                <th style={{ textAlign: 'right' }}>Amal</th>
              </tr>
            </thead>
            <tbody>
              {archivedStudents.map((st, i) => (
                <tr key={st.id}>
                  <td>{i + 1}</td>
                  <td><strong>{st.name}</strong></td>
                  <td>{st.phone}</td>
                  <td>👨‍👩‍👧 {st.parent_phone}</td>
                  <td>{st.created_at}</td>
                  <td><span className="badge badge-warning">📁 Arxivlangan</span></td>
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUnarchive(st.id)}
                    >
                      <Undo2 size={14} /> Arxivdan Qaytarish
                    </button>
                  </td>
                </tr>
              ))}
              {archivedStudents.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Arxivda o'quvchilar yo'q
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
