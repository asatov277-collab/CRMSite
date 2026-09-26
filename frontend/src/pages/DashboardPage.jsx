import React, { useState, useEffect } from 'react';
import { 
  UserX, DollarSign, AlertCircle, Award, Users, GraduationCap, 
  UserPlus, CreditCard, Banknote, CalendarCheck, TrendingUp 
} from 'lucide-react';
import { api } from '../services/api';

export default function DashboardPage({ user, onNavigate }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardStats(user?.role || 'admin', user?.id);
      setStats(data);
    } catch (err) {
      console.error('Failed to fetch dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Dashboard yuklanmoqda...</div>;
  }

  const isAdmin = user?.role === 'admin';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Header Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79, 70, 229, 0.2), rgba(59, 130, 246, 0.1))',
        border: '1px solid var(--border-color)',
        borderRadius: 'var(--radius-xl)',
        padding: '24px 32px',
        display: 'flex',
        justify: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>
            Xush kelibsiz, {user?.name}! 👋
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', marginTop: '4px' }}>
            {isAdmin ? 'O\'quv markazining umumiy ko\'rsatkichlari va analitikasi' : 'Sizning guruhlaringiz va o\'quvchilaringiz statistikasi'}
          </p>
        </div>
        <div className="badge badge-info" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
          {new Date().toLocaleDateString('uz-UZ', { year: 'numeric', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* 8 Primary Analytics Cards */}
      <div className="grid-4">
        {/* 1. Today's Absents */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('attendance')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>BUGUN KELMAGANLAR</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--danger-bg)', color: 'var(--danger)' }}>
              <UserX size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--danger)' }}>
            {stats?.today_absents_count || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>ta</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Batafsil davomat ro'yxatida
          </div>
        </div>

        {/* 2. Monthly Revenue */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('payments')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>SHU OY TUSHGAN PUL</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--success-bg)', color: 'var(--success)' }}>
              <DollarSign size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--success)' }}>
            {(stats?.monthly_revenue || 0).toLocaleString()} <span style={{ fontSize: '0.85rem' }}>so'm</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            Naqd: {stats?.cash_percent}% | Karta: {stats?.card_percent}%
          </div>
        </div>

        {/* 3. Debtors */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('payments')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>QARZDOR O'QUVCHILAR</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'var(--warning-bg)', color: 'var(--warning)' }}>
              <AlertCircle size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--warning)' }}>
            {stats?.debtors_count || 0} <span style={{ fontSize: '1rem', fontWeight: 500 }}>ta</span>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            To'lov qilinmagan o'quvchilar
          </div>
        </div>

        {/* 4. Top Teacher */}
        <div className="card" style={{ cursor: 'pointer' }} onClick={() => onNavigate('teachers')}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>ENG YAXSHI O'QITUVCHI</span>
            <div style={{ padding: '8px', borderRadius: '10px', background: 'rgba(234, 179, 8, 0.15)', color: '#EAB308' }}>
              <Award size={20} />
            </div>
          </div>
          <div style={{ fontSize: '1.15rem', fontWeight: 800 }}>
            {stats?.top_teacher?.name || "Dilnoza Rahimova"}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '6px' }}>
            {stats?.top_teacher?.subject || "Ingliz tili"}
          </div>
        </div>
      </div>

      {/* Secondary 4 Stat Cards */}
      <div className="grid-4">
        {/* 5. Largest Group */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>ENG KATTA GURUH</span>
            <Users size={18} color="var(--primary-color)" />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>
            {stats?.largest_group?.name || "Math Intensive"}
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {stats?.largest_group?.student_count || 0} ta o'quvchi biriktirilgan
          </div>
        </div>

        {/* 6. Graduates */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>BITIRGANLAR</span>
            <GraduationCap size={18} color="var(--success)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--success)' }}>
            {stats?.graduates_count || 0} ta
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Arxivlangan o'quvchilar</div>
        </div>

        {/* 7. New Students */}
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)' }}>YANGI O'QUVCHILAR</span>
            <UserPlus size={18} color="var(--info)" />
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--info)' }}>
            +{stats?.new_students_count || 0} ta
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Shu oy ro'yxatga olingan</div>
        </div>

        {/* 8. Cash vs Card percentage breakdown bar */}
        <div className="card">
          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '8px' }}>
            TO'LOV NISBATI (NAQD vs KARTA)
          </div>
          <div style={{ display: 'flex', gap: '8px', fontSize: '0.85rem', marginBottom: '8px', fontWeight: 700 }}>
            <span style={{ color: 'var(--success)' }}>💵 {stats?.cash_percent}% Naqd</span>
            <span style={{ color: 'var(--primary-color)' }}>💳 {stats?.card_percent}% Karta</span>
          </div>
          <div style={{ height: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
            <div style={{ width: `${stats?.cash_percent}%`, background: 'var(--success)' }} />
            <div style={{ width: `${stats?.card_percent}%`, background: 'var(--primary-color)' }} />
          </div>
        </div>
      </div>

      {/* Detailed Lists Grid */}
      <div className="grid-2">
        {/* Today's Absent list with comments */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ color: 'var(--danger)' }}>
              <UserX size={18} /> Bugun Kelmagan O'quvchilar Ro'yxati
            </h3>
            <span className="badge badge-danger">{stats?.today_absents_list?.length || 0} ta</span>
          </div>
          {stats?.today_absents_list?.length > 0 ? (
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {stats.today_absents_list.map((item, idx) => (
                <div key={item.id || idx} style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(239, 68, 68, 0.08)', marginBottom: '8px', borderLeft: '4px solid var(--danger)' }}>
                  <div style={{ fontWeight: 700 }}>{item.student_name}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Guruh: {item.group_name}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--danger)', marginTop: '4px' }}>
                    💬 Izoh: <em>"{item.reason || "Sabab ko'rsatilmagan"}"</em>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              🎉 Bugun barcha o'quvchilar kelgan!
            </div>
          )}
        </div>

        {/* Debtors List */}
        <div className="card">
          <div className="card-header">
            <h3 className="card-title" style={{ color: 'var(--warning)' }}>
              <AlertCircle size={18} /> Qarzdor O'quvchilar Ro'yxati
            </h3>
            <span className="badge badge-warning">{stats?.debtors_list?.length || 0} ta</span>
          </div>
          {stats?.debtors_list?.length > 0 ? (
            <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {stats.debtors_list.map((item, idx) => (
                <div key={item.id || idx} style={{ padding: '10px', borderRadius: 'var(--radius-md)', background: 'rgba(245, 158, 11, 0.08)', marginBottom: '8px', borderLeft: '4px solid var(--warning)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>{item.student_name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Tel: {item.student_phone} | Ota-onasi: {item.parent_phone}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 800, color: 'var(--warning)' }}>{(item.amount || 450000).toLocaleString()} so'm</div>
                    <span className="badge badge-warning" style={{ fontSize: '0.7rem' }}>Qarzdor</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              ✅ Barcha to'lovlar o'z vaqtida amalga oshirilgan!
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
