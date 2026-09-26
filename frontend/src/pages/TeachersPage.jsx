import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Image, Award, BookOpen, Edit, Shield, Lock, UserX, ArrowRightLeft, Archive } from 'lucide-react';
import { api } from '../services/api';

export default function TeachersPage({ user, onUpdateCurrentUser }) {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);

  // Offboard teacher state
  const [selectedTeacherForOffboard, setSelectedTeacherForOffboard] = useState(null);
  const [reassignTeacherId, setReassignTeacherId] = useState('');
  const [archiveAction, setArchiveAction] = useState('reassign');
  const [offboardLoading, setOffboardLoading] = useState(false);

  // New Teacher form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('teacher123');
  const [subject, setSubject] = useState('');
  const [bio, setBio] = useState('');
  const [certificates, setCertificates] = useState('');
  const [salary, setSalary] = useState('');
  const [error, setError] = useState('');

  // Self Edit profile state
  const [editName, setEditName] = useState(user?.name || '');
  const [editBio, setEditBio] = useState(user?.bio || '');
  const [editSubject, setEditSubject] = useState(user?.subject || '');
  const [editCerts, setEditCerts] = useState(user?.certificates || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [bgFile, setBgFile] = useState(null);

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers('teacher');
      setTeachers(data.filter(t => !t.archived));
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeacher = async (e) => {
    e.preventDefault();
    setError('');

    try {
      await api.createUser({
        name,
        phone,
        password,
        role: 'teacher',
        subject,
        bio,
        certificates,
        salary: Number(salary) || 0
      });
      setShowAddModal(false);
      setName('');
      setPhone('');
      setSubject('');
      setBio('');
      setCertificates('');
      setSalary('');
      fetchTeachers();
    } catch (err) {
      setError(err.message || 'O\'qituvchi qo\'shishda xatolik');
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const formData = new FormData();
      formData.append('name', editName);
      formData.append('bio', editBio);
      formData.append('subject', editSubject);
      formData.append('certificates', editCerts);
      if (avatarFile) formData.append('avatar_file', avatarFile);
      if (bgFile) formData.append('bg_file', bgFile);

      const res = await api.updateUserProfile(user.id, formData);
      localStorage.setItem('user', JSON.stringify(res.user));
      if (onUpdateCurrentUser) onUpdateCurrentUser(res.user);
      setShowEditProfileModal(false);
      fetchTeachers();
    } catch (err) {
      setError(err.message || 'Profilni yangilashda xatolik');
    }
  };

  const handleOffboardSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacherForOffboard) return;

    if (archiveAction === 'reassign' && !reassignTeacherId) {
      alert("Iltimos yangi biriktiriladigan o'qituvchini tanlang!");
      return;
    }

    setOffboardLoading(true);
    try {
      const res = await api.offboardTeacher(selectedTeacherForOffboard.id, {
        new_teacher_id: reassignTeacherId || null,
        archive_action: archiveAction
      });
      alert(res.message);
      setSelectedTeacherForOffboard(null);
      setReassignTeacherId('');
      fetchTeachers();
    } catch (err) {
      alert(err.message || "Xatolik yuz berdi");
    } finally {
      setOffboardLoading(false);
    }
  };

  const otherTeachers = teachers.filter(t => selectedTeacherForOffboard && t.id !== selectedTeacherForOffboard.id);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>👨‍🏫 O'qituvchilar Bo'limi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Markaz o'qituvchilari katalogi, profillari va bio ma'lumotlari
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowEditProfileModal(true)}>
            <Edit size={16} /> Profilimni Tahrirlash
          </button>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <UserPlus size={16} /> Yangi O'qituvchi Qo'shish
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>Yuklanmoqda...</div>
      ) : (
        <div className="grid-3">
          {teachers.map((t) => (
            <div key={t.id} className="card" style={{ padding: 0, overflow: 'hidden' }}>
              {/* Background Header Wallpaper */}
              <div style={{
                height: '100px',
                background: t.bg ? `url(${t.bg}) center/cover` : 'linear-gradient(135deg, var(--primary-color), #3B82F6)',
                position: 'relative'
              }} />

              {/* Avatar Capsule */}
              <div style={{ padding: '0 20px 20px 20px', marginTop: '-40px' }}>
                <div style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  border: '4px solid var(--bg-card)',
                  background: 'var(--primary-color)',
                  overflow: 'hidden',
                  marginBottom: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justify: 'center',
                  fontWeight: 800,
                  fontSize: '1.4rem',
                  color: '#FFF'
                }}>
                  {t.avatar ? (
                    <img src={t.avatar} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    t.name.charAt(0)
                  )}
                </div>

                <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>{t.name}</h3>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 700, marginBottom: '8px' }}>
                  📚 {t.subject || 'O\'qituvchi'}
                </div>

                <p style={{ fontSize: '0.83rem', color: 'var(--text-muted)', marginBottom: '12px', minHeight: '40px' }}>
                  {t.bio || 'Ma\'lumot kiritilmagan'}
                </p>

                {/* Certificates */}
                {t.certificates && (
                  <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.04)', padding: '8px 12px', borderRadius: 'var(--radius-sm)', marginBottom: '12px' }}>
                    <strong>🏆 Sertifikatlar:</strong> {t.certificates}
                  </div>
                )}

                <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '10px', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  📞 {t.phone}
                </div>

                {/* Admin Only Salary & Actions */}
                {isAdmin ? (
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <div style={{ padding: '8px 10px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', borderRadius: 'var(--radius-md)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--success)' }}>
                        <span>👑 Oylik maoshi:</span>
                        <span>{(t.salary || 0).toLocaleString()} so'm</span>
                      </div>
                    </div>

                    <button
                      className="btn btn-danger btn-sm"
                      style={{ width: '100%', marginTop: '4px' }}
                      onClick={() => {
                        setSelectedTeacherForOffboard(t);
                        setReassignTeacherId('');
                        setArchiveAction('reassign');
                      }}
                    >
                      <UserX size={14} /> Ishdan Bo'shatish / Arxivlash
                    </button>
                  </div>
                ) : (
                  <div style={{ marginTop: '12px', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                    <Lock size={12} /> Maosh va o'quvchilar soni faqat Adminga ko'rinadi
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Admin Offboard Teacher Modal */}
      {selectedTeacherForOffboard && (
        <div className="modal-overlay" onClick={() => setSelectedTeacherForOffboard(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: 'var(--danger)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <UserX size={20} /> O'qituvchini Ishdan Bo'shatish va Guruhlarini O'tkazish
              </h3>
              <button className="close-btn" onClick={() => setSelectedTeacherForOffboard(null)}>✕</button>
            </div>

            <form onSubmit={handleOffboardSubmit}>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '12px', borderRadius: 'var(--radius-md)', marginBottom: '16px' }}>
                <div style={{ fontWeight: 700 }}>{selectedTeacherForOffboard.name}</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Fani: {selectedTeacherForOffboard.subject} | Tel: {selectedTeacherForOffboard.phone}</div>
              </div>

              <div className="form-group">
                <label className="form-label">Guruhlar va O'quvchilar Taqdiri:</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <input
                      type="radio"
                      name="action"
                      value="reassign"
                      checked={archiveAction === 'reassign'}
                      onChange={() => setArchiveAction('reassign')}
                    />
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>🔄 Boshqa aktiv o'qituvchiga biriktirish</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Guruhlar va o'quvchilar yangi o'qituvchiga o'tkaziladi</div>
                    </div>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <input
                      type="radio"
                      name="action"
                      value="archive"
                      checked={archiveAction === 'archive'}
                      onChange={() => setArchiveAction('archive')}
                    />
                    <div>
                      <strong style={{ fontSize: '0.9rem' }}>📁 Guruhlar va O'quvchilarni Arxivga O'tkazish</strong>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Guruh va o'quvchilar tugatilgan bo'lsa arxivda saqlanadi</div>
                    </div>
                  </label>
                </div>
              </div>

              {archiveAction === 'reassign' && (
                <div className="form-group">
                  <label className="form-label">Yangi O'qituvchini Tanlang:</label>
                  <select
                    className="form-control"
                    value={reassignTeacherId}
                    onChange={e => setReassignTeacherId(e.target.value)}
                    required
                  >
                    <option value="">-- Yangi o'qituvchini tanlang --</option>
                    {otherTeachers.map(ot => (
                      <option key={ot.id} value={ot.id}>{ot.name} ({ot.subject})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedTeacherForOffboard(null)}>Bekor qilish</button>
                <button type="submit" className="btn btn-danger" disabled={offboardLoading}>
                  {offboardLoading ? 'Bajarilmoqda...' : 'Tasdiqlash va Bo\'shatish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Admin Add Teacher Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3 className="modal-title">👨‍🏫 Yangi O'qituvchi Qo'shish</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            {error && <div className="badge badge-danger" style={{ marginBottom: '14px', width: '100%' }}>{error}</div>}
            <form onSubmit={handleCreateTeacher}>
              <div className="form-group">
                <label className="form-label">F.I.O. (Ism va Familiya):</label>
                <input type="text" className="form-control" value={name} onChange={e => setName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Telefon raqam:</label>
                <input type="text" className="form-control" value={phone} onChange={e => setPhone(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Parol:</label>
                <input type="text" className="form-control" value={password} onChange={e => setPassword(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Fani:</label>
                <input type="text" className="form-control" placeholder="Masalan: Matematika" value={subject} onChange={e => setSubject(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Bio / Haqida ma'lumot:</label>
                <textarea className="form-control" value={bio} onChange={e => setBio(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Sertifikatlari:</label>
                <input type="text" className="form-control" placeholder="IELTS 8.0, CELTA" value={certificates} onChange={e => setCertificates(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Oylik maoshi (so'm):</label>
                <input type="number" className="form-control" value={salary} onChange={e => setSalary(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">Qo'shish</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Teacher Self Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="modal-overlay" onClick={() => setShowEditProfileModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">🖼️ Profilim va Fonnimni Tahrirlash</h3>
              <button className="close-btn" onClick={() => setShowEditProfileModal(false)}>✕</button>
            </div>
            {error && <div className="badge badge-danger" style={{ marginBottom: '14px', width: '100%' }}>{error}</div>}
            <form onSubmit={handleUpdateProfile}>
              <div className="form-group">
                <label className="form-label">Ism Familiyangiz:</label>
                <input type="text" className="form-control" value={editName} onChange={e => setEditName(e.target.value)} required />
              </div>
              <div className="form-group">
                <label className="form-label">Profil Rasmi (Avatar upload):</label>
                <input type="file" accept="image/*" className="form-control" onChange={e => setAvatarFile(e.target.files[0])} />
              </div>
              <div className="form-group">
                <label className="form-label">Orqa fon rasmi (Header Background wallpaper upload):</label>
                <input type="file" accept="image/*" className="form-control" onChange={e => setBgFile(e.target.files[0])} />
              </div>
              <div className="form-group">
                <label className="form-label">Dars beradigan faningiz:</label>
                <input type="text" className="form-control" value={editSubject} onChange={e => setEditSubject(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Bio (O'zingiz haqingizda):</label>
                <textarea className="form-control" value={editBio} onChange={e => setEditBio(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Sertifikatlar:</label>
                <input type="text" className="form-control" value={editCerts} onChange={e => setEditCerts(e.target.value)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowEditProfileModal(false)}>Bekor qilish</button>
                <button type="submit" className="btn btn-primary">Saqlash</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
