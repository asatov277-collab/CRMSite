import React, { useState, useEffect } from 'react';
import { UserPlus, Archive, ArrowRightLeft, Phone, Search, Users } from 'lucide-react';
import { api } from '../services/api';
import TransferModal from '../components/TransferModal';

export default function StudentsPage({ user }) {
  const [students, setStudents] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedStudentForTransfer, setSelectedStudentForTransfer] = useState(null);

  // Form state
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998 90 ');
  const [parentPhone, setParentPhone] = useState('+998 93 ');
  const [selectedGroupIds, setSelectedGroupIds] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const isTeacher = user?.role === 'teacher';
      const [stList, grList] = await Promise.all([
        api.getStudents(null, 0, isTeacher ? user.id : null),
        api.getGroups(isTeacher ? user.id : null)
      ]);
      setStudents(stList);
      setGroups(grList);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStudent = async (e) => {
    e.preventDefault();
    setError('');
    if (selectedGroupIds.length === 0) {
      setError('Iltimos kamida 1 ta guruhni tanlang!');
      return;
    }

    try {
      await api.createStudent({
        name,
        phone,
        parent_phone: parentPhone,
        group_ids: selectedGroupIds
      });
      setShowAddModal(false);
      setName('');
      setPhone('+998 90 ');
      setParentPhone('+998 93 ');
      setSelectedGroupIds([]);
      loadData();
    } catch (err) {
      setError(err.message || 'O\'quvchi yaratishda xatolik');
    }
  };

  const handleArchive = async (studentId) => {
    if (!window.confirm("Rostdan ham usha o'quvchini Arxivga o'tkazmoqchimisiz? (Tarixi va to'lovlari saqlanib qoladi)")) return;
    try {
      await api.archiveStudent(studentId, true);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const filteredStudents = students.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.phone.includes(search) ||
    s.parent_phone.includes(search)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>👨‍🎓 O'quvchilar Boshqaruvi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            O'quvchilar ro'yxati, ota-ona telefonlari va guruhga biriktirish
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <UserPlus size={16} /> Yangi O'quvchi Kiritish
        </button>
      </div>

      {/* Filter bar */}
      <div className="card" style={{ padding: '14px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
        <Search size={18} color="var(--text-muted)" />
        <input
          type="text"
          className="form-control"
          placeholder="O'quvchi ismi yoki telefon raqami bo'yicha qidiruv..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ border: 'none', background: 'transparent' }}
        />
        <span className="badge badge-info">{filteredStudents.length} ta o'quvchi</span>
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
                <th>Telefon Raqami</th>
                <th>Ota-onasi Telefoni</th>
                <th>Biriktirilgan Guruhlar</th>
                <th>Ro'yxatga olingan</th>
                <th style={{ textAlign: 'right' }}>Amallar</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map((st, i) => {
                const studentGroupNames = groups
                  .filter(g => st.group_ids?.includes(g.id))
                  .map(g => g.name)
                  .join(', ');

                return (
                  <tr key={st.id}>
                    <td>{i + 1}</td>
                    <td><strong style={{ fontSize: '0.95rem' }}>{st.name}</strong></td>
                    <td>{st.phone}</td>
                    <td><span className="badge badge-warning" style={{ fontSize: '0.8rem' }}>👨‍👩‍👧 {st.parent_phone}</span></td>
                    <td>{studentGroupNames || 'Guruhsiz'}</td>
                    <td>{st.created_at}</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          title="Boshqa guruhga o'tkazish"
                          onClick={() => setSelectedStudentForTransfer(st)}
                        >
                          <ArrowRightLeft size={14} /> Guruhga o'tkazish
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          title="Arxivga o'tkazish"
                          onClick={() => handleArchive(st.id)}
                        >
                          <Archive size={14} /> Arxiv
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    O'quvchilar topilmadi
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">👨‍🎓 Yangi O'quvchi Kiritish</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {error && <div className="badge badge-danger" style={{ marginBottom: '14px', width: '100%' }}>{error}</div>}

            <form onSubmit={handleCreateStudent}>
              <div className="form-group">
                <label className="form-label">O'quvchi F.I.O. (Ismi Familiyasi):</label>
                <input type="text" className="form-control" placeholder="Hasan Karimov" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">O'quvchining O'z Telefon Raqami:</label>
                <input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label" style={{ color: 'var(--warning)' }}>
                  👨‍👩‍👧 Ota-onasining Telefon Raqami (Majburiy):
                </label>
                <input type="text" className="form-control" value={parentPhone} onChange={e => setParentPhone(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Guruhga biriktirish:</label>
                <div style={{ maxHeight: '140px', overflowY: 'auto', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                  {groups.map(g => (
                    <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={selectedGroupIds.includes(g.id)}
                        onChange={e => {
                          if (e.target.checked) setSelectedGroupIds([...selectedGroupIds, g.id]);
                          else setSelectedGroupIds(selectedGroupIds.filter(id => id !== g.id));
                        }}
                      />
                      <span>{g.name} ({g.subject})</span>
                    </label>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {selectedStudentForTransfer && (
        <TransferModal
          isOpen={true}
          student={selectedStudentForTransfer}
          groups={groups}
          onTransferred={loadData}
          onClose={() => setSelectedStudentForTransfer(null)}
        />
      )}
    </div>
  );
}
