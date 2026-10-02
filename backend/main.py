import sys
import os
import json
import uuid
import shutil
import re
import threading
import requests
from datetime import datetime, timedelta
from typing import Optional, List

# Add backend directory to sys.path so local imports (database.py) work from anywhere
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from fastapi import FastAPI, HTTPException, Depends, UploadFile, File, Form, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from dotenv import load_dotenv
import security

import database
from database import get_db, init_db

# Ensure upload directory exists
BASE_DIR = os.path.dirname(__file__)
UPLOADS_DIR = os.path.join(BASE_DIR, "uploads")
BACKUPS_DIR = os.path.join(BASE_DIR, "backups")
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "frontend", "dist"))

os.makedirs(UPLOADS_DIR, exist_ok=True)
os.makedirs(BACKUPS_DIR, exist_ok=True)

# Initialize database on startup
load_dotenv()
init_db()

app = FastAPI(title="WESTMINSTER CRM Backend API", version="1.0.0")

# CORS setup for frontend development & network access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Serve uploaded static files & backups
app.mount("/uploads", StaticFiles(directory=UPLOADS_DIR), name="uploads")

# Mount frontend assets if built
assets_dir = os.path.join(FRONTEND_DIST_DIR, "assets")
if os.path.exists(assets_dir):
    app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

# Store OTP reset codes temporarily
OTP_STORE = {}

# ===================== TELEGRAM BOT CONFIG =====================
TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8318395303:AAGBPdtIB3_V-1yB5pBdPCd6ipqsvQZRDYw")
TELEGRAM_API_URL = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}"

def tg_send_message(chat_id: int, text: str):
    """Send message to a Telegram chat."""
    try:
        requests.post(f"{TELEGRAM_API_URL}/sendMessage", json={
            "chat_id": chat_id,
            "text": text,
            "parse_mode": "HTML"
        }, timeout=10)
    except Exception as e:
        print(f"[TG] Send error: {e}")

def tg_normalize_phone(phone: str) -> str:
    """Normalize phone: remove spaces, dashes, keep digits only, last 9 digits."""
    digits = re.sub(r'\D', '', phone)
    return digits[-9:] if len(digits) >= 9 else digits

def tg_polling_thread():
    """Background thread: polls Telegram for new messages and registers users."""
    offset = None
    print("[TG] Telegram bot polling started.")
    while True:
        try:
            params = {"timeout": 30, "allowed_updates": ["message"]}
            if offset:
                params["offset"] = offset
            resp = requests.get(f"{TELEGRAM_API_URL}/getUpdates", params=params, timeout=40)
            data = resp.json()
            if not data.get("ok"):
                import time; time.sleep(5); continue

            for update in data.get("result", []):
                offset = update["update_id"] + 1
                msg = update.get("message", {})
                if not msg:
                    continue
                chat_id = msg["chat"]["id"]
                text = (msg.get("text") or "").strip()

                # User sends their phone number to register
                # Format: /start +998901234567  OR  just the phone number
                phone_input = None
                if text.startswith("/start"):
                    parts = text.split(maxsplit=1)
                    if len(parts) > 1:
                        phone_input = parts[1].strip()
                    else:
                        tg_send_message(chat_id,
                            "👋 <b>WESTMINSTER CRM</b> botiga xush kelibsiz!\n\n"
                            "📱 Telefon raqamingizni yuboring:\n"
                            "Masalan: <code>+998901234567</code>\n\n"
                            "Shundan so'ng parol almashtirishda kod shu Telegramga keladi."
                        )
                        continue
                else:
                    # Maybe user just sent phone number
                    if re.search(r'\d{7,}', text):
                        phone_input = text

                if phone_input:
                    phone_digits = tg_normalize_phone(phone_input)
                    conn = get_db()
                    try:
                        # Find user by phone (last 9 digits)
                        rows = conn.execute("SELECT id, name, phone FROM users WHERE archived = 0 AND role != 'admin'").fetchall()
                        found = None
                        for row in rows:
                            db_digits = tg_normalize_phone(row["phone"])
                            if db_digits == phone_digits and len(phone_digits) >= 7:
                                found = dict(row)
                                break

                        if found:
                            # Save chat_id mapping
                            now_ts = datetime.now().isoformat()
                            conn.execute(
                                "INSERT OR REPLACE INTO telegram_chats (phone, chat_id, registered_at) VALUES (?, ?, ?)",
                                (phone_digits, chat_id, now_ts)
                            )
                            conn.commit()
                            tg_send_message(chat_id,
                                f"✅ <b>{found['name']}</b>, siz muvaffaqiyatli ro'yxatdan o'tdingiz!\n\n"
                                "Endi parol almashtirishda tasdiqlash kodi shu Telegramga keladi. 🔐"
                            )
                        else:
                            tg_send_message(chat_id,
                                "❌ Bu telefon raqam tizimda topilmadi.\n\n"
                                "Iltimos, CRM dagi telefon raqamingizni kiriting."
                            )
                    finally:
                        conn.close()
        except Exception as e:
            print(f"[TG] Polling error: {e}")
            import time; time.sleep(5)

# Start Telegram polling in background
_tg_thread = threading.Thread(target=tg_polling_thread, daemon=True)
_tg_thread.start()
# ===============================================================

# File size limits (in bytes)
MAX_IMAGE_SIZE = 20 * 1024 * 1024       # 20 MB
MAX_PDF_SIZE = 50 * 1024 * 1024         # 50 MB
MAX_VIDEO_SIZE = 500 * 1024 * 1024      # 500 MB

def validate_file_size_and_type(file: UploadFile):
    filename = file.filename.lower()
    content_type = file.content_type or ""
    
    # We can check size by reading header or file descriptor length
    file.file.seek(0, 2)
    file_size = file.file.tell()
    file.file.seek(0)
    
    if filename.endswith(('.png', '.jpg', '.jpeg', '.webp', '.gif')) or 'image' in content_type:
        if file_size > MAX_IMAGE_SIZE:
            raise HTTPException(status_code=400, detail=f"Rasm fayl hajmi 20MB dan oshmasligi kerak. Yuklangan: {file_size / (1024*1024):.1f}MB")
    elif filename.endswith('.pdf') or 'pdf' in content_type:
        if file_size > MAX_PDF_SIZE:
            raise HTTPException(status_code=400, detail=f"PDF fayl hajmi 50MB dan oshmasligi kerak. Yuklangan: {file_size / (1024*1024):.1f}MB")
    elif filename.endswith(('.mp4', '.mkv', '.avi', '.mov', '.webm')) or 'video' in content_type:
        if file_size > MAX_VIDEO_SIZE:
            raise HTTPException(status_code=400, detail=f"Video fayl hajmi 500MB dan oshmasligi kerak. Yuklangan: {file_size / (1024*1024):.1f}MB")
    return file_size

# Helper function to convert DB Row to dict
def dict_factory(cursor, row):
    d = {}
    for idx, col in enumerate(cursor.description):
        d[col[0]] = row[idx]
    return d

# --- AUTH ENDPOINTS ---

class LoginRequest(BaseModel):
    phone: str
    password: str
    code: Optional[str] = "lc.uz"

@app.post("/api/auth/login")
def login(req: LoginRequest):
    conn = get_db()
    cursor = conn.cursor()

    # 1. Check Center Code (Subdomain / O'quv markaz kodi)
    cursor.execute("SELECT login_code FROM system_settings WHERE id = 1")
    sys_code_row = cursor.fetchone()
    if sys_code_row and sys_code_row["login_code"]:
        expected_code = sys_code_row["login_code"].strip().lower()
        input_code = (req.code or "").strip().lower()
        if input_code != expected_code:
            conn.close()
            raise HTTPException(status_code=400, detail="O'quv markaz kodi (subdomain) noto'g'ri!")

    inp = req.phone.strip()
    inp_lower = inp.lower()

    found_user = None

    # 2. User identification:
    # If login is Westminster_lc (case-insensitive) -> Matches Admin ONLY!
    if inp_lower in ["westminster_lc", "westminster"]:
        cursor.execute("SELECT * FROM users WHERE role = 'admin' AND archived = 0")
        admin_row = cursor.fetchone()
        if admin_row:
            found_user = dict(admin_row)
    else:
        # For non-admin accounts (teachers, managers):
        # Admin can NEVER be matched by phone or anything other than Westminster_lc
        digits = re.sub(r'\D', '', inp)
        last9 = digits[-9:] if len(digits) >= 9 else digits

        cursor.execute("SELECT * FROM users WHERE role != 'admin' AND archived = 0")
        non_admin_users = [dict(r) for r in cursor.fetchall()]

        for u in non_admin_users:
            u_phone_digits = re.sub(r'\D', '', u['phone'])
            u_last9 = u_phone_digits[-9:] if len(u_phone_digits) >= 9 else u_phone_digits

            if (last9 and len(last9) >= 7 and last9 == u_last9) or inp_lower == u['phone'].strip().lower():
                found_user = u
                break

    if not found_user:
        conn.close()
        raise HTTPException(status_code=400, detail="Telefon raqam yoki login topilmadi!")

    # 3. Password Verification:
    actual_password = str(found_user['password']).strip()
    input_password = str(req.password).strip()

    if not security.verify_password(input_password, actual_password):
        conn.close()
        raise HTTPException(status_code=400, detail="Parol noto'g'ri!")
        
    # On-the-fly migration: if password is not hashed yet, hash it now and save
    if len(actual_password) != 64:
        new_hashed = security.hash_password(input_password)
        cursor.execute("UPDATE users SET password = ? WHERE id = ?", (new_hashed, found_user["id"]))
        conn.commit()

    if False:
        conn.close()
        raise HTTPException(status_code=400, detail="Parol noto'g'ri!")

    conn.close()

    del found_user["password"]
    return {
        "success": True,
        "token": f"token_{found_user['id']}_{uuid.uuid4().hex[:8]}",
        "user": found_user
    }

class ForgotPasswordRequest(BaseModel):
    phone: str

@app.post("/api/auth/forgot-password")
def forgot_password(req: ForgotPasswordRequest):
    conn = get_db()
    cursor = conn.cursor()
    phone_clean = req.phone.strip().replace(" ", "").replace("-", "")

    # Find user by phone (last 9 digits match)
    phone_digits = tg_normalize_phone(phone_clean)
    cursor.execute("SELECT id, name, phone FROM users WHERE archived = 0 AND role != 'admin'")
    all_users = cursor.fetchall()
    user = None
    for u in all_users:
        db_digits = tg_normalize_phone(u["phone"])
        if db_digits == phone_digits and len(phone_digits) >= 7:
            user = dict(u)
            break

    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Ushbu telefon raqamli foydalanuvchi topilmadi!")

    # Check if user registered Telegram bot
    tg_row = conn.execute(
        "SELECT chat_id FROM telegram_chats WHERE phone = ?", (phone_digits,)
    ).fetchone()
    conn.close()

    if not tg_row:
        raise HTTPException(
            status_code=400,
            detail="Siz hali Telegram botni ro'yxatdan o'tkazmagansiz! "
                   "Botga /start yozing va telefon raqamingizni yuboring."
        )

    otp_code = str(uuid.uuid4().int)[:6]
    OTP_STORE[phone_digits] = {
        "code": otp_code,
        "expires_at": datetime.now() + timedelta(minutes=10)
    }

    # Send OTP via Telegram
    tg_send_message(int(tg_row["chat_id"]),
        f"🔐 <b>WESTMINSTER CRM</b>\n\n"
        f"Parol tiklash kodi:\n\n"
        f"<code>{otp_code}</code>\n\n"
        f"⏳ Kod 10 daqiqa davomida amal qiladi.\n"
        f"Kodni hech kimga bermang!"
    )

    return {
        "success": True,
        "message": "Tasdiqlash kodi Telegramga yuborildi! ✅"
    }

class VerifyResetPasswordRequest(BaseModel):
    phone: str
    otp_code: str
    new_password: str

@app.post("/api/auth/verify-reset-password")
def verify_reset_password(req: VerifyResetPasswordRequest):
    phone_digits = tg_normalize_phone(req.phone.strip())

    if phone_digits not in OTP_STORE:
        raise HTTPException(status_code=400, detail="Tasdiqlash kodi so'ralmagan yoki muddati o'tgan!")

    stored_otp = OTP_STORE[phone_digits]
    if stored_otp["code"] != req.otp_code.strip():
        raise HTTPException(status_code=400, detail="Tasdiqlash kodi noto'g'ri!")

    if datetime.now() > stored_otp["expires_at"]:
        del OTP_STORE[phone_digits]
        raise HTTPException(status_code=400, detail="Kodingiz vaqti o'tib ketgan, qaytadan kiriting.")

    conn = get_db()
    cursor = conn.cursor()
    # Update password for matching user (by last 9 digits)
    cursor.execute("SELECT id, phone FROM users WHERE archived = 0 AND role != 'admin'")
    all_users = cursor.fetchall()
    updated = False
    for u in all_users:
        db_digits = tg_normalize_phone(u["phone"])
        if db_digits == phone_digits:
            cursor.execute("UPDATE users SET password = ? WHERE id = ?", (security.hash_password(req.new_password), u["id"]))
            updated = True
            break
    conn.commit()
    conn.close()

    del OTP_STORE[phone_digits]
    if not updated:
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi!")
    return {"success": True, "message": "Parolingiz muvaffaqiyatli yangilandi!"}

class ChangePasswordRequest(BaseModel):
    user_id: str
    current_password: Optional[str] = ""
    new_password: str

@app.post("/api/auth/change-password")
def change_password(req: ChangePasswordRequest):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE id = ?", (req.user_id,))
    user = cursor.fetchone()

    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi!")

    u_dict = dict(user)
    if req.current_password and not security.verify_password(req.current_password, u_dict["password"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri kiritildi!")

    cursor.execute("UPDATE users SET password = ? WHERE id = ?", (security.hash_password(req.new_password), req.user_id))
    conn.commit()
    conn.close()

    return {"success": True, "message": "Parol muvaffaqiyatli yangilandi!"}

# --- DASHBOARD ENDPOINT ---

@app.get("/api/dashboard")
def get_dashboard_stats(role: str = "admin", teacher_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()

    today = datetime.now().strftime("%Y-%m-%d")
    current_month = today[:7]

    # Filter condition if teacher
    teacher_filter = "WHERE teacher_id = ?" if (role == "teacher" and teacher_id) else ""
    teacher_params = (teacher_id,) if (role == "teacher" and teacher_id) else ()

    # 1. Today's absents
    if role == "teacher" and teacher_id:
        cursor.execute("""
            SELECT a.*, s.name as student_name, g.name as group_name
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            JOIN groups g ON a.group_id = g.id
            WHERE a.date = ? AND a.status = 'kelmagan' AND a.teacher_id = ?
        """, (today, teacher_id))
    else:
        cursor.execute("""
            SELECT a.*, s.name as student_name, g.name as group_name
            FROM attendance a
            JOIN students s ON a.student_id = s.id
            JOIN groups g ON a.group_id = g.id
            WHERE a.date = ? AND a.status = 'kelmagan'
        """, (today,))
    absents_rows = [dict(r) for r in cursor.fetchall()]

    # 2. Monthly Revenue (Cash vs Card breakdown)
    if role == "teacher" and teacher_id:
        cursor.execute("SELECT amount, method, paid FROM payments WHERE month = ? AND teacher_id = ?", (current_month, teacher_id))
    else:
        cursor.execute("SELECT amount, method, paid FROM payments WHERE month = ?", (current_month,))
    
    payments = cursor.fetchall()
    total_revenue = 0
    cash_total = 0
    card_total = 0

    for p in payments:
        if p["paid"] == 1:
            amt = p["amount"] or 0
            total_revenue += amt
            if p["method"] == "card" or p["method"] == "karta":
                card_total += amt
            else:
                cash_total += amt

    cash_percent = round((cash_total / total_revenue * 100), 1) if total_revenue > 0 else 0
    card_percent = round((card_total / total_revenue * 100), 1) if total_revenue > 0 else 0

    # 3. Debtors
    if role == "teacher" and teacher_id:
        cursor.execute("""
            SELECT p.*, s.name as student_name, s.phone as student_phone, s.parent_phone, g.name as group_name
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN groups g ON p.group_id = g.id
            WHERE p.month = ? AND p.paid = 0 AND p.teacher_id = ?
        """, (current_month, teacher_id))
    else:
        cursor.execute("""
            SELECT p.*, s.name as student_name, s.phone as student_phone, s.parent_phone, g.name as group_name
            FROM payments p
            JOIN students s ON p.student_id = s.id
            JOIN groups g ON p.group_id = g.id
            WHERE p.month = ? AND p.paid = 0
        """, (current_month,))
    debtors_rows = [dict(r) for r in cursor.fetchall()]

    # 4. Top Teacher (admin view or top rating)
    cursor.execute("""
        SELECT u.id, u.name, u.subject, COUNT(DISTINCT g.id) as group_count
        FROM users u
        LEFT JOIN groups g ON u.id = g.teacher_id
        WHERE u.role = 'teacher' AND u.archived = 0
        GROUP BY u.id
        ORDER BY group_count DESC LIMIT 1
    """)
    top_teacher_row = cursor.fetchone()
    top_teacher = dict(top_teacher_row) if top_teacher_row else None

    # 5. Largest Group
    cursor.execute("""
        SELECT id, name, subject, teacher_id FROM groups WHERE archived = 0
    """)
    all_groups = cursor.fetchall()
    largest_group = None
    max_count = -1

    for g in all_groups:
        g_id = g["id"]
        cursor.execute("SELECT count(*) FROM students WHERE group_ids LIKE ? AND archived = 0", (f'%"{g_id}"%',))
        cnt = cursor.fetchone()[0]
        if cnt > max_count:
            max_count = cnt
            largest_group = {**dict(g), "student_count": cnt}

    # 6. Graduates (Archived students count)
    cursor.execute("SELECT count(*) FROM students WHERE archived = 1")
    graduates_count = cursor.fetchone()[0]

    # 7. New Students this month
    cursor.execute("SELECT count(*) FROM students WHERE created_at LIKE ? AND archived = 0", (f"{current_month}%",))
    new_students_count = cursor.fetchone()[0]

    conn.close()

    return {
        "today_absents_count": len(absents_rows),
        "today_absents_list": absents_rows,
        "monthly_revenue": total_revenue,
        "cash_total": cash_total,
        "card_total": card_total,
        "cash_percent": cash_percent,
        "card_percent": card_percent,
        "debtors_count": len(debtors_rows),
        "debtors_list": debtors_rows,
        "top_teacher": top_teacher,
        "largest_group": largest_group,
        "graduates_count": graduates_count,
        "new_students_count": new_students_count,
    }

# --- USERS / TEACHERS ENDPOINTS ---

@app.get("/api/users")
def get_users(role_filter: Optional[str] = None, branch_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    conditions = []
    params = []

    if role_filter:
        conditions.append("role = ?")
        params.append(role_filter)

    if branch_id:
        if branch_id == "b_main":
            conditions.append("(branch_id = 'b_main' OR branch_id IS NULL OR branch_id = '')")
        else:
            conditions.append("branch_id = ?")
            params.append(branch_id)

    where_sql = f"WHERE {' AND '.join(conditions)}" if conditions else ""
    cursor.execute(f"SELECT id, role, name, phone, avatar, bg, bio, subject, certificates, salary, salary_percent, archived, branch_id FROM users {where_sql}", tuple(params))
    users = [dict(r) for r in cursor.fetchall()]

    current_month = datetime.now().strftime("%Y-%m")
    for u in users:
        uid = u["id"]
        # Default percent
        u["salary_percent"] = u.get("salary_percent") if u.get("salary_percent") is not None else 50.0

        # Calculate monthly paid revenue from this teacher's groups
        cursor.execute("""
            SELECT COALESCE(SUM(amount), 0)
            FROM payments
            WHERE teacher_id = ? AND paid = 1 AND month = ?
        """, (uid, current_month))
        collected = cursor.fetchone()[0] or 0.0
        u["monthly_revenue"] = float(collected)

        # Calculate percentage salary: collected * (percent / 100)
        u["calculated_salary"] = round(float(collected) * (float(u["salary_percent"]) / 100.0), 2)

        # Count groups
        cursor.execute("SELECT COUNT(*) FROM groups WHERE teacher_id = ? AND archived = 0", (uid,))
        u["group_count"] = cursor.fetchone()[0]

        # Count students in these groups
        cursor.execute("SELECT id FROM groups WHERE teacher_id = ? AND archived = 0", (uid,))
        t_group_ids = [r[0] for r in cursor.fetchall()]
        st_count = 0
        if t_group_ids:
            cursor.execute("SELECT group_ids FROM students WHERE archived = 0")
            for st_row in cursor.fetchall():
                try:
                    g_ids = json.loads(st_row[0] or "[]")
                    if any(gid in t_group_ids for gid in g_ids):
                        st_count += 1
                except Exception:
                    pass
        u["student_count"] = st_count

    conn.close()
    return users

class UserCreateRequest(BaseModel):
    name: str
    phone: str
    password: str
    role: str = "teacher"
    bio: Optional[str] = ""
    subject: Optional[str] = ""
    certificates: Optional[str] = ""
    salary: Optional[float] = 0
    salary_percent: Optional[float] = 50.0
    branch_id: Optional[str] = "b_main"

@app.post("/api/users")
def create_user(req: UserCreateRequest):
    conn = get_db()
    cursor = conn.cursor()

    uid = f"user_{uuid.uuid4().hex[:8]}"
    try:
        cursor.execute("""
            INSERT INTO users (id, role, name, phone, password, bio, subject, certificates, salary, salary_percent, archived, branch_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        """, (uid, req.role, req.name, req.phone, security.hash_password(req.password), req.bio, req.subject, req.certificates, req.salary, req.salary_percent or 50.0, req.branch_id or "b_main"))
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Ushbu telefon raqamli o'qituvchi allaqachon mavjud!")
    
    conn.close()
    return {"success": True, "id": uid, "message": "O'qituvchi muvaffaqiyatli qo'shildi!"}

class UserAdminEditRequest(BaseModel):
    name: str
    phone: str
    password: Optional[str] = None
    subject: Optional[str] = ""
    salary_percent: Optional[float] = 50.0
    branch_id: Optional[str] = "b_main"
    editor_role: Optional[str] = "admin"
    editor_branch_id: Optional[str] = None

@app.put("/api/users/{user_id}/admin-edit")
def admin_edit_user(user_id: str, req: UserAdminEditRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    target = cursor.fetchone()
    if not target:
        conn.close()
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    # Permission check for salary_percent:
    # Admin can edit any teacher in any branch.
    # Branch manager can only edit teachers in their assigned branch.
    if req.editor_role != "admin":
        if target["branch_id"] != req.editor_branch_id:
            conn.close()
            raise HTTPException(status_code=403, detail="Siz faqat o'z filialingizdagi o'qituvchini tahrirlay olasiz!")

    # Check phone uniqueness if changed
    if req.phone != target["phone"]:
        cursor.execute("SELECT id FROM users WHERE phone = ? AND id != ?", (req.phone, user_id))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="Ushbu telefon raqamli foydalanuvchi allaqachon mavjud!")

    if req.password and req.password.strip():
        cursor.execute("""
            UPDATE users
            SET name = ?, phone = ?, password = ?, subject = ?, salary_percent = ?, branch_id = ?
            WHERE id = ?
        """, (req.name, req.phone, security.hash_password(req.password.strip()), req.subject, req.salary_percent or 50.0, req.branch_id or "b_main", user_id))
    else:
        cursor.execute("""
            UPDATE users
            SET name = ?, phone = ?, subject = ?, salary_percent = ?, branch_id = ?
            WHERE id = ?
        """, (req.name, req.phone, req.subject, req.salary_percent or 50.0, req.branch_id or "b_main", user_id))

    conn.commit()
    cursor.execute("SELECT id, role, name, phone, avatar, bg, bio, subject, certificates, salary, salary_percent, archived, branch_id FROM users WHERE id = ?", (user_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return updated

# --- MANAGERS (FILIAL MENEJERLARI) ENDPOINTS ---

class ManagerCreateRequest(BaseModel):
    name: str
    phone: str
    password: str
    branch_id: str

@app.get("/api/managers")
def get_managers(branch_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    if branch_id:
        cursor.execute("""
            SELECT u.id, u.role, u.name, u.phone, u.branch_id, b.name as branch_name
            FROM users u
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE u.role = 'manager' AND u.archived = 0 AND u.branch_id = ?
            ORDER BY u.name ASC
        """, (branch_id,))
    else:
        cursor.execute("""
            SELECT u.id, u.role, u.name, u.phone, u.branch_id, b.name as branch_name
            FROM users u
            LEFT JOIN branches b ON u.branch_id = b.id
            WHERE u.role = 'manager' AND u.archived = 0
            ORDER BY u.name ASC
        """)
    managers = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return managers

@app.post("/api/managers")
def create_manager(req: ManagerCreateRequest):
    conn = get_db()
    cursor = conn.cursor()

    uid = f"mgr_{uuid.uuid4().hex[:8]}"
    try:
        cursor.execute("""
            INSERT INTO users (id, role, name, phone, password, bio, subject, certificates, salary, salary_percent, archived, branch_id)
            VALUES (?, 'manager', ?, ?, ?, '', 'Filial Menejeri', '', 0, 0, 0, ?)
        """, (uid, req.name, req.phone, security.hash_password(req.password), req.branch_id))

        # Update branch manager_id and manager_name
        cursor.execute("""
            UPDATE branches
            SET manager_id = ?, manager_name = ?
            WHERE id = ?
        """, (uid, req.name, req.branch_id))

        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        raise HTTPException(status_code=400, detail="Ushbu telefon raqamli menejer allaqachon mavjud!")

    cursor.execute("SELECT id, role, name, phone, branch_id FROM users WHERE id = ?", (uid,))
    new_m = dict(cursor.fetchone())
    conn.close()
    return new_m

@app.delete("/api/managers/{manager_id}")
def delete_manager(manager_id: str):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM users WHERE id = ? AND role = 'manager'", (manager_id,))
    cursor.execute("UPDATE branches SET manager_id = '', manager_name = 'Tayinlanmagan' WHERE manager_id = ?", (manager_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Menejer o'chirildi"}

@app.put("/api/users/{user_id}")
def update_user_profile(
    user_id: str,
    name: Optional[str] = Form(None),
    bio: Optional[str] = Form(None),
    subject: Optional[str] = Form(None),
    certificates: Optional[str] = Form(None),
    avatar_file: Optional[UploadFile] = File(None),
    bg_file: Optional[UploadFile] = File(None)
):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
    user = cursor.fetchone()
    if not user:
        conn.close()
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    avatar_path = user["avatar"]
    bg_path = user["bg"]

    if avatar_file:
        validate_file_size_and_type(avatar_file)
        ext = os.path.splitext(avatar_file.filename)[1]
        fn = f"avatar_{user_id}_{uuid.uuid4().hex[:6]}{ext}"
        fp = os.path.join(UPLOADS_DIR, fn)
        with open(fp, "wb") as buffer:
            shutil.copyfileobj(avatar_file.file, buffer)
        avatar_path = f"/uploads/{fn}"

    if bg_file:
        validate_file_size_and_type(bg_file)
        ext = os.path.splitext(bg_file.filename)[1]
        fn = f"bg_{user_id}_{uuid.uuid4().hex[:6]}{ext}"
        fp = os.path.join(UPLOADS_DIR, fn)
        with open(fp, "wb") as buffer:
            shutil.copyfileobj(bg_file.file, buffer)
        bg_path = f"/uploads/{fn}"

    new_name = name if name is not None else user["name"]
    new_bio = bio if bio is not None else user["bio"]
    new_subject = subject if subject is not None else user["subject"]
    new_certs = certificates if certificates is not None else user["certificates"]

    cursor.execute("""
        UPDATE users
        SET name = ?, bio = ?, subject = ?, certificates = ?, avatar = ?, bg = ?
        WHERE id = ?
    """, (new_name, new_bio, new_subject, new_certs, avatar_path, bg_path, user_id))
    conn.commit()

    cursor.execute("SELECT id, role, name, phone, avatar, bg, bio, subject, certificates, salary, archived FROM users WHERE id = ?", (user_id,))
    updated_user = dict(cursor.fetchone())
    conn.close()

    return {"success": True, "user": updated_user}

class TeacherOffboardRequest(BaseModel):
    new_teacher_id: Optional[str] = None
    archive_action: str = "reassign" # reassign or archive

@app.post("/api/teachers/{teacher_id}/offboard")
def offboard_teacher(teacher_id: str, req: TeacherOffboardRequest):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM users WHERE id = ? AND role = 'teacher'", (teacher_id,))
    t_user = cursor.fetchone()
    if not t_user:
        conn.close()
        raise HTTPException(status_code=404, detail="O'qituvchi topilmadi")

    # Mark teacher archived = 1
    cursor.execute("UPDATE users SET archived = 1 WHERE id = ?", (teacher_id,))

    # Find teacher's active groups
    cursor.execute("SELECT id FROM groups WHERE teacher_id = ? AND archived = 0", (teacher_id,))
    groups = cursor.fetchall()
    group_ids = [g["id"] for g in groups]

    if req.archive_action == "reassign" and req.new_teacher_id:
        # Re-assign groups to new teacher
        cursor.execute("UPDATE groups SET teacher_id = ? WHERE teacher_id = ?", (req.new_teacher_id, teacher_id))
        conn.commit()
        conn.close()
        return {"success": True, "message": "O'qituvchi bo'shatildi va barcha guruhlari hamda o'quvchilari yangi o'qituvchiga biriktirildi!"}
    else:
        # Archive all groups of this teacher
        cursor.execute("UPDATE groups SET archived = 1 WHERE teacher_id = ?", (teacher_id,))
        
        # Archive all students in those groups
        for gid in group_ids:
            cursor.execute("SELECT id FROM students WHERE group_ids LIKE ? AND archived = 0", (f'%"{gid}"%',))
            st_list = cursor.fetchall()
            for st in st_list:
                cursor.execute("UPDATE students SET archived = 1 WHERE id = ?", (st["id"],))

        conn.commit()
        conn.close()
        return {"success": True, "message": "O'qituvchi va uning guruhlari Arxivga o'tkazildi (Barcha tarix va to'lovlar saqlanib qoldi)!"}

# --- GROUPS ENDPOINTS ---

@app.get("/api/groups")
def get_groups(teacher_id: Optional[str] = None, branch_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()

    params = []
    where_clauses = ["g.archived = 0"]

    if teacher_id:
        where_clauses.append("g.teacher_id = ?")
        params.append(teacher_id)

    if branch_id:
        if branch_id == "b_main":
            where_clauses.append("(g.branch_id = 'b_main' OR g.branch_id IS NULL OR g.branch_id = '')")
        else:
            where_clauses.append("g.branch_id = ?")
            params.append(branch_id)

    where_sql = " AND ".join(where_clauses)
    query = f"""
        SELECT g.*, u.name as teacher_name
        FROM groups g
        JOIN users u ON g.teacher_id = u.id
        WHERE {where_sql}
    """
    cursor.execute(query, tuple(params))
    groups = [dict(r) for r in cursor.fetchall()]

    for g in groups:
        g_id = g["id"]
        cursor.execute("SELECT count(*) FROM students WHERE group_ids LIKE ? AND archived = 0", (f'%"{g_id}"%',))
        g["student_count"] = cursor.fetchone()[0]

    conn.close()
    return groups

class GroupCreateRequest(BaseModel):
    name: str
    subject: str
    teacher_id: str
    schedule: Optional[str] = ""
    room: Optional[str] = ""
    price: Optional[float] = 0
    branch_id: Optional[str] = "b_main"

@app.post("/api/groups")
def create_group(req: GroupCreateRequest):
    conn = get_db()
    cursor = conn.cursor()

    gid = f"g_{uuid.uuid4().hex[:8]}"
    cursor.execute("""
        INSERT INTO groups (id, name, subject, teacher_id, schedule, room, price, archived, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
    """, (gid, req.name, req.subject, req.teacher_id, req.schedule, req.room, req.price, req.branch_id or "b_main"))
    conn.commit()
    conn.close()

    return {"success": True, "id": gid, "message": "Guruh yaratildi!"}

@app.delete("/api/groups/cleanup/uncollected")
def delete_uncollected_groups(user_id: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, role FROM users WHERE id = ?", (user_id,))
    usr = cursor.fetchone()
    if not usr:
        conn.close()
        raise HTTPException(status_code=404, detail="Foydalanuvchi topilmadi")

    if usr["role"] == "admin":
        cursor.execute("SELECT id, name FROM groups WHERE archived = 0")
    else:
        cursor.execute("SELECT id, name FROM groups WHERE teacher_id = ? AND archived = 0", (user_id,))

    all_groups = cursor.fetchall()
    deleted_count = 0
    deleted_names = []

    for g in all_groups:
        gid = g["id"]
        cursor.execute("SELECT count(*) FROM students WHERE group_ids LIKE ? AND archived = 0", (f'%"{gid}"%',))
        cnt = cursor.fetchone()[0]
        if cnt == 0:
            cursor.execute("DELETE FROM groups WHERE id = ?", (gid,))
            cursor.execute("DELETE FROM attendance WHERE group_id = ?", (gid,))
            cursor.execute("DELETE FROM payments WHERE group_id = ?", (gid,))
            deleted_count += 1
            deleted_names.append(g["name"])

    conn.commit()
    conn.close()

    if deleted_count == 0:
        return {"success": True, "deleted_count": 0, "message": "Yig'ilmagan (o'quvchisiz) guruhlar topilmadi."}

    return {
        "success": True,
        "deleted_count": deleted_count,
        "message": f"{deleted_count} ta yig'ilmagan guruh muvaffaqiyatli o'chirildi ({', '.join(deleted_names)})!"
    }

@app.delete("/api/groups/{group_id}")
def delete_group(group_id: str, user_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT id, teacher_id, name FROM groups WHERE id = ?", (group_id,))
    g = cursor.fetchone()
    if not g:
        conn.close()
        raise HTTPException(status_code=404, detail="Guruh topilmadi")

    if user_id:
        cursor.execute("SELECT id, role FROM users WHERE id = ?", (user_id,))
        usr = cursor.fetchone()
        if usr:
            if usr["role"] != "admin" and g["teacher_id"] != user_id:
                conn.close()
                raise HTTPException(status_code=403, detail="Siz faqat o'zingizning guruhlaringizni o'chira olasiz!")

    cursor.execute("DELETE FROM groups WHERE id = ?", (group_id,))
    cursor.execute("DELETE FROM attendance WHERE group_id = ?", (group_id,))
    cursor.execute("DELETE FROM payments WHERE group_id = ?", (group_id,))

    cursor.execute("SELECT id, group_ids FROM students WHERE group_ids LIKE ?", (f'%"{group_id}"%',))
    students = cursor.fetchall()
    for st in students:
        s_id = st["id"]
        try:
            g_ids = json.loads(st["group_ids"] or "[]")
        except Exception:
            g_ids = []
        if group_id in g_ids:
            g_ids.remove(group_id)
            cursor.execute("UPDATE students SET group_ids = ? WHERE id = ?", (json.dumps(g_ids), s_id))

    conn.commit()
    conn.close()

    return {"success": True, "message": f"'{g['name']}' guruhi muvaffaqiyatli o'chirildi!"}

# --- STUDENTS ENDPOINTS ---

@app.get("/api/students")
def get_students(group_id: Optional[str] = None, teacher_id: Optional[str] = None, branch_id: Optional[str] = None, archived: int = 0):
    conn = get_db()
    cursor = conn.cursor()

    teacher_group_ids = []
    if teacher_id:
        cursor.execute("SELECT id FROM groups WHERE teacher_id = ? AND archived = 0", (teacher_id,))
        teacher_group_ids = [r[0] for r in cursor.fetchall()]
        if not teacher_group_ids and not group_id:
            conn.close()
            return []

    conditions = ["archived = ?"]
    params = [archived]

    if group_id:
        conditions.append("group_ids LIKE ?")
        params.append(f'%"{group_id}"%')

    if branch_id:
        if branch_id == "b_main":
            conditions.append("(branch_id = 'b_main' OR branch_id IS NULL OR branch_id = '')")
        else:
            conditions.append("branch_id = ?")
            params.append(branch_id)

    sql = f"SELECT * FROM students WHERE {' AND '.join(conditions)}"
    cursor.execute(sql, tuple(params))
    
    rows = cursor.fetchall()
    students = []
    for r in rows:
        d = dict(r)
        g_ids = json.loads(d["group_ids"] or "[]")
        d["group_ids"] = g_ids

        if teacher_id:
            # Check if student belongs to any of this teacher's groups
            if any(gid in teacher_group_ids for gid in g_ids):
                students.append(d)
        else:
            students.append(d)

    conn.close()
    return students

class StudentCreateRequest(BaseModel):
    name: str
    phone: str
    parent_phone: str
    group_ids: List[str]
    branch_id: Optional[str] = "b_main"

@app.post("/api/students")
def create_student(req: StudentCreateRequest):
    conn = get_db()
    cursor = conn.cursor()

    sid = f"s_{uuid.uuid4().hex[:8]}"
    today = datetime.now().strftime("%Y-%m-%d")
    groups_json = json.dumps(req.group_ids)

    cursor.execute("""
        INSERT INTO students (id, name, phone, parent_phone, group_ids, archived, created_at, branch_id)
        VALUES (?, ?, ?, ?, ?, 0, ?, ?)
    """, (sid, req.name, req.phone, req.parent_phone, groups_json, today, req.branch_id or "b_main"))
    conn.commit()
    conn.close()

    return {"success": True, "id": sid, "message": "O'quvchi qo'shildi!"}

@app.put("/api/students/{student_id}/archive")
def archive_student(student_id: str, archive: bool = True):
    conn = get_db()
    cursor = conn.cursor()
    val = 1 if archive else 0
    cursor.execute("UPDATE students SET archived = ? WHERE id = ?", (val, student_id))
    conn.commit()
    conn.close()

    msg = "O'quvchi Arxivga o'tkazildi (Tarixi saqlandi)" if archive else "O'quvchi Arxivdan qaytarildi"
    return {"success": True, "message": msg}

class TransferStudentRequest(BaseModel):
    from_group_id: str
    to_group_id: str

@app.post("/api/students/{student_id}/transfer")
def transfer_student(student_id: str, req: TransferStudentRequest):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("SELECT * FROM students WHERE id = ?", (student_id,))
    st = cursor.fetchone()
    if not st:
        conn.close()
        raise HTTPException(status_code=404, detail="O'quvchi topilmadi")

    group_ids = json.loads(st["group_ids"] or "[]")
    if req.from_group_id in group_ids:
        group_ids.remove(req.from_group_id)
    if req.to_group_id not in group_ids:
        group_ids.append(req.to_group_id)

    cursor.execute("UPDATE students SET group_ids = ? WHERE id = ?", (json.dumps(group_ids), student_id))
    conn.commit()
    conn.close()

    return {"success": True, "message": "O'quvchi yangi guruhga o'tkazildi va ma'lumotlari bo'lindi!"}

# --- ATTENDANCE ENDPOINTS ---

@app.get("/api/attendance")
def get_attendance(group_id: str, date: str):
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT a.*, s.name as student_name
        FROM attendance a
        JOIN students s ON a.student_id = s.id
        WHERE a.group_id = ? AND a.date = ?
    """, (group_id, date))

    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

class AttendanceItem(BaseModel):
    student_id: str
    status: str # kelgan / kelmagan / kechikkan
    reason: Optional[str] = ""

class AttendanceSaveBatchRequest(BaseModel):
    group_id: str
    teacher_id: str
    date: str
    records: List[AttendanceItem]

@app.post("/api/attendance/batch")
def save_attendance_batch(req: AttendanceSaveBatchRequest):
    conn = get_db()
    cursor = conn.cursor()

    for item in req.records:
        if item.status in ["kelmagan", "kechikkan"] and not item.reason:
            conn.close()
            raise HTTPException(status_code=400, detail="Kelmagan yoki kechikkan o'quvchi uchun izoh (sabab) yozilishi shart!")

        # Check existing
        cursor.execute("SELECT id FROM attendance WHERE student_id = ? AND group_id = ? AND date = ?", (item.student_id, req.group_id, req.date))
        ex = cursor.fetchone()

        if ex:
            cursor.execute("""
                UPDATE attendance SET status = ?, reason = ?, teacher_id = ? WHERE id = ?
            """, (item.status, item.reason, req.teacher_id, ex["id"]))
        else:
            att_id = f"att_{uuid.uuid4().hex[:8]}"
            cursor.execute("""
                INSERT INTO attendance (id, student_id, group_id, teacher_id, date, status, reason)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (att_id, item.student_id, req.group_id, req.teacher_id, req.date, item.status, item.reason))

    conn.commit()
    conn.close()
    return {"success": True, "message": "Davomat saqlandi!"}

# --- PAYMENTS ENDPOINTS ---

@app.get("/api/payments")
def get_payments(month: str, group_id: Optional[str] = None, teacher_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()

    query = """
        SELECT p.*, s.name as student_name, s.phone as student_phone, s.parent_phone, g.name as group_name
        FROM payments p
        JOIN students s ON p.student_id = s.id
        JOIN groups g ON p.group_id = g.id
        WHERE p.month = ?
    """
    params = [month]

    if group_id:
        query += " AND p.group_id = ?"
        params.append(group_id)
    if teacher_id:
        query += " AND p.teacher_id = ?"
        params.append(teacher_id)

    cursor.execute(query, params)
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/payments/record")
def record_payment(
    student_id: str = Form(...),
    group_id: str = Form(...),
    teacher_id: str = Form(...),
    month: str = Form(...),
    amount: float = Form(...),
    method: str = Form(...), # naqd / karta
    paid: int = Form(...), # 1 / 0
    notes: Optional[str] = Form(""),
    receipt_file: Optional[UploadFile] = File(None)
):
    conn = get_db()
    cursor = conn.cursor()

    receipt_path = ""
    if receipt_file:
        validate_file_size_and_type(receipt_file)
        ext = os.path.splitext(receipt_file.filename)[1]
        fn = f"receipt_{student_id}_{uuid.uuid4().hex[:6]}{ext}"
        fp = os.path.join(UPLOADS_DIR, fn)
        with open(fp, "wb") as buffer:
            shutil.copyfileobj(receipt_file.file, buffer)
        receipt_path = f"/uploads/{fn}"

    cursor.execute("SELECT id FROM payments WHERE student_id = ? AND group_id = ? AND month = ?", (student_id, group_id, month))
    ex = cursor.fetchone()

    today = datetime.now().strftime("%Y-%m-%d")

    if ex:
        p_id = ex["id"]
        query = "UPDATE payments SET amount = ?, method = ?, paid = ?, notes = ?, date = ?"
        params = [amount, method, paid, notes, today]
        if receipt_path:
            query += ", receipt_file = ?"
            params.append(receipt_path)
        query += " WHERE id = ?"
        params.append(p_id)
        cursor.execute(query, params)
    else:
        p_id = f"pay_{uuid.uuid4().hex[:8]}"
        cursor.execute("""
            INSERT INTO payments (id, student_id, group_id, teacher_id, month, amount, method, receipt_file, paid, date, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (p_id, student_id, group_id, teacher_id, month, amount, method, receipt_path, paid, today, notes))

    conn.commit()
    conn.close()
    return {"success": True, "message": "To'lov ma'lumotlari saqlandi!"}

@app.get("/api/payments/share-report")
def generate_payment_share_report(month: str, group_id: Optional[str] = None, teacher_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()

    # Get Center Info
    cursor.execute("SELECT * FROM system_settings WHERE id = 1")
    settings = dict(cursor.fetchone())

    query = """
        SELECT p.*, s.name as student_name, s.phone as student_phone, g.name as group_name, u.name as teacher_name
        FROM payments p
        JOIN students s ON p.student_id = s.id
        JOIN groups g ON p.group_id = g.id
        JOIN users u ON p.teacher_id = u.id
        WHERE p.month = ?
    """
    params = [month]
    if group_id:
        query += " AND p.group_id = ?"
        params.append(group_id)
    if teacher_id:
        query += " AND p.teacher_id = ?"
        params.append(teacher_id)

    cursor.execute(query, params)
    records = [dict(r) for r in cursor.fetchall()]
    conn.close()

    total_students = len(records)
    paid_count = sum(1 for r in records if r["paid"] == 1)
    unpaid_count = total_students - paid_count

    cash_amount = sum(r["amount"] for r in records if r["paid"] == 1 and r["method"] in ["naqd", "cash"])
    card_amount = sum(r["amount"] for r in records if r["paid"] == 1 and r["method"] in ["karta", "card"])
    total_collected = cash_amount + card_amount

    return {
        "month": month,
        "center_name": settings["name"],
        "currency": settings["currency"],
        "total_students": total_students,
        "paid_count": paid_count,
        "unpaid_count": unpaid_count,
        "cash_amount": cash_amount,
        "card_amount": card_amount,
        "total_collected": total_collected,
        "cash_percentage": round((cash_amount / total_collected * 100), 1) if total_collected > 0 else 0,
        "card_percentage": round((card_amount / total_collected * 100), 1) if total_collected > 0 else 0,
        "records": records
    }

# --- CHAT ENDPOINTS ---

@app.get("/api/chat")
def get_chat_messages(branch_id: Optional[str] = None, limit: int = 100):
    conn = get_db()
    cursor = conn.cursor()
    if branch_id:
        cursor.execute("""
            SELECT * FROM chat_messages 
            WHERE branch_id = ? OR (branch_id IS NULL AND ? = 'b_main')
            ORDER BY timestamp ASC LIMIT ?
        """, (branch_id, branch_id, limit))
    else:
        cursor.execute("SELECT * FROM chat_messages ORDER BY timestamp ASC LIMIT ?", (limit,))
    msgs = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return msgs

@app.post("/api/chat")
def send_chat_message(
    sender_id: str = Form(...),
    sender_name: str = Form(...),
    text: Optional[str] = Form(""),
    branch_id: Optional[str] = Form("b_main"),
    image_file: Optional[UploadFile] = File(None)
):
    conn = get_db()
    cursor = conn.cursor()

    img_path = ""
    if image_file and image_file.filename:
        validate_file_size_and_type(image_file)
        ext = os.path.splitext(image_file.filename)[1]
        fn = f"chat_{uuid.uuid4().hex[:8]}{ext}"
        fp = os.path.join(UPLOADS_DIR, fn)
        with open(fp, "wb") as buffer:
            shutil.copyfileobj(image_file.file, buffer)
        img_path = f"/uploads/{fn}"

    msg_id = f"msg_{uuid.uuid4().hex[:8]}"
    ts = datetime.now().isoformat()

    cursor.execute("""
        INSERT INTO chat_messages (id, sender_id, sender_name, text, image_file, timestamp, branch_id)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (msg_id, sender_id, sender_name, text or "", img_path, ts, branch_id or "b_main"))
    conn.commit()

    cursor.execute("SELECT * FROM chat_messages WHERE id = ?", (msg_id,))
    msg = dict(cursor.fetchone())
    conn.close()
    return msg

@app.delete("/api/chat/{message_id}")
def delete_chat_message(message_id: str, user_id: str = Query(...), role: str = Query(...)):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM chat_messages WHERE id = ?", (message_id,))
    row = cursor.fetchone()
    if not row:
        conn.close()
        raise HTTPException(status_code=404, detail="Xabar topilmadi")

    msg = dict(row)
    if role != "admin" and msg["sender_id"] != user_id:
        conn.close()
        raise HTTPException(status_code=403, detail="Siz faqat o'zingiz yozgan xabarni o'chira olasiz!")

    cursor.execute("DELETE FROM chat_messages WHERE id = ?", (message_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Xabar muvaffaqiyatli o'chirildi"}


# --- COURSE MATERIALS ENDPOINTS ---

@app.get("/api/materials")
def get_materials(teacher_id: Optional[str] = None):
    conn = get_db()
    cursor = conn.cursor()
    if teacher_id:
        cursor.execute("SELECT m.*, u.name as teacher_name FROM materials m JOIN users u ON m.teacher_id = u.id WHERE m.teacher_id = ? ORDER BY created_at DESC", (teacher_id,))
    else:
        cursor.execute("SELECT m.*, u.name as teacher_name FROM materials m JOIN users u ON m.teacher_id = u.id ORDER BY created_at DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.post("/api/materials")
def upload_material(
    teacher_id: str = Form(...),
    title: str = Form(...),
    description: Optional[str] = Form(""),
    file: UploadFile = File(...)
):
    validate_file_size_and_type(file)
    ext = os.path.splitext(file.filename)[1].lower()
    fn = f"mat_{uuid.uuid4().hex[:8]}{ext}"
    fp = os.path.join(UPLOADS_DIR, fn)
    with open(fp, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    file_url = f"/uploads/{fn}"
    
    if ext in ['.png', '.jpg', '.jpeg', '.webp']:
        file_type = 'image'
    elif ext == '.pdf':
        file_type = 'pdf'
    elif ext in ['.mp4', '.mkv', '.avi', '.webm']:
        file_type = 'video'
    else:
        file_type = 'doc'

    mat_id = f"mat_{uuid.uuid4().hex[:8]}"
    today = datetime.now().strftime("%Y-%m-%d %H:%M")

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO materials (id, teacher_id, title, description, file_url, file_type, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (mat_id, teacher_id, title, description or "", file_url, file_type, today))
    conn.commit()
    conn.close()

    return {"success": True, "id": mat_id, "message": "Darslik yuklandi!"}

# --- SYSTEM SETTINGS ENDPOINTS ---

@app.get("/api/settings")
def get_settings():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM system_settings WHERE id = 1")
    row = cursor.fetchone()
    conn.close()
    return dict(row)

@app.put("/api/settings")
def update_settings(
    name: Optional[str] = Form(None),
    login_code: Optional[str] = Form(None),
    phone: Optional[str] = Form(None),
    address: Optional[str] = Form(None),
    currency: Optional[str] = Form(None),
    timezone: Optional[str] = Form(None),
    theme_color: Optional[str] = Form(None),
    bg_color: Optional[str] = Form(None),
    logo_file: Optional[UploadFile] = File(None)
):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM system_settings WHERE id = 1")
    current = dict(cursor.fetchone())

    logo_url = current.get("logo_url", "")
    if logo_file and logo_file.filename:
        validate_file_size_and_type(logo_file)
        ext = os.path.splitext(logo_file.filename)[1]
        fn = f"logo_{uuid.uuid4().hex[:6]}{ext}"
        fp = os.path.join(UPLOADS_DIR, fn)
        with open(fp, "wb") as buffer:
            shutil.copyfileobj(logo_file.file, buffer)
        logo_url = f"/uploads/{fn}"

    cursor.execute("""
        UPDATE system_settings
        SET name = ?, login_code = ?, phone = ?, address = ?, currency = ?, timezone = ?, theme_color = ?, bg_color = ?, logo_url = ?
        WHERE id = 1
    """, (
        name if name is not None else current["name"],
        login_code if login_code is not None else current["login_code"],
        phone if phone is not None else current["phone"],
        address if address is not None else current["address"],
        currency if currency is not None else current["currency"],
        timezone if timezone is not None else current["timezone"],
        theme_color if theme_color is not None else current.get("theme_color", "#4F46E5"),
        bg_color if bg_color is not None else current.get("bg_color", "#0B0F17"),
        logo_url
    ))
    conn.commit()

    cursor.execute("SELECT * FROM system_settings WHERE id = 1")
    updated = dict(cursor.fetchone())
    conn.close()

    return {"success": True, "message": "Tizim sozlamalari yangilandi!", "settings": updated}

# --- BRANCHES (FILIALLAR) ENDPOINTS ---

class BranchCreateRequest(BaseModel):
    name: str
    address: Optional[str] = ""
    phone: Optional[str] = ""
    manager_id: Optional[str] = ""
    manager_name: Optional[str] = ""

@app.get("/api/branches")
def get_branches():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM branches ORDER BY created_at ASC")
    branches = [dict(r) for r in cursor.fetchall()]

    enriched = []
    for b in branches:
        bid = b["id"]
        # Count students
        if bid == "b_main":
            cursor.execute("SELECT COUNT(*) FROM students WHERE (branch_id = 'b_main' OR branch_id IS NULL OR branch_id = '') AND archived = 0")
        else:
            cursor.execute("SELECT COUNT(*) FROM students WHERE branch_id = ? AND archived = 0", (bid,))
        b["student_count"] = cursor.fetchone()[0]

        # Count groups
        if bid == "b_main":
            cursor.execute("SELECT COUNT(*) FROM groups WHERE (branch_id = 'b_main' OR branch_id IS NULL OR branch_id = '') AND archived = 0")
        else:
            cursor.execute("SELECT COUNT(*) FROM groups WHERE branch_id = ? AND archived = 0", (bid,))
        b["group_count"] = cursor.fetchone()[0]

        # Count teachers
        if bid == "b_main":
            cursor.execute("SELECT COUNT(*) FROM users WHERE (branch_id = 'b_main' OR branch_id IS NULL OR branch_id = '') AND role = 'teacher' AND archived = 0")
        else:
            cursor.execute("SELECT COUNT(*) FROM users WHERE branch_id = ? AND role = 'teacher' AND archived = 0", (bid,))
        b["teacher_count"] = cursor.fetchone()[0]

        enriched.append(b)

    conn.close()
    return enriched

@app.post("/api/branches")
def create_branch(req: BranchCreateRequest):
    conn = get_db()
    cursor = conn.cursor()
    b_id = f"b_{uuid.uuid4().hex[:6]}"
    ts = datetime.now().isoformat()
    cursor.execute("""
        INSERT INTO branches (id, name, address, phone, manager_id, manager_name, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
    """, (b_id, req.name, req.address or "", req.phone or "", req.manager_id or "", req.manager_name or "", ts))
    conn.commit()

    cursor.execute("SELECT * FROM branches WHERE id = ?", (b_id,))
    new_b = dict(cursor.fetchone())
    conn.close()
    return new_b

@app.put("/api/branches/{branch_id}")
def update_branch(branch_id: str, req: BranchCreateRequest):
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE branches
        SET name = ?, address = ?, phone = ?, manager_id = ?, manager_name = ?
        WHERE id = ?
    """, (req.name, req.address or "", req.phone or "", req.manager_id or "", req.manager_name or "", branch_id))
    conn.commit()

    cursor.execute("SELECT * FROM branches WHERE id = ?", (branch_id,))
    updated = dict(cursor.fetchone())
    conn.close()
    return updated

@app.delete("/api/branches/{branch_id}")
def delete_branch(branch_id: str):
    if branch_id == "b_main":
        raise HTTPException(status_code=400, detail="Bosh filialni o'chirib bo'lmaydi!")
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM branches WHERE id = ?", (branch_id,))
    conn.commit()
    conn.close()
    return {"success": True, "message": "Filial o'chirildi"}


# --- GLOBAL SEARCH ENDPOINT ---

@app.get("/api/search")
def global_search(q: str = Query(..., min_length=1)):
    conn = get_db()
    cursor = conn.cursor()
    query_str = f"%{q}%"

    # Search Students
    cursor.execute("SELECT id, name, phone, parent_phone FROM students WHERE name LIKE ? OR phone LIKE ? OR parent_phone LIKE ?", (query_str, query_str, query_str))
    students = [dict(r) for r in cursor.fetchall()]

    # Search Groups
    cursor.execute("SELECT id, name, subject, schedule FROM groups WHERE name LIKE ? OR subject LIKE ?", (query_str, query_str))
    groups = [dict(r) for r in cursor.fetchall()]

    # Search Teachers
    cursor.execute("SELECT id, name, phone, subject FROM users WHERE (name LIKE ? OR phone LIKE ? OR subject LIKE ?) AND role = 'teacher'", (query_str, query_str, query_str))
    teachers = [dict(r) for r in cursor.fetchall()]

    conn.close()
    return {
        "query": q,
        "students": students,
        "groups": groups,
        "teachers": teachers
    }

# --- BACKUP ENDPOINTS ---

@app.post("/api/backup/create")
def create_backup():
    conn = get_db()
    cursor = conn.cursor()

    tables = ["users", "groups", "students", "attendance", "payments", "chat_messages", "materials", "system_settings"]
    db_export = {}

    for t in tables:
        cursor.execute(f"SELECT * FROM {t}")
        db_export[t] = [dict(r) for r in cursor.fetchall()]

    conn.close()

    now_str = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"lc_crm_backup_{now_str}.json"
    file_path = os.path.join(BACKUPS_DIR, filename)

    with open(file_path, "w", encoding="utf-8") as f:
        json.dump(db_export, f, indent=2, ensure_ascii=False)

    size_bytes = os.path.getsize(file_path)
    b_id = f"b_{uuid.uuid4().hex[:6]}"

    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("INSERT INTO backups VALUES (?, ?, ?, ?)", (b_id, datetime.now().isoformat(), filename, size_bytes))
    conn.commit()
    conn.close()

    return {"success": True, "filename": filename, "download_url": f"/backups/{filename}", "size_bytes": size_bytes}

@app.get("/api/backup/list")
def list_backups():
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM backups ORDER BY timestamp DESC")
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows

@app.get("/backups/{filename}")
def download_backup_file(filename: str):
    file_path = os.path.join(BACKUPS_DIR, filename)
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Backup fayli topilmadi")
    return FileResponse(file_path, filename=filename, media_type="application/json")

# --- SERVE FRONTEND PRODUCTION APP ---
@app.get("/{full_path:path}")
def serve_frontend_spa(full_path: str):
    # Check if file exists in dist
    target_path = os.path.join(FRONTEND_DIST_DIR, full_path)
    if full_path and os.path.exists(target_path) and os.path.isfile(target_path):
        return FileResponse(target_path)
    
    # Fallback to index.html for SPA client-side routing
    index_path = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    
    return {"message": "WESTMINSTER CRM Backend API running. Built frontend dist/ not found. Run 'npm run build' in frontend directory."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
