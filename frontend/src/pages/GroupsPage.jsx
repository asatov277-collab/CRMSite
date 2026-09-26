import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Clock, MapPin, Trash2, AlertTriangle } from 'lucide-react';
import { api } from '../services/api';

export default function GroupsPage({ user }) {
  const [groups, setGroups] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' or 'uncollected'

  // Form state
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [teacherId, setTeacherId] = useState(user?.role === 'teacher' ? user.id : '');
  const [schedule, setSchedule] = useState('Dush-Sesh-Juma 14:00');
  const [room, setRoom] = useState('101-xona');
  const [price, setPrice] = useState('450000');
  const [error, setError] = useState('');
  const [infoMsg, setInfoMsg] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [grList, tList] = await Promise.all([
        api.getGroups(user?.role === 'teacher' ? user.id : null),
        api.getUsers('teacher')
      ]);
      setGroups(grList);
      setTeachers(tList);
      if (!teacherId && tList.length > 0) {
        setTeacherId(tList[0].id);
      }
    } catch (err) {
      console.error('Failed to load groups:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMsg('');

    try {
      await api.createGroup({
        name,
        subject,
        teacher_id: teacherId || user.id,
        schedule,
        room,
        price: Number(price) || 0
      });
      setShowAddModal(false);
      setName('');
      setSubject('');
      setInfoMsg("Yangi guruh muvaffaqiyatli yaratildi!");
      loadData();
    } catch (err) {
      setError(err.message || 'Guruh yaratishda xatolik');
    }
  };

  const handleDeleteSingleGroup = async (g) => {
    if (!window.confirm(`Haqiqatan ham "${g.name}" guruhini o'chirmoqchimisiz?`)) {
      return;
    }
    setError('');
    setInfoMsg('');

    try {
      const res = await api.deleteGroup(g.id, user.id);
      setInfoMsg(res.message || "Guruh o'chirildi!");
      loadData();
    } catch (err) {
      setError(err.message || "Guruhni o'chirishda xatolik yuz berdi!");
    }
  };

  const handleDeleteUncollected = async () => {
    const uncollectedCount = groups.filter(g => (g.student_count || 0) === 0).length;
    const scopeText = isAdmin ? "Barcha yig'ilmagan guruhlar" : "O'zingizga tegishli yig'ilmagan guruhlar";

    if (uncollectedCount === 0) {
      alert("Hozircha yig'ilmagan (o'quvchisi 0 ta bo'lgan) guruhlar mavjud emas.");
      return;
    }

    if (!window.confirm(`Haqiqatan ham yig'ilmagan (${uncollectedCount} ta o'quvchisi yo'q) guruhlarni o'chirmoqchimisiz?\n\nScope: ${scopeText}`)) {
      return;
    }

    setError('');
    setInfoMsg('');

    try {
      const res = await api.deleteUncollectedGroups(user.id);
      setInfoMsg(res.message || "Yig'ilmagan guruhlar o'chirildi!");
      loadData();
    } catch (err) {
      setError(err.message || "Guruhlarni o'chirishda xatolik yuz berdi!");
    }
  };

  const uncollectedGroups = groups.filter(g => (g.student_count || 0) === 0);
  const displayGroups = filter === 'uncollected' ? uncollectedGroups : groups;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>👥 Guruhlar Boshqaruvi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            O'quv guruhlari, dars jadvali, xonalar va to'lov stavkalari
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            className="btn" 
            onClick={handleDeleteUncollected}
            style={{ 
              backgroundColor: 'rgba(239, 68, 68, 0.1)', 
              color: 'var(--danger)', 
              border: '1px solid rgba(239, 68, 68, 0.3)',
              fontWeight: 600
            }}
          >
            <Trash2 size={16} /> Eski Yig'ilmagan Guruhlarni O'chirish
          </button>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            <Plus size={16} /> Yangi Guruh Yaratish
          </button>
        </div>
      </div>

      {infoMsg && (
        <div className="badge badge-success" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
          ✅ {infoMsg}
        </div>
      )}

      {error && (
        <div className="badge badge-danger" style={{ width: '100%', padding: '12px', fontSize: '0.95rem' }}>
          ❌ {error}
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', pb: '10px' }}>
        <button
          className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('all')}
          style={{ padding: '8px 16px', fontSize: '0.88rem' }}
        >
          Barcha Guruhlar ({groups.length})
        </button>
        <button
          className={`btn ${filter === 'uncollected' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setFilter('uncollected')}
          style={{ padding: '8px 16px', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          <AlertTriangle size={15} /> Yig'ilmagan ({uncollectedGroups.length})
        </button>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : (
        <div className="grid-3">
          {displayGroups.map(g => {
            const isOwnerOrAdmin = isAdmin || g.teacher_id === user?.id;
            const isUncollected = (g.student_count || 0) === 0;

            return (
              <div key={g.id} className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div className="card-header" style={{ marginBottom: '12px' }}>
                    <h3 className="card-title" style={{ color: 'var(--primary-color)', fontSize: '1.1rem' }}>
                      <UserCheck size={18} /> {g.name}
                    </h3>
                    <span className={`badge ${isUncollected ? 'badge-warning' : 'badge-info'}`}>
                      {isUncollected ? "0 ta o'quvchi (Yig'ilmagan)" : `${g.student_count} ta o'quvchi`}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.88rem', color: 'var(--text-main)' }}>
                    <div>📚 <strong>Fan:</strong> {g.subject}</div>
                    <div>👨‍🏫 <strong>O'qituvchi:</strong> {g.teacher_name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <Clock size={15} /> <span>{g.schedule || 'Jadval kiritilmagan'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)' }}>
                      <MapPin size={15} /> <span>{g.room || 'Xona belgilanmagan'}</span>
                    </div>
                    <div style={{ marginTop: '8px', paddingTop: '10px', borderTop: '1px solid var(--border-color)', fontWeight: 800, color: 'var(--success)', fontSize: '1.05rem' }}>
                      💵 To'lov: {(g.price || 0).toLocaleString()} so'm / oy
                    </div>
                  </div>
                </div>

                <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
                  {isOwnerOrAdmin ? (
                    <button
                      className="btn"
                      onClick={() => handleDeleteSingleGroup(g)}
                      style={{
                        color: 'var(--danger)',
                        borderColor: 'rgba(239, 68, 68, 0.4)',
                        backgroundColor: 'rgba(239, 68, 68, 0.05)',
                        padding: '6px 12px',
                        fontSize: '0.82rem'
                      }}
                      title="Guruhni o'chirish"
                    >
                      <Trash2 size={14} /> Guruhni O'chirish
                    </button>
                  ) : (
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                      Faqat biriktirilgan o'qituvchi o'chira oladi
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {displayGroups.length === 0 && (
            <div style={{ gridColumn: '1/-1', padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              {filter === 'uncollected' ? "Yig'ilmagan guruhlar topilmadi 🎉" : "Hozircha guruhlar mavjud emas"}
            </div>
          )}
        </div>
      )}

      {/* Create Group Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">👥 Yangi Guruh Yaratish</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {error && <div className="badge badge-danger" style={{ marginBottom: '14px', width: '100%' }}>{error}</div>}

            <form onSubmit={handleCreateGroup}>
              <div className="form-group">
                <label className="form-label">Guruh Nomi:</label>
                <input type="text" className="form-control" placeholder="Math Intensive - 02" value={name} onChange={e => setName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label className="form-label">Fan Nomi:</label>
                <input type="text" className="form-control" placeholder="Matematika" value={subject} onChange={e => setSubject(e.target.value)} required />
              </div>

              {isAdmin && (
                <div className="form-group">
                  <label className="form-label">Mas'ul O'qituvchi:</label>
                  <select className="form-control" value={teacherId} onChange={e => setTeacherId(e.target.value)} required>
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>{t.name} ({t.subject})</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Dars Kunlari va Vaqti (Schedule):</label>
                <input type="text" className="form-control" value={schedule} onChange={e => setSchedule(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Xona Nomeri:</label>
                <input type="text" className="form-control" value={room} onChange={e => setRoom(e.target.value)} />
              </div>

              <div className="form-group">
                <label className="form-label">Oylik To'lov Summasi (so'm):</label>
                <input type="number" className="form-control" value={price} onChange={e => setPrice(e.target.value)} required />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">Guruhni Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
