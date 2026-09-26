# 🏛️ WESTMINSTER CRM - PRODUCTION RELEASE v1.0.0
O'quv markazlari va ta'lim muassasalari uchun to'liq avtomatlashtirilgan boshqaruv tizimi (CRM).

---

## 🔐 Administrator Kirish Ma'lumotlari

| Parametr | Qiymat |
| :--- | :--- |
| **Login (Foydalanuvchi nomi)** | `WESTMINSTER_LC` |
| **Telefon raqami** | `+998977999796` (yoki `97 799 97 96`) |
| **Parol** | `977999796` |
| **O'quv markazi kodi** | `westminster.uz` |

---

## 🌐 Tizimga Kirish Havolalari

1. **Ushbu asosiy kompyuterning o'zida:**
   👉 [http://localhost:8000](http://localhost:8000)

2. **Bir xil Wi-Fi tarmog'iga ulangan telefon va noutbuklar (O'qituvchilar va Admin):**
   👉 `http://<KOMPYUTER-IP-MANZILI>:8000`  
   *(IP manzilni bilish uchun papkadagi `SERVER_IP_MANZILI.bat` ni bosing)*

3. **Butun dunyo bo'ylab (Mobil 4G/5G, boshqa shaharlar):**
   👉 Papkadagi `INTERNETGA_ULASHISH.bat` faylini ishga tushiring!  
   👉 Online havola: `https://westminster-crm.loca.lt`

---

## 🚀 Ishga Tushirish va Boshqarish Fayllari

- **`FONDA_ISHGA_TUSHIRISH.vbs`** *(Tavsiya etiladi)*:  
  Hech qanday qora konsol oynasi ko'rinmaydi. Server orqa fonda tezkor ishga tushadi va brauzeringizda CRM ochiladi.

- **`ISHGA_TUSHIRISH.bat`**:  
  Serverni konsol oynasida ishga tushiradi. Konsolda barcha so'rovlar va holatlar ko'rinib turadi.

- **`SERVERNI_TOXTATISH.bat`**:  
  Ishlayotgan CRM serverni bitta bosish bilan xavfsiz to'xtatadi.

- **`WINDOWS_BILAN_YONISHGA_QOSHISH.bat`**:  
  Kompyuter har safar yoqilganda CRM avtomatik tarzda ishlab turishi uchun Windows avto-yuklanishiga qo'shadi.

- **`CREATE_DESKTOP_SHORTCUT.vbs`**:  
  Ish stolingizga (Desktop) chiroyli logotip va qulay yorliqlarni (Shortcuts) chiqarib beradi.

- **`FIREWALL_PORT_8000_OCHISH.bat`**:  
  Wi-Fi orqali boshqa telefonlar ulanishi uchun Windows xavfsizlik devorida (Firewall) 8000-portga ruxsat ochadi.

---

## 📦 Tizim Talablari
- **Operatsion tizim:** Windows 10, Windows 11 yoki Windows Server
- **Python:** Python 3.9+ (O'rnatishda "Add Python to PATH" belgilanishi kerak)
- **Kutubxonalar:** `fastapi`, `uvicorn`, `python-multipart`, `pydantic` (`ISHGA_TUSHIRISH.bat` yetishmayotgan bo'lsa o'zi avtomatik o'rnatadi).
