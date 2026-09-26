import React, { useState, useEffect } from 'react';
import { Building2, Plus, Users, UserCheck, Phone, MapPin, User, ArrowRight, Trash2, Edit3, CheckCircle, Shield, Key } from 'lucide-react';
import { api } from '../services/api';

export default function BranchesPage({ user, onSelectBranch, activeBranch }) {
  const [activeTab, setActiveTab] = useState('branches'); // 'branches' | 'managers'
  const [branches, setBranches] = useState([]);
  const [managers, setManagers] = useState([]);
  const [loading, setLoading] = useState(true);

  // Branch Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('+998 71 ');
  const [managerId, setManagerId] = useState('');
  const [managerName, setManagerName] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  // Manager Modal State
  const [showManagerModal, setShowManagerModal] = useState(false);
  const [mgrName, setMgrName] = useState('');
  const [mgrPhone, setMgrPhone] = useState('+998 ');
  const [mgrPassword, setMgrPassword] = useState('');
  const [mgrBranchId, setMgrBranchId] = useState('');
  const [mgrError, setMgrError] = useState('');
  const [mgrSaving, setMgrSaving] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [branchesData, managersData] = await Promise.all([
        api.getBranches(),
        api.getManagers()
      ]);
      setBranches(branchesData || []);
      setManagers(managersData || []);
    } catch (err) {
      console.error('Failed to load branches data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAdd = () => {
    setEditingBranch(null);
    setName('');
    setAddress('');
    setPhone('+998 71 ');
    setManagerId('');
    setManagerName('');
    setError('');
    setShowAddModal(true);
  };

  const handleOpenEdit = (b, e) => {
    e.stopPropagation();
    setEditingBranch(b);
    setName(b.name);
    setAddress(b.address || '');
    setPhone(b.phone || '+998 71 ');
    setManagerId(b.manager_id || '');
    setManagerName(b.manager_name || '');
    setError('');
    setShowAddModal(true);
  };

  const handleManagerSelect = (e) => {
    const mId = e.target.value;
    setManagerId(mId);
    const found = managers.find(m => m.id === mId);
    if (found) {
      setManagerName(found.name);
    } else {
      setManagerName('');
    }
  };

  const handleSubmitBranch = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload = {
        name,
        address,
        phone,
        manager_id: managerId,
        manager_name: managerName || 'Tayinlanmagan'
      };

      if (editingBranch) {
        await api.updateBranch(editingBranch.id, payload);
      } else {
        await api.createBranch(payload);
      }

      setShowAddModal(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Filialni saqlashda xatolik yuz berdi');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBranch = async (bId, e) => {
    e.stopPropagation();
    if (!window.confirm("Haqiqatan ham ushbu filialni o'chirmoqchimisiz?")) {
      return;
    }
    try {
      await api.deleteBranch(bId);
      loadData();
    } catch (err) {
      alert(err.message || "Filialni o'chirishda xatolik");
    }
  };

  // Manager Handlers
  const handleOpenAddManager = (defaultBranchId = '') => {
    setMgrName('');
    setMgrPhone('+998 ');
    setMgrPassword('123456');
    setMgrBranchId(defaultBranchId || (branches.length > 0 ? branches[0].id : 'b_main'));
    setMgrError('');
    setShowManagerModal(true);
  };

  const handleSubmitManager = async (e) => {
    e.preventDefault();
    setMgrSaving(true);
    setMgrError('');

    try {
      await api.createManager({
        name: mgrName,
        phone: mgrPhone,
        password: mgrPassword,
        branch_id: mgrBranchId
      });
      setShowManagerModal(false);
      loadData();
    } catch (err) {
      setMgrError(err.message || 'Menejerni qo\'shishda xatolik yuz berdi');
    } finally {
      setMgrSaving(false);
    }
  };

  const handleDeleteManager = async (mgrId) => {
    if (!window.confirm("Haqiqatan ham ushbu menejerni tizimdan o'chirmoqchimisiz?")) {
      return;
    }
    try {
      await api.deleteManager(mgrId);
      loadData();
    } catch (err) {
      alert(err.message || "Menejerni o'chirishda xatolik yuz berdi");
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '10px' }}>
            🏢 O'quv Markaz Filiallari va Menejerlari
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Filiallar tarmog'ini boshqarish, filial menejerlarini tayinlash va barcha filiallar bo'yicha to'liq nazorat
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button className="btn btn-secondary" onClick={() => handleOpenAddManager()} style={{ padding: '10px 18px' }}>
            <UserCheck size={18} /> Yangi Menejer Qo'shish
          </button>
          <button className="btn btn-primary" onClick={handleOpenAdd} style={{ padding: '10px 18px' }}>
            <Plus size={18} /> Yangi Filial Ochish
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button
          className={`btn ${activeTab === 'branches' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('branches')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontWeight: 700 }}
        >
          <Building2 size={18} />
          Filiallar ({branches.length})
        </button>
        <button
          className={`btn ${activeTab === 'managers' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setActiveTab('managers')}
          style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '9px 18px', fontWeight: 700 }}
        >
          <Shield size={18} />
          Filial Menejerlari ({managers.length})
        </button>
      </div>

      {/* Info Banner */}
      <div className="card" style={{
        padding: '16px 20px',
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.12), rgba(16, 185, 129, 0.05))',
        border: '1px solid rgba(79, 70, 229, 0.3)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: '10px',
            background: 'var(--primary-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFF'
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
              Ko'p filialli (Multi-Branch) avtonom boshqaruv tizimi
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Menejerlar faqat ushbu bo'limda saqlanadi va o'qituvchilar katalogiga aralashmaydi. Istalgan filial kartochkasidagi <strong>"Filialga Kirish"</strong> tugmasini bosib o'sha filialni alohida boshqarishingiz mumkin.
            </div>
          </div>
        </div>

        {activeBranch ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="badge badge-success" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
              ✓ Hozir faol: {activeBranch.name}
            </span>
            <button className="btn btn-secondary btn-sm" onClick={() => onSelectBranch(null)}>
              Barcha filiallar ko'rinishi
            </button>
          </div>
        ) : (
          <span className="badge badge-info" style={{ padding: '8px 12px', fontSize: '0.85rem' }}>
            Hozir: Markaziy ko'rinish (Barcha filiallar)
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '50px', color: 'var(--text-muted)' }}>Ma'lumotlar yuklanmoqda...</div>
      ) : activeTab === 'branches' ? (
        /* Branches Grid */
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
          gap: '20px'
        }}>
          {branches.map((b) => {
            const isCurrentActive = activeBranch?.id === b.id;
            const isMain = b.id === 'b_main';

            return (
              <div
                key={b.id}
                className="card"
                style={{
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                  cursor: 'pointer',
                  border: isCurrentActive ? '2px solid var(--primary-color)' : '1px solid var(--border-color)',
                  background: isCurrentActive ? 'rgba(79, 70, 229, 0.08)' : 'var(--bg-card)',
                  boxShadow: isCurrentActive ? '0 8px 25px var(--primary-glow)' : 'var(--shadow-main)',
                  transition: 'all 0.2s ease',
                  position: 'relative'
                }}
                onClick={() => onSelectBranch(b)}
              >
                {/* Branch Badge */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                      width: '44px',
                      height: '44px',
                      borderRadius: '12px',
                      background: isMain ? 'linear-gradient(135deg, var(--warning), #F59E0B)' : 'linear-gradient(135deg, var(--primary-color), #818CF8)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#FFF',
                      fontWeight: 800,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.3)'
                    }}>
                      <Building2 size={22} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {b.name}
                      </h3>
                      {isMain && (
                        <span className="badge badge-warning" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                          Bosh Filial (Markaz)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Actions: Edit / Delete */}
                  <div style={{ display: 'flex', gap: '6px' }} onClick={e => e.stopPropagation()}>
                    <button
                      className="btn btn-secondary btn-sm"
                      title="Tahrirlash"
                      onClick={(e) => handleOpenEdit(b, e)}
                      style={{ padding: '6px' }}
                    >
                      <Edit3 size={14} />
                    </button>
                    {!isMain && (
                      <button
                        className="btn btn-secondary btn-sm"
                        title="O'chirish"
                        onClick={(e) => handleDeleteBranch(b.id, e)}
                        style={{ padding: '6px', color: 'var(--danger)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Branch Details */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                  {b.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={15} color="var(--primary-color)" />
                      <span>{b.address}</span>
                    </div>
                  )}
                  {b.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={15} color="var(--info)" />
                      <span>{b.phone}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={15} color="var(--warning)" />
                    <span>Menejer: <strong style={{ color: 'var(--text-main)' }}>{b.manager_name || 'Tayinlanmagan'}</strong></span>
                  </div>
                </div>

                {/* Counters Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '8px',
                  background: 'rgba(0,0,0,0.25)',
                  padding: '12px',
                  borderRadius: 'var(--radius-sm)',
                  textAlign: 'center'
                }}>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary-color)' }}>
                      {b.student_count || 0}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>O'quvchilar</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--success)' }}>
                      {b.group_count || 0}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Guruhlar</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--info)' }}>
                      {b.teacher_count || 0}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>O'qituvchilar</div>
                  </div>
                </div>

                {/* Action button */}
                <button
                  className={isCurrentActive ? "btn btn-success" : "btn btn-primary"}
                  style={{ width: '100%', marginTop: '6px', padding: '10px' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectBranch(b);
                  }}
                >
                  {isCurrentActive ? (
                    <>
                      <CheckCircle size={16} /> Ushbu Filial Ichidasiz
                    </>
                  ) : (
                    <>
                      Filialga Kirish va Boshqarish <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* Managers List */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 800 }}>
              👔 Filiallarga Biriktirilgan Menejerlar
            </h3>
            <button className="btn btn-primary btn-sm" onClick={() => handleOpenAddManager()}>
              <Plus size={16} /> Yangi Menejer Tayinlash
            </button>
          </div>

          {managers.length === 0 ? (
            <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
              <Shield size={48} style={{ opacity: 0.3, marginBottom: '12px' }} />
              <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>Hozircha filial menejerlari mavjud emas</div>
              <p style={{ fontSize: '0.85rem', marginTop: '6px' }}>
                Yangi filial menejerini qo'shish uchun "Yangi Menejer Qo'shish" tugmasini bosing.
              </p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '16px'
            }}>
              {managers.map(m => (
                <div key={m.id} className="card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '44px',
                        height: '44px',
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #10B981, #059669)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFF',
                        fontWeight: 800,
                        fontSize: '1.1rem'
                      }}>
                        {m.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-main)' }}>
                          {m.name}
                        </div>
                        <span className="badge badge-success" style={{ fontSize: '0.72rem', padding: '2px 8px' }}>
                          Filial Menejeri
                        </span>
                      </div>
                    </div>

                    <button
                      className="btn btn-secondary btn-sm"
                      title="O'chirish"
                      onClick={() => handleDeleteManager(m.id)}
                      style={{ padding: '6px', color: 'var(--danger)' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} color="var(--info)" />
                      <span>Telefon (Login): <strong style={{ color: 'var(--text-main)' }}>{m.phone}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Building2 size={14} color="var(--primary-color)" />
                      <span>Filiali: <strong style={{ color: 'var(--text-main)' }}>{m.branch_name || 'Bosh Filial'}</strong></span>
                    </div>
                  </div>

                  <div style={{
                    padding: '8px 12px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid var(--border-color)',
                    fontSize: '0.78rem',
                    color: 'var(--text-muted)'
                  }}>
                    Menejer o'z filialidagi o'qituvchilarning oylik foizini belgilashi va filialni boshqarishi mumkin.
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Branch Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '500px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px' }}>
              {editingBranch ? '✏️ Filial Ma\'lumotlarini Tahrirlash' : '➕ Yangi Filial Ochish'}
            </h3>

            {error && <div className="badge badge-danger" style={{ width: '100%', padding: '10px', marginBottom: '14px' }}>{error}</div>}

            <form onSubmit={handleSubmitBranch}>
              <div className="form-group">
                <label className="form-label">Filial Nomi:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="masalan: Chilonzor Filiali"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Manzil (Joylashuvi):</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="masalan: Toshkent sh., Chilonzor 9-mavze"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefon Raqami:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+998 71 123 45 67"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Filial Menejeri (Boshqaruvchi):</label>
                <select
                  className="form-control"
                  value={managerId}
                  onChange={handleManagerSelect}
                >
                  <option value="">-- Menejerni tanlang (ixtiyoriy) --</option>
                  {managers.map(m => (
                    <option key={m.id} value={m.id}>
                      👔 {m.name} ({m.phone}) - {m.branch_name || 'Menejer'}
                    </option>
                  ))}
                </select>
              </div>

              {!managerId && (
                <div className="form-group">
                  <label className="form-label">Yoki Menejer Ismini to'g'ridan-to'g'ri kiriting:</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="masalan: Sardor Aliyev"
                    value={managerName}
                    onChange={e => setManagerName(e.target.value)}
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saqlanmoqda...' : 'Saqlash'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Manager Modal */}
      {showManagerModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '480px' }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Shield size={20} color="var(--primary-color)" /> Yangi Filial Menejeri Qo'shish
            </h3>

            {mgrError && <div className="badge badge-danger" style={{ width: '100%', padding: '10px', marginBottom: '14px' }}>{mgrError}</div>}

            <form onSubmit={handleSubmitManager}>
              <div className="form-group">
                <label className="form-label">Menejer Ismi va Familiyasi:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="masalan: Jamshid Rasulov"
                  value={mgrName}
                  onChange={e => setMgrName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Telefon Raqami (Tizimga Kirish Logini):</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="+998 90 123 45 67"
                  value={mgrPhone}
                  onChange={e => setMgrPhone(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Paroli:</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Parolni kiriting (masalan: 123456)"
                  value={mgrPassword}
                  onChange={e => setMgrPassword(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Qaysi Filialga Tayinlanadi:</label>
                <select
                  className="form-control"
                  value={mgrBranchId}
                  onChange={e => setMgrBranchId(e.target.value)}
                  required
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>
                      🏢 {b.name} ({b.address || 'Manzil ko\'rsatilmagan'})
                    </option>
                  ))}
                </select>
              </div>

              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.25)',
                padding: '10px 14px',
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                marginBottom: '16px'
              }}>
                ℹ️ Ushbu menejer faqat o'zi biriktirilgan filialdagi o'qituvchilar maosh foizini belgilay oladi va boshqaradi.
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowManagerModal(false)}>
                  Bekor qilish
                </button>
                <button type="submit" className="btn btn-primary" disabled={mgrSaving}>
                  {mgrSaving ? 'Qo\'shilmoqda...' : 'Menejerni Qo\'shish'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
