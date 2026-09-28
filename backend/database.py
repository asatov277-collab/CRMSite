import sqlite3
import json
import os
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(__file__), "lc_crm.db")

def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    cursor = conn.cursor()

    # Users table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        role TEXT NOT NULL, -- admin / teacher
        name TEXT NOT NULL,
        phone TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        avatar TEXT,
        bg TEXT,
        bio TEXT,
        subject TEXT,
        certificates TEXT,
        salary REAL DEFAULT 0,
        archived INTEGER DEFAULT 0
    )
    """)

    # Groups table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS groups (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        subject TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        schedule TEXT,
        room TEXT,
        price REAL DEFAULT 0,
        archived INTEGER DEFAULT 0,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
    """)

    # Students table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS students (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        parent_phone TEXT NOT NULL,
        group_ids TEXT DEFAULT '[]',
        archived INTEGER DEFAULT 0,
        created_at TEXT NOT NULL
    )
    """)

    # Attendance table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS attendance (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        date TEXT NOT NULL,
        status TEXT NOT NULL, -- kelgan / kelmagan / kechikkan
        reason TEXT DEFAULT '',
        FOREIGN KEY (student_id) REFERENCES students(id),
        FOREIGN KEY (group_id) REFERENCES groups(id)
    )
    """)

    # Payments table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY,
        student_id TEXT NOT NULL,
        group_id TEXT NOT NULL,
        teacher_id TEXT NOT NULL,
        month TEXT NOT NULL,
        amount REAL DEFAULT 0,
        method TEXT DEFAULT 'naqd', -- naqd / karta
        receipt_file TEXT DEFAULT '',
        paid INTEGER DEFAULT 0,
        date TEXT NOT NULL,
        notes TEXT DEFAULT '',
        FOREIGN KEY (student_id) REFERENCES students(id)
    )
    """)

    # Chat messages table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS chat_messages (
        id TEXT PRIMARY KEY,
        sender_id TEXT NOT NULL,
        sender_name TEXT NOT NULL,
        text TEXT DEFAULT '',
        image_file TEXT DEFAULT '',
        timestamp TEXT NOT NULL,
        FOREIGN KEY (sender_id) REFERENCES users(id)
    )
    """)

    # Course Materials table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS materials (
        id TEXT PRIMARY KEY,
        teacher_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT DEFAULT '',
        file_url TEXT NOT NULL,
        file_type TEXT NOT NULL, -- pdf / image / video / doc
        created_at TEXT NOT NULL,
        FOREIGN KEY (teacher_id) REFERENCES users(id)
    )
    """)

    # System Settings table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS system_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        name TEXT DEFAULT 'WESTMINSTER CRM Educational Center',
        login_code TEXT DEFAULT 'westminster.uz',
        phone TEXT DEFAULT '+998 71 200 00 00',
        address TEXT DEFAULT 'Toshkent sh., Yunusobod tumani',
        currency TEXT DEFAULT 'so''m',
        timezone TEXT DEFAULT 'Asia/Tashkent',
        theme_color TEXT DEFAULT '#4F46E5',
        bg_color TEXT DEFAULT '#0B0F17',
        logo_url TEXT DEFAULT ''
    )
    """)

    # Branches table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS branches (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT DEFAULT '',
        phone TEXT DEFAULT '',
        manager_id TEXT DEFAULT '',
        manager_name TEXT DEFAULT '',
        created_at TEXT NOT NULL
    )
    """)

    # Backups log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS backups (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        filename TEXT NOT NULL,
        size_bytes INTEGER DEFAULT 0
    )
    """)

    # Safe migrations for existing database
    def add_col_if_missing(tbl, col, col_def):
        try:
            cursor.execute(f"ALTER TABLE {tbl} ADD COLUMN {col} {col_def}")
        except Exception:
            pass

    add_col_if_missing("system_settings", "bg_color", "TEXT DEFAULT '#0B0F17'")
    add_col_if_missing("groups", "branch_id", "TEXT DEFAULT 'b_main'")
    add_col_if_missing("students", "branch_id", "TEXT DEFAULT 'b_main'")
    add_col_if_missing("users", "branch_id", "TEXT DEFAULT 'b_main'")
    add_col_if_missing("users", "salary_percent", "REAL DEFAULT 50")
    add_col_if_missing("chat_messages", "branch_id", "TEXT DEFAULT 'b_main'")
    add_col_if_missing("payments", "branch_id", "TEXT DEFAULT 'b_main'")
    add_col_if_missing("materials", "branch_id", "TEXT DEFAULT 'b_main'")

    # Ensure default main branch exists
    cursor.execute("SELECT COUNT(*) FROM branches")
    if cursor.fetchone()[0] == 0:
        now_ts = datetime.now().isoformat()
        cursor.execute("""
        INSERT INTO branches (id, name, address, phone, manager_id, manager_name, created_at)
        VALUES ('b_main', 'Bosh Bino (Asosiy Filial)', 'Toshkent sh., Yunusobod tumani', '+998 71 200 00 00', 'admin_westminster', 'WESTMINSTER_LC', ?)
        """, (now_ts,))

    conn.commit()

    # Seed Initial Data if empty
    cursor.execute("SELECT COUNT(*) FROM users")
    if cursor.fetchone()[0] == 0:
        seed_initial_data(cursor)
        conn.commit()

    conn.close()

def seed_initial_data(cursor):
    today = datetime.now().strftime("%Y-%m-%d")
    now_ts = datetime.now().isoformat()
    month_cur = today[:7]

    # Single Admin user
    cursor.execute("""
    INSERT INTO users (id, role, name, phone, password, bio, subject, certificates, salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    """, ("admin_westminster", "admin", "WESTMINSTER_LC", "Westminster_lc", "977999796", "WESTMINSTER CRM Bosh Administratori", "Menejment", "CEO & Administrator", 20000000))

    # Groups
    cursor.execute("""
    INSERT INTO groups (id, name, subject, teacher_id, schedule, room, price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("g1", "Math Intensive - 01", "Matematika", "admin_westminster", "Dush-Sesh-Juma 14:00", "102-xona", 450000))

    cursor.execute("""
    INSERT INTO groups (id, name, subject, teacher_id, schedule, room, price)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    """, ("g2", "IELTS Standard - A1", "Ingliz tili", "admin_westminster", "Sesh-Pay-Shan 16:00", "204-xona", 500000))

    # Students
    students_data = [
        ("s1", "Hasan Karimov", "+998911112233", "+998933332211", json.dumps(["g1"]), 0, today),
        ("s2", "Husan Karimov", "+998911112244", "+998933332211", json.dumps(["g1"]), 0, today),
        ("s3", "Madina Umarova", "+998909998877", "+998935554433", json.dumps(["g2"]), 0, today),
        ("s4", "Bekzod Toshev", "+998977776655", "+998901239988", json.dumps(["g1", "g2"]), 0, today),
        ("s5", "Sardor Jalilov", "+998944443322", "+998912223344", json.dumps(["g2"]), 0, today),
    ]

    for st in students_data:
        cursor.execute("INSERT INTO students VALUES (?, ?, ?, ?, ?, ?, ?)", st)

    # Attendance demo
    attendance_data = [
        ("att1", "s1", "g1", "admin_westminster", today, "kelgan", ""),
        ("att2", "s2", "g1", "admin_westminster", today, "kechikkan", "Tirbandlik sababli 15 min kechikdi"),
        ("att3", "s4", "g1", "admin_westminster", today, "kelmagan", "Mazasi bo'lmay qolgan"),
        ("att4", "s3", "g2", "admin_westminster", today, "kelgan", ""),
        ("att5", "s5", "g2", "admin_westminster", today, "kelgan", ""),
    ]
    for att in attendance_data:
        cursor.execute("INSERT INTO attendance VALUES (?, ?, ?, ?, ?, ?, ?)", att)

    # Payments demo
    payments_data = [
        ("pay1", "s1", "g1", "admin_westminster", month_cur, 450000, "naqd", "", 1, today, "To'liq to'landi"),
        ("pay2", "s2", "g1", "admin_westminster", month_cur, 450000, "karta", "sample_receipt.png", 1, today, "Payme orqali to'landi"),
        ("pay3", "s4", "g1", "admin_westminster", month_cur, 450000, "naqd", "", 0, today, "Qarzdor"),
        ("pay4", "s3", "g2", "admin_westminster", month_cur, 500000, "karta", "sample_receipt2.png", 1, today, "Click orqali"),
        ("pay5", "s5", "g2", "admin_westminster", month_cur, 500000, "naqd", "", 0, today, "Qarzdor"),
    ]
    for p in payments_data:
        cursor.execute("INSERT INTO payments VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)", p)

    # Initial System Settings
    cursor.execute("""
    INSERT OR REPLACE INTO system_settings (id, name, login_code, phone, address, currency, timezone, theme_color, logo_url)
    VALUES (1, 'WESTMINSTER CRM Educational Center', 'westminster.uz', '+998 71 200 00 00', 'Toshkent sh., Yunusobod tumani', 'so''m', 'Asia/Tashkent', '#4F46E5', '')
    """)

    # Initial Chat message
    cursor.execute("""
    INSERT INTO chat_messages (id, sender_id, sender_name, text, image_file, timestamp)
    VALUES (?, ?, ?, ?, ?, ?)
    """, ("msg1", "admin_westminster", "WESTMINSTER_LC", "Xush kelibsiz! WESTMINSTER CRM tizimi muvaffaqiyatli ishga tushdi.", "", now_ts))

if __name__ == "__main__":
    init_db()
    print("Database initialized successfully!")
