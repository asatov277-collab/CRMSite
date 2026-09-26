import React, { useState, useEffect } from 'react';
import { UserPlus, Archive, ArrowRightLeft, Phone, Search, Users, GraduationCap, Building2, CheckCircle } from 'lucide-react';
import { api } from '../services/api';
import TransferModal from '../components/TransferModal';

export default function StudentsPage({ user, activeBranch }) {
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

  const branchId = activeBranch ? activeBranch.id : null;

  useEffect(() => {
    loadData();
  }, [user, branchId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const isTeacher = user?.role === 'teacher';
      const [stList, grList] = await Promise.all([
        api.getStudents(null, 0, isTeacher ? user.id : null, branchId),
        api.getGroups(isTeacher ? user.id : null, branchId)
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
        group_ids: selectedGroupIds,
        branch_id: branchId || 'b_main'
      });
      setShowAddModal(false);
      setName('');
      setPhone('+998 90 ');
      setParentPhone('+998 93 ');
      setSelectedGroupIds([]);
      loadData();
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleArchive = async (studentId) => {
    if (!window.confirm("O'quvchini arxivga o'tkazishni tasdiqlaysizmi? Uning barcha to'lov va davomat tarixi saqlanadi.")) {
      return;
    }
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

  // Grouped stats
  const totalStudentsCount = students.length;
  const enrolledStudentsCount = students.filter(s => s.group_ids && s.group_ids.length > 0).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            👨‍🎓 O'quvchilar Boshqaruvi {activeBranch && <span style={{ fontSize: '1rem', color: 'var(--primary-color)' }}>({activeBranch.name})</span>}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            O'quvchilar ro'yxati, aloqa ma'lumotlari va guruhga biriktirish
          </p>
        </div>

        <button className="btn btn-primary" onClick={() => setShowAddModal(true)} style={{ padding: '10px 20px' }}>
          <UserPlus size={18} /> Yangi O'quvchi Qo'shish
        </button>
      </div>

      {/* Prominent Student Count Stats Cards - User explicitly requested this */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
        gap: '16px'
      }}>
        <div className="card" style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.15), rgba(99, 102, 241, 0.05))',
          border: '1px solid var(--primary-color)',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
          boxShadow: '0 4px 15px var(--primary-glow)'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF'
          }}>
            <Users size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Jami O'quvchilar
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#FFF', lineHeight: 1.1, marginTop: '2px' }}>
              {totalStudentsCount} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>nafar</span>
            </div>
          </div>
        </div>

        <div className="card" style={{
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{
            width: '50px',
            height: '50px',
            borderRadius: '12px',
            background: 'rgba(16, 185, 129, 0.15)',
            color: 'var(--success)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <CheckCircle size={26} />
          </div>
          <div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Guruhlarga Biriktirilgan
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 900, color: 'var(--success)', lineHeight: 1.1, marginTop: '2px' }}>
              {enrolledStudentsCount} <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>nafar</span>
            </div>
          </div>
        </div>

        {activeBranch && (
          <div className="card" style={{
            padding: '18px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              borderRadius: '12px',
              background: 'rgba(59, 130, 246, 0.15)',
              color: 'var(--info)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Building2 size={26} />
            </div>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                Filial Nomi
              </div>
              <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#FFF', lineHeight: 1.2, marginTop: '2px' }}>
                {activeBranch.name}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filter and Search Bar */}
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
        <span className="badge badge-info" style={{ fontSize: '0.85rem' }}>
          {filteredStudents.length} ta o'quvchi topildi
        </span>
      </div>

      {/* Students Table */}
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
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    O'quvchilar topilmadi
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st, i) => {
                  const studentGroupNames = groups
                    .filter(g => st.group_ids && st.group_ids.includes(g.id))
                    .map(g => g.name);

                  return (
                    <tr key={st.id}>
                      <td style={{ color: 'var(--text-dim)', width: '40px' }}>{i + 1}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>{st.name}</td>
                      <td>
                        <a href={`tel:${st.phone}`} style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} color="var(--primary-color)" /> {st.phone}
                        </a>
                      </td>
                      <td>
                        <a href={`tel:${st.parent_phone}`} style={{ color: 'inherit', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Phone size={12} color="var(--warning)" /> {st.parent_phone}
                        </a>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                          {studentGroupNames.length > 0 ? (
                            studentGroupNames.map(gn => (
                              <span key={gn} className="badge badge-primary" style={{ fontSize: '0.72rem' }}>
                                {gn}
                              </span>
                            ))
                          ) : (
                            <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>Guruhsiz</span>
                          )}
                        </div>
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{st.created_at}</td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Boshqa guruhga ko'chirish"
                            onClick={() => setSelectedStudentForTransfer(st)}
                          >
                            <ArrowRightLeft size={14} />
                          </button>
                          <button
                            className="btn btn-secondary btn-sm"
                            title="Arxivlash"
                            style={{ color: 'var(--warning)' }}
                            onClick={() => handleArchive(st.id)}
                          >
                            <Archive size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '520px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
              ➕ Yangi O'quvchi Qo'shish {activeBranch && `(${activeBranch.name})`}
            </h3>

            {error && <div className="badge badge-danger" style={{ width: '100%', padding: '10px', marginBottom: '14px' }}>{error}</div>}

            <form onSubmit={handleCreateStudent}>
              <div className="form-group">
                <label className="form-label">O'quvchi F.I.O.:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="masalan: Alisher Navoiy"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">O'quvchi Telefon Raqami:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+998 90 123 45 67"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Ota-onasi Telefon Raqami:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+998 93 123 45 67"
                  value={parentPhone}
                  onChange={e => setParentPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Biriktiriladigan Guruhlar:</label>
                <div style={{ maxHeight: '150px', overflowY: 'auto', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)', padding: '10px' }}>
                  {groups.length === 0 ? (
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Mavjud guruhlar topilmadi. Avval Guruhlar bo'limida guruh yarating.</div>
                  ) : (
                    groups.map(g => {
                      const checked = selectedGroupIds.includes(g.id);
                      return (
                        <label key={g.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', cursor: 'pointer', fontSize: '0.9rem' }}>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {
                              if (checked) {
                                setSelectedGroupIds(selectedGroupIds.filter(id => id !== g.id));
                              } else {
                                setSelectedGroupIds([...selectedGroupIds, g.id]);
                              }
                            }}
                          />
                          <span>{g.name} ({g.subject})</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {selectedStudentForTransfer && (
        <TransferModal
          isOpen={!!selectedStudentForTransfer}
          student={selectedStudentForTransfer}
          groups={groups}
          onClose={() => setSelectedStudentForTransfer(null)}
          onSuccess={() => {
            setSelectedStudentForTransfer(null);
            loadData();
          }}
          onTransferred={() => {
            setSelectedStudentForTransfer(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}
