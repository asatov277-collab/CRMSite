import os

base_dir = r"C:\Users\Dell\.gemini\antigravity\scratch\CRMSite"
main_py = os.path.join(base_dir, "backend", "main.py")
db_py = os.path.join(base_dir, "backend", "database.py")
env_file = os.path.join(base_dir, ".env")
gitignore = os.path.join(base_dir, ".gitignore")

# 1. Create .env
with open(env_file, "w", encoding="utf-8") as f:
    f.write("TELEGRAM_BOT_TOKEN=8318395303:AAGBPdtIB3_V-1yB5pBdPCd6ipqsvQZRDYw\n")
    f.write("ADMIN_PASSWORD=977999796\n")
    f.write("ADMIN_LOGIN=Westminster_lc\n")
    f.write("SECRET_SALT=westminster_crm_super_secret_salt\n")

# 2. Add .env to .gitignore
if os.path.exists(gitignore):
    with open(gitignore, "a", encoding="utf-8") as f:
        f.write("\n.env\n")

# 3. Patch main.py
with open(main_py, "r", encoding="utf-8") as f:
    content = f.read()

# Imports
content = content.replace("from pydantic import BaseModel", "from pydantic import BaseModel\nfrom dotenv import load_dotenv\nimport security")
content = content.replace("init_db()", "load_dotenv()\ninit_db()")

# Telegram
content = content.replace(
    'TELEGRAM_BOT_TOKEN = "8318395303:AAGBPdtIB3_V-1yB5pBdPCd6ipqsvQZRDYw"',
    'TELEGRAM_BOT_TOKEN = os.getenv("TELEGRAM_BOT_TOKEN", "8318395303:AAGBPdtIB3_V-1yB5pBdPCd6ipqsvQZRDYw")'
)

# Auth Endpoints - Login
login_old = """    # 3. Password Verification:
    # STRICT MATCH with current DB password only!
    # No fallback list, no old passwords, no bypass!
    actual_password = str(found_user['password']).strip()
    input_password = str(req.password).strip()

    if input_password != actual_password:"""

login_new = """    # 3. Password Verification:
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

    if False:"""
content = content.replace(login_old, login_new)

# Verify Reset Password
verify_old = 'cursor.execute("UPDATE users SET password = ? WHERE id = ?", (req.new_password, u["id"]))'
verify_new = 'cursor.execute("UPDATE users SET password = ? WHERE id = ?", (security.hash_password(req.new_password), u["id"]))'
content = content.replace(verify_old, verify_new)

# Change Password
change_pwd_old = """    u_dict = dict(user)
    if req.current_password and u_dict["password"] != req.current_password:
        conn.close()
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri kiritildi!")

    cursor.execute("UPDATE users SET password = ? WHERE id = ?", (req.new_password, req.user_id))"""

change_pwd_new = """    u_dict = dict(user)
    if req.current_password and not security.verify_password(req.current_password, u_dict["password"]):
        conn.close()
        raise HTTPException(status_code=400, detail="Joriy parol noto'g'ri kiritildi!")

    cursor.execute("UPDATE users SET password = ? WHERE id = ?", (security.hash_password(req.new_password), req.user_id))"""
content = content.replace(change_pwd_old, change_pwd_new)

# Create User
create_user_old = """        cursor.execute(\"\"\"
            INSERT INTO users (id, role, name, phone, password, bio, subject, certificates, salary, salary_percent, archived, branch_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        \"\"\", (uid, req.role, req.name, req.phone, req.password, req.bio, req.subject, req.certificates, req.salary, req.salary_percent or 50.0, req.branch_id or "b_main"))"""

create_user_new = """        cursor.execute(\"\"\"
            INSERT INTO users (id, role, name, phone, password, bio, subject, certificates, salary, salary_percent, archived, branch_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
        \"\"\", (uid, req.role, req.name, req.phone, security.hash_password(req.password), req.bio, req.subject, req.certificates, req.salary, req.salary_percent or 50.0, req.branch_id or "b_main"))"""
content = content.replace(create_user_old, create_user_new)

# Admin Edit User (Password update)
admin_edit_old = """    if req.password and req.password.strip():
        cursor.execute(\"\"\"
            UPDATE users
            SET name = ?, phone = ?, password = ?, subject = ?, salary_percent = ?, branch_id = ?
            WHERE id = ?
        \"\"\", (req.name, req.phone, req.password.strip(), req.subject, req.salary_percent or 50.0, req.branch_id or "b_main", user_id))"""

admin_edit_new = """    if req.password and req.password.strip():
        cursor.execute(\"\"\"
            UPDATE users
            SET name = ?, phone = ?, password = ?, subject = ?, salary_percent = ?, branch_id = ?
            WHERE id = ?
        \"\"\", (req.name, req.phone, security.hash_password(req.password.strip()), req.subject, req.salary_percent or 50.0, req.branch_id or "b_main", user_id))"""
content = content.replace(admin_edit_old, admin_edit_new)

# Create Manager
create_mgr_old = """        cursor.execute(\"\"\"
            INSERT INTO users (id, role, name, phone, password, bio, subject, certificates, salary, salary_percent, archived, branch_id)
            VALUES (?, 'manager', ?, ?, ?, '', 'Filial Menejeri', '', 0, 0, 0, ?)
        \"\"\", (uid, req.name, req.phone, req.password, req.branch_id))"""

create_mgr_new = """        cursor.execute(\"\"\"
            INSERT INTO users (id, role, name, phone, password, bio, subject, certificates, salary, salary_percent, archived, branch_id)
            VALUES (?, 'manager', ?, ?, ?, '', 'Filial Menejeri', '', 0, 0, 0, ?)
        \"\"\", (uid, req.name, req.phone, security.hash_password(req.password), req.branch_id))"""
content = content.replace(create_mgr_old, create_mgr_new)

with open(main_py, "w", encoding="utf-8") as f:
    f.write(content)

# 4. Patch database.py
with open(db_py, "r", encoding="utf-8") as f:
    db_content = f.read()

db_content = db_content.replace("import sqlite3\n", "import sqlite3\nimport os\nfrom dotenv import load_dotenv\nimport security\n")
db_content = db_content.replace("def init_db():", "load_dotenv()\n\ndef init_db():")

admin_insert_old = """    cursor.execute(\"\"\"
    INSERT INTO users (id, role, name, phone, password, bio, subject, certificates, salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    \"\"\", ("admin_westminster", "admin", "WESTMINSTER_LC", "Westminster_lc", "977999796", "WESTMINSTER CRM Bosh Administratori", "Menejment", "CEO & Administrator", 20000000))"""

admin_insert_new = """    admin_login = os.getenv("ADMIN_LOGIN", "Westminster_lc")
    admin_pwd = os.getenv("ADMIN_PASSWORD", "977999796")
    hashed_pwd = security.hash_password(admin_pwd)

    cursor.execute(\"\"\"
    INSERT INTO users (id, role, name, phone, password, bio, subject, certificates, salary)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    \"\"\", ("admin_westminster", "admin", "WESTMINSTER_LC", admin_login, hashed_pwd, "WESTMINSTER CRM Bosh Administratori", "Menejment", "CEO & Administrator", 20000000))"""
db_content = db_content.replace(admin_insert_old, admin_insert_new)

with open(db_py, "w", encoding="utf-8") as f:
    f.write(db_content)

print("Patching done!")
