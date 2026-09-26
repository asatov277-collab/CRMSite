import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Image, Award, BookOpen, Edit, Shield, Lock, UserX, ArrowRightLeft, Percent, DollarSign, Building2, KeyRound } from 'lucide-react';
import { api } from '../services/api';

export default function TeachersPage({ user, onUpdateCurrentUser, activeBranch }) {
  const [teachers, setTeachers] = useState([]);
  const [branches, setBranches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSelfEditModal, setShowSelfEditModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null); // Admin edit teacher

  // Offboard teacher state
  const [selectedTeacherForOffboard, setSelectedTeacherForOffboard] = useState(null);
  const [reassignTeacherId, setReassignTeacherId] = useState('');
  const [archiveAction, setArchiveAction] = useState('reassign');
  const [offboardLoading, setOffboardLoading] = useState(false);

  // New Teacher form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('+998 90 ');
  const [password, setPassword] = useState('teacher123');
  const [subject, setSubject] = useState('');
  const [bio, setBio] = useState('');
  const [certificates, setCertificates] = useState('');
  const [salaryPercent, setSalaryPercent] = useState('50');
  const [teacherBranchId, setTeacherBranchId] = useState(activeBranch?.id || 'b_main');
  const [error, setError] = useState('');

  // Admin Edit Teacher Modal Form state
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editPassword, setEditPassword] = useState('');
  const [editSubject, setEditSubject] = useState('');
  const [editSalaryPercent, setEditSalaryPercent] = useState('50');
  const [editBranchId, setEditBranchId] = useState('b_main');
  const [editError, setEditError] = useState('');
  const [editSaving, setEditSaving] = useState(false);

  // Self Edit profile state
  const [selfName, setSelfName] = useState(user?.name || '');
  const [selfBio, setSelfBio] = useState(user?.bio || '');
  const [selfSubject, setSelfSubject] = useState(user?.subject || '');
  const [selfCerts, setSelfCerts] = useState(user?.certificates || '');
  const [avatarFile, setAvatarFile] = useState(null);
  const [bgFile, setBgFile] = useState(null);
  const [selfError, setSelfError] = useState('');

  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const currentBranchId = isManager ? (user?.branch_id || null) : (activeBranch ? activeBranch.id : null);

  useEffect(() => {
    fetchTeachers();
    fetchBranches();
  }, [currentBranchId]);

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await api.getUsers('teacher', currentBranchId);
      setTeachers(data.filter(t => !t.archived));
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const bList = await api.getBranches();
      setBranches(bList);
    } catch (err) {}
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
        salary_percent: Number(salaryPercent) || 50,
        branch_id: teacherBranchId || 'b_main'
      });
      setShowAddModal(false);
      setName('');
      setPhone('+998 90 ');
      setPassword('teacher123');
      setSubject('');
      setBio('');
      setCertificates('');
      setSalaryPercent('50');
      fetchTeachers();
    } catch (err) {
      setError(err.message || 'Xatolik yuz berdi');
    }
  };

  // Open Admin Edit Teacher Modal
  const handleOpenAdminEdit = (teacher) => {
    setEditingTeacher(teacher);
    setEditName(teacher.name);
    setEditPhone(teacher.phone);
    setEditPassword('');
    setEditSubject(teacher.subject || '');
    setEditSalaryPercent(String(teacher.salary_percent || 50));
    setEditBranchId(teacher.branch_id || 'b_main');
    setEditError('');
  };

  const handleAdminEditSubmit = async (e) => {
    e.preventDefault();
    setEditSaving(true);
    setEditError('');

    try {
      await api.adminEditUser(editingTeacher.id, {
        name: editName,
        phone: editPhone,
        password: editPassword.trim() ? editPassword.trim() : null,
        subject: editSubject,
        salary_percent: Number(editSalaryPercent) || 50,
        branch_id: editBranchId,
        editor_role: user.role,
        editor_branch_id: user.branch_id || null
      });

      setEditingTeacher(null);
      fetchTeachers();
    } catch (err) {
      setEditError(err.message || 'Tahrirlashda xatolik yuz berdi');
    } finally {
      setEditSaving(false);
    }
  };

  // Self Profile Update
  const handleSelfEditSubmit = async (e) => {
    e.preventDefault();
    setSelfError('');

    try {
      const formData = new FormData();
      formData.append('name', selfName);
      formData.append('bio', selfBio);
      formData.append('subject', selfSubject);
      formData.append('certificates', selfCerts);
      if (avatarFile) formData.append('avatar_file', avatarFile);
      if (bgFile) formData.append('bg_file', bgFile);

      const updated = await api.updateUserProfile(user.id, formData);
      localStorage.setItem('user', JSON.stringify(updated));
      onUpdateCurrentUser(updated);
      setShowSelfEditModal(false);
      fetchTeachers();
    } catch (err) {
      setSelfError(err.message || 'Profilni yangilashda xatolik');
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

  // Check if current user can edit this teacher's salary percent
  const canEditTeacher = (t) => {
    if (isAdmin) return true;
    if (isManager && user.branch_id === t.branch_id) return true;
    return false;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            👨‍🏫 O'qituvchilar Bo'limi {activeBranch && <span style={{ fontSize: '1rem', color: 'var(--primary-color)' }}>({activeBranch.name})</span>}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            O'qituvchilar profillari, tahrirlash va to'lov tushumidan foizli oylik maosh hisobi
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={() => setShowSelfEditModal(true)}>
            <Edit size={16} /> Mening Profilim
          </button>
          {(isAdmin || isManager) && (
            <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
              <UserPlus size={16} /> Yangi O'qituvchi Qo'shish
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>O'qituvchilar yuklanmoqda...</div>
      ) : (
        <div className="grid-3">
          {teachers.map((t) => {
            const hasEditPermission = canEditTeacher(t);
            const branchObj = branches.find(b => b.id === t.branch_id);

            return (
              <div key={t.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                {/* Background Wallpaper */}
                <div style={{
                  height: '90px',
                  background: t.bg ? `url(${t.bg}) center/cover` : 'linear-gradient(135deg, var(--primary-color), #3B82F6)',
                  position: 'relative'
                }}>
                  {branchObj && (
                    <div style={{
                      position: 'absolute',
                      top: '10px',
                      right: '12px',
                      background: 'rgba(0, 0, 0, 0.65)',
                      backdropFilter: 'blur(4px)',
                      color: '#FFF',
                      padding: '3px 10px',
                      borderRadius: '12px',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}>
                      <Building2 size={12} color="var(--primary-color)" /> {branchObj.name}
                    </div>
                  )}
                </div>

                {/* Avatar & Content */}
                <div style={{ padding: '0 20px 20px 20px', marginTop: '-36px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <div style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    border: '4px solid var(--bg-card)',
                    background: 'var(--primary-color)',
                    overflow: 'hidden',
                    marginBottom: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: '1.3rem',
                    color: '#FFF',
                    boxShadow: '0 4px 10px rgba(0,0,0,0.3)'
                  }}>
                    {t.avatar ? (
                      <img src={t.avatar} alt={t.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      t.name.charAt(0)
                    )}
                  </div>

                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>{t.name}</h3>
                  <div style={{ fontSize: '0.85rem', color: 'var(--primary-color)', fontWeight: 700, marginBottom: '6px' }}>
                    📚 {t.subject || 'O\'qituvchi'}
                  </div>

                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '10px', minHeight: '34px' }}>
                    {t.bio || 'Bio kiritilmagan'}
                  </p>

                  {/* Student & Group count badge */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.03)',
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.8rem',
                    marginBottom: '12px'
                  }}>
                    <span>👥 Guruhlar: <strong>{t.group_count || 0} ta</strong></span>
                    <span>👨‍🎓 O'quvchilar: <strong>{t.student_count || 0} ta</strong></span>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
                    📞 {t.phone}
                  </div>

                  {/* Salary Percent Calculation Box - User Core Requirement */}
                  {(isAdmin || isManager) ? (
                    <div style={{
                      marginTop: 'auto',
                      padding: '12px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(79, 70, 229, 0.08))',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      borderRadius: 'var(--radius-md)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px'
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>💰 Oylik Tushum:</span>
                        <strong style={{ color: '#FFF' }}>{(t.monthly_revenue || 0).toLocaleString()} so'm</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>📊 Belgilangan Foiz:</span>
                        <span className="badge badge-warning" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>
                          {t.salary_percent || 50}%
                        </span>
                      </div>
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderTop: '1px dashed rgba(255,255,255,0.15)',
                        paddingTop: '6px',
                        marginTop: '2px'
                      }}>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--success)' }}>💵 Oylik Maoshi:</span>
                        <strong style={{ fontSize: '1.05rem', color: 'var(--success)' }}>
                          {(t.calculated_salary || 0).toLocaleString()} so'm
                        </strong>
                      </div>
                    </div>
                  ) : (
                    <div style={{ marginTop: 'auto', fontSize: '0.75rem', color: 'var(--text-dim)', textAlign: 'center' }}>
                      <Lock size={12} /> Maosh ma'lumotlari xavfsiz himoyalangan
                    </div>
                  )}

                  {/* Admin / Manager Action Buttons */}
                  {hasEditPermission && (
                    <div style={{ marginTop: '12px', display: 'flex', gap: '8px' }}>
                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleOpenAdminEdit(t)}
                      >
                        <Edit size={14} /> Profilni Tahrirlash
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        title="Bo'shatish / Arxivlash"
                        onClick={() => {
                          setSelectedTeacherForOffboard(t);
                          setReassignTeacherId('');
                          setArchiveAction('reassign');
                        }}
                      >
                        <UserX size={14} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Admin / Manager Edit Teacher Modal */}
      {editingTeacher && (
        <div className="modal-overlay" onClick={() => setEditingTeacher(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '540px' }}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Edit size={20} color="var(--primary-color)" /> O'qituvchi Profilini Tahrirlash
              </h3>
              <button className="close-btn" onClick={() => setEditingTeacher(null)}>✕</button>
            </div>

            {editError && <div className="badge badge-danger" style={{ width: '100%', padding: '10px', marginBottom: '14px' }}>{editError}</div>}

            <form onSubmit={handleAdminEditSubmit}>
              <div className="form-group">
                <label className="form-label">O'qituvchi F.I.O.:</label>
                <input
                  type="text"
                  className="form-control"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Telefon Raqami (Login):</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Yangi Parol (ixtiyoriy):</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="O'zgartirmaslik uchun bo'sh qoldiring"
                    value={editPassword}
                    onChange={e => setEditPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Dars Beradigan Fani:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={editSubject}
                    onChange={e => setEditSubject(e.target.value)}
                  />
                </div>

                {isAdmin && (
                  <div className="form-group">
                    <label className="form-label">Biriktirilgan Filiali:</label>
                    <select
                      className="form-control"
                      value={editBranchId}
                      onChange={e => setEditBranchId(e.target.value)}
                    >
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Salary Percentage Field - Core Requirement */}
              <div style={{
                background: 'rgba(79, 70, 229, 0.08)',
                border: '1px solid var(--primary-color)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                marginTop: '10px',
                marginBottom: '16px'
              }}>
                <label className="form-label" style={{ fontWeight: 700, color: 'var(--primary-color)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Percent size={16} /> Oylik Maosh Foiz Stavkasi (%):
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    className="form-control"
                    style={{ fontSize: '1.2rem', fontWeight: 800, width: '120px' }}
                    value={editSalaryPercent}
                    onChange={e => setEditSalaryPercent(e.target.value)}
                    required
                  />
                  <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>%</span>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    O'quvchilardan tushgan oylik to'lovning necha foizi o'qituvchiga maosh bo'lib hisoblanishi
                  </div>
                </div>

                {/* Live Formula Preview */}
                <div style={{
                  marginTop: '10px',
                  padding: '10px',
                  background: 'rgba(0,0,0,0.3)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.82rem',
                  color: 'var(--success)'
                }}>
                  💡 <strong>Misol:</strong> Agar oy davomida 22 000 000 so'm tushsa → <strong>{editSalaryPercent || 0}%</strong> stavka bilan o'qituvchi oyligi: <strong>{((22000000 * (Number(editSalaryPercent) || 0)) / 100).toLocaleString()} so'm</strong> bo'ladi.
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditingTeacher(null)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={editSaving}>
                  {editSaving ? 'Saqlanmoqda...' : 'O\'zgarishlarni Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h3 className="modal-title">➕ Yangi O'qituvchi Qo'shish</h3>
              <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            </div>

            {error && <div className="badge badge-danger" style={{ width: '100%', padding: '10px', marginBottom: '14px' }}>{error}</div>}

            <form onSubmit={handleCreateTeacher}>
              <div className="form-group">
                <label className="form-label">O'qituvchi F.I.O.:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="masalan: Bekzod Rahimov"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Telefon Raqami (Login):</label>
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
                  <label className="form-label">Dastlabki Parol:</label>
                  <input
                    type="text"
                    className="form-control"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="grid-2">
                <div className="form-group">
                  <label className="form-label">Dars Beradigan Fani:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="masalan: Ingliz tili / IELTS"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Oylik Foiz Stavkasi (%):</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    className="form-control"
                    value={salaryPercent}
                    onChange={e => setSalaryPercent(e.target.value)}
                    required
                  />
                </div>
              </div>

              {isAdmin && (
                <div className="form-group">
                  <label className="form-label">Filial:</label>
                  <select
                    className="form-control"
                    value={teacherBranchId}
                    onChange={e => setTeacherBranchId(e.target.value)}
                  >
                    {branches.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Sertifikatlari (ixtiyoriy):</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="masalan: IELTS 8.5, TESOL"
                  value={certificates}
                  onChange={e => setCertificates(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary">
                  Qo'shish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Self Edit Profile Modal */}
      {showSelfEditModal && (
        <div className="modal-overlay" onClick={() => setShowSelfEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <div className="modal-header">
              <h3 className="modal-title">✏️ Shaxsiy Profilimni Tahrirlash</h3>
              <button className="close-btn" onClick={() => setShowSelfEditModal(false)}>✕</button>
            </div>

            {selfError && <div className="badge badge-danger" style={{ width: '100%', padding: '10px', marginBottom: '14px' }}>{selfError}</div>}

            <form onSubmit={handleSelfEditSubmit}>
              <div className="form-group">
                <label className="form-label">Ism Familiya:</label>
                <input
                  type="text"
                  className="form-control"
                  value={selfName}
                  onChange={e => setSelfName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Mutaxassislik / Fan:</label>
                <input
                  type="text"
                  className="form-control"
                  value={selfSubject}
                  onChange={e => setSelfSubject(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bio (O'zingiz haqingizda qisqacha):</label>
                <textarea
                  className="form-control"
                  rows="3"
                  value={selfBio}
                  onChange={e => setSelfBio(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Profil Rasmi (Avatar):</label>
                <input
                  type="file"
                  accept="image/*"
                  className="form-control"
                  onChange={e => setAvatarFile(e.target.files[0])}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowSelfEditModal(false)}>
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

      {/* Offboard Teacher Modal */}
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
                    <span>Barcha guruhlarini boshqa o'qituvchiga biriktirish (Tavsiya etiladi)</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', background: 'rgba(0,0,0,0.3)', padding: '10px', borderRadius: 'var(--radius-md)' }}>
                    <input
                      type="radio"
                      name="action"
                      value="archive"
                      checked={archiveAction === 'archive'}
                      onChange={() => setArchiveAction('archive')}
                    />
                    <span>Barcha guruhlarini ham arxivlash</span>
                  </label>
                </div>
              </div>

              {archiveAction === 'reassign' && (
                <div className="form-group">
                  <label className="form-label">Yangi Qabul Qiluvchi O'qituvchini Tanlang:</label>
                  <select
                    className="form-control"
                    value={reassignTeacherId}
                    onChange={e => setReassignTeacherId(e.target.value)}
                    required
                  >
                    <option value="">-- O'qituvchini tanlang --</option>
                    {otherTeachers.map(ot => (
                      <option key={ot.id} value={ot.id}>{ot.name} ({ot.subject || 'O\'qituvchi'})</option>
                    ))}
                  </select>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setSelectedTeacherForOffboard(null)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-danger" disabled={offboardLoading}>
                  {offboardLoading ? 'Bajarilmoqda...' : 'Tasdiqlash va Bo\'shatish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
