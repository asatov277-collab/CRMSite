import React, { useState, useEffect } from 'react';
import { Search, X, User, Users, Phone, GraduationCap } from 'lucide-react';
import { api } from '../services/api';

export default function GlobalSearchModal({ isOpen, onClose, onSelectResult }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.search(query);
        setResults(res);
      } catch (err) {
        console.error('Search error:', err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '650px' }} onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1 }}>
            <Search size={20} color="var(--primary-color)" />
            <input
              type="text"
              className="form-control"
              placeholder="O'quvchi ismi, guruh, telefon yoki o'qituvchini qidiring..."
              value={query}
              onChange={e => setQuery(e.target.value)}
              autoFocus
              style={{ border: 'none', background: 'transparent', fontSize: '1.1rem' }}
            />
          </div>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        {loading && <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>Qidirilmoqda...</div>}

        {results && (
          <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Students */}
            {results.students.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  👨‍🎓 O'quvchilar ({results.students.length})
                </h4>
                {results.students.map(s => (
                  <div 
                    key={s.id} 
                    onClick={() => { onSelectResult('students', s); onClose(); }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{s.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tel: {s.phone} | Ota-onasi: {s.parent_phone}</div>
                    </div>
                    <span className="badge badge-info">O'quvchi</span>
                  </div>
                ))}
              </div>
            )}

            {/* Groups */}
            {results.groups.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  👥 Guruhlar ({results.groups.length})
                </h4>
                {results.groups.map(g => (
                  <div 
                    key={g.id}
                    onClick={() => { onSelectResult('groups', g); onClose(); }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{g.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fan: {g.subject} | Vaqti: {g.schedule}</div>
                    </div>
                    <span className="badge badge-success">Guruh</span>
                  </div>
                ))}
              </div>
            )}

            {/* Teachers */}
            {results.teachers.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '8px', textTransform: 'uppercase' }}>
                  👨‍🏫 O'qituvchilar ({results.teachers.length})
                </h4>
                {results.teachers.map(t => (
                  <div 
                    key={t.id}
                    onClick={() => { onSelectResult('teachers', t); onClose(); }}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(255, 255, 255, 0.03)',
                      marginBottom: '6px',
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700 }}>{t.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fan: {t.subject} | Tel: {t.phone}</div>
                    </div>
                    <span className="badge badge-warning">O'qituvchi</span>
                  </div>
                ))}
              </div>
            )}

            {results.students.length === 0 && results.groups.length === 0 && results.teachers.length === 0 && (
              <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)' }}>
                Natija topilmadi
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
