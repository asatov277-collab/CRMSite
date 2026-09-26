import React, { useState, useEffect } from 'react';
import { CalendarCheck, Save, Wifi, WifiOff, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { api } from '../services/api';
import { offlineSync } from '../services/offlineSync';
import AttendanceModal from '../components/AttendanceModal';

export default function AttendancePage({ user }) {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState([]);
  const [attendanceMap, setAttendanceMap] = useState({}); // student_id -> { status, reason }
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Modal state for reason
  const [modalStudent, setModalStudent] = useState(null);
  const [modalStatus, setModalStatus] = useState('');

  useEffect(() => {
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (selectedGroupId && date) {
      loadStudentsAndAttendance();
    }
  }, [selectedGroupId, date]);

  const fetchGroups = async () => {
    try {
      const data = await api.getGroups(user?.role === 'teacher' ? user.id : null);
      setGroups(data);
      if (data.length > 0) {
        setSelectedGroupId(data[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch groups:', err);
    }
  };

  const loadStudentsAndAttendance = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const [stList, attList] = await Promise.all([
        api.getStudents(selectedGroupId, 0),
        api.getAttendance(selectedGroupId, date)
      ]);

      setStudents(stList);

      const map = {};
      // Preset default kelgan
      stList.forEach(s => {
        map[s.id] = { status: 'kelgan', reason: '' };
      });

      // Fill existing
      attList.forEach(a => {
        map[a.student_id] = { status: a.status, reason: a.reason || '' };
      });

      setAttendanceMap(map);
    } catch (err) {
      console.error('Failed to load attendance:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusClick = (student, targetStatus) => {
    if (targetStatus === 'kelgan') {
      setAttendanceMap({
        ...attendanceMap,
        [student.id]: { status: 'kelgan', reason: '' }
      });
    } else {
      // Trigger modal for reason
      setModalStudent(student);
      setModalStatus(targetStatus);
    }
  };

  const handleConfirmReason = (studentId, status, reason) => {
    setAttendanceMap({
      ...attendanceMap,
      [studentId]: { status, reason }
    });
  };

  const handleSaveAttendance = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    // Check if any absent/late lacks reason
    for (const st of students) {
      const att = attendanceMap[st.id];
      if (att && (att.status === 'kelmagan' || att.status === 'kechikkan') && !att.reason?.trim()) {
        setError(`⚠️ ${st.name} uchun izoh (sabab) yozilishi shart!`);
        setSaving(false);
        return;
      }
    }

    const payload = {
      group_id: selectedGroupId,
      teacher_id: user?.id,
      date,
      records: students.map(st => ({
        student_id: st.id,
        status: attendanceMap[st.id]?.status || 'kelgan',
        reason: attendanceMap[st.id]?.reason || ''
      }))
    };

    if (!navigator.onLine) {
      // Save to offline queue
      offlineSync.enqueueAttendance(payload);
      setMessage("⚡ Internet yo'q. Davomat lokal xotiraga saqlandi va internet qaytgach avtomatik sinxronizatsiya qilinadi!");
      setSaving(false);
      return;
    }

    try {
      await api.saveAttendanceBatch(payload);
      setMessage("✅ Davomat muvaffaqiyatli saqlandi!");
    } catch (err) {
      // Fallback offline queue
      offlineSync.enqueueAttendance(payload);
      setMessage("⚡ Serverga yuborib bo'lmadi. Davomat offline navbatga saqlandi!");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>📅 Davomat Boshqaruvi</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            3 turdagi holat: Kelgan, Kelmagan va Kechikkan (majburiy izoh bilan)
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleSaveAttendance} disabled={saving || students.length === 0}>
          <Save size={18} /> {saving ? 'Saqlanmoqda...' : 'Davomatni Saqlash'}
        </button>
      </div>

      {message && <div className="badge badge-success" style={{ width: '100%', padding: '12px' }}>{message}</div>}
      {error && <div className="badge badge-danger" style={{ width: '100%', padding: '12px' }}>{error}</div>}

      {/* Control Filters */}
      <div className="card" style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: '220px' }}>
          <label className="form-label">Guruhni Tanlang:</label>
          <select
            className="form-control"
            value={selectedGroupId}
            onChange={e => setSelectedGroupId(e.target.value)}
          >
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name} ({g.subject})</option>
            ))}
          </select>
        </div>

        <div style={{ width: '200px' }}>
          <label className="form-label">Sana (Date):</label>
          <input
            type="date"
            className="form-control"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Attendance Table */}
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
                <th>Holati (Davomat)</th>
                <th>Izoh / Sababi</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st, idx) => {
                const att = attendanceMap[st.id] || { status: 'kelgan', reason: '' };

                return (
                  <tr key={st.id}>
                    <td>{idx + 1}</td>
                    <td><strong>{st.name}</strong></td>
                    <td>{st.phone}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {/* Kelgan (Green) */}
                        <button
                          type="button"
                          className={`btn btn-sm ${att.status === 'kelgan' ? 'btn-success' : 'btn-secondary'}`}
                          onClick={() => handleStatusClick(st, 'kelgan')}
                        >
                          <CheckCircle size={14} /> Kelgan
                        </button>

                        {/* Kelmagan (Red) */}
                        <button
                          type="button"
                          className={`btn btn-sm ${att.status === 'kelmagan' ? 'btn-danger' : 'btn-secondary'}`}
                          onClick={() => handleStatusClick(st, 'kelmagan')}
                        >
                          <AlertCircle size={14} /> Kelmagan
                        </button>

                        {/* Kechikkan (Yellow) */}
                        <button
                          type="button"
                          className={`btn btn-sm ${att.status === 'kechikkan' ? 'btn-warning' : 'btn-secondary'}`}
                          onClick={() => handleStatusClick(st, 'kechikkan')}
                        >
                          <Clock size={14} /> Kechikkan
                        </button>
                      </div>
                    </td>
                    <td>
                      {att.reason ? (
                        <span style={{ fontSize: '0.85rem', color: att.status === 'kelmagan' ? 'var(--danger)' : 'var(--warning)', fontStyle: 'italic' }}>
                          💬 "{att.reason}"
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>Izohsiz</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {students.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '30px', color: 'var(--text-muted)' }}>
                    Ushbu guruhda o'quvchilar yo'q
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Mandatory Reason Modal */}
      <AttendanceModal
        isOpen={!!modalStudent}
        student={modalStudent}
        status={modalStatus}
        onConfirm={handleConfirmReason}
        onClose={() => setModalStudent(null)}
      />
    </div>
  );
}
