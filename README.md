# 🎓 WESTMINSTER CRM - Learning Center Management System
### Versiya: 1.0 Production Release

O'quv markazlar, repetitorlik markazlari va ko'p filialli ta'lim muassasalari uchun to'liq avtomatlashtirilgan CRM va ERP boshqaruv tizimi.

---

## 🌟 Asosiy Imkoniyatlar

1. **🏢 Ko'p Filialli Tizim (Multi-Branch Support)**:
   - Markaziy boshqaruv va har bir filial uchun avtonom ko'rinish.
   - Filiallarga alohida menejer tayinlash.
   - Filiallar bo'yicha guruhlar, o'quvchilar, davomat va to'lovlarni ajratish.

2. **👔 Filial Menejerlari**:
   - Menejerlar faqat o'zlarining filiallaridagi o'qituvchilar va guruhlarni boshqaradi.
   - O'qituvchilar katalogiga aralashmaydigan maxsus menejerlar bo'limi.

3. **👨‍🏫 O'qituvchilar va Foizli Oylik Maosh (Revenue-Share)**:
   - O'qituvchi profillarini to'liq tahrirlash (Ismi, telefoni, paroli, fani, filiali, foizi).
   - O'quvchilardan tushgan oylik to'lov summasiga qarab oylik maoshni avtomatik foiz hisobida chiqarish:
     $$\text{Oylik Maosh} = \text{Oylik Tushum} \times \frac{\text{Foiz}}{100}$$
   - Faqat Admin barcha filiallar foizini, filial menejeri esa o'z filialidagi o'qituvchilar foizini belgilay oladi.

4. **💳 To'lovlar va Moliya**:
   - Naqd va Karta to'lovlari hisobi, to'lov cheki (skrinshot) yuklash.
   - Oylik tushum balansi va qarzdorlar hisobi.
   - O'quvchilar faqat o'zlari o'qigan oylarda ko'rinadi (eski oylarda asossiz qarzdorlik ko'rsatilmaydi).
   - Telegram yoki printer/PDF uchun bir tugma bilan oylik hisobotni ulashish.

5. **👨‍🎓 O'quvchilar va Guruhlar**:
   - Guruhdan guruhga o'tkazish (Transfer).
   - Arxivlash va tarixni saqlab qolish.
   - Jami o'quvchilar statistikasi.

6. **💬 Jonli Chat**:
   - Admin xabarlarni o'chirish huquqiga ega, o'qituvchilar faqat o'z xabarlarini o'chira oladi.
   - Filiallararo va markaziy muloqot.

7. **⚙️ Moslashuvchan Dizayn**:
   - Tizim logotipini o'zgartirish va fon rangini tanlash (barcha foydalanuvchilarga avtomatik sinxronlanadi).

---

## 🚀 Ishga Tushirish (Local Run)

### Windows uchun:
- `HAMMASINI_ISHGA_TUSHIRISH.bat` yoki `FONDA_ISHGA_TUSHIRISH.vbs` faylini ishga tushiring.
- Brauzerda ochiladi: **http://localhost:8000**

### Qo'lda ishga tushirish:
```bash
# 1. Backend
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
python main.py

# 2. Frontend
cd frontend
npm install
npm run build
```

---

## 🔑 Standart Kirish Ma'lumotlari

-
---

## 📁 Texnologiyalar
- **Frontend**: React, Vite, Lucide Icons, CSS3 Glassmorphism
- **Backend**: Python FastAPI, SQLite, Uvicorn, Pydantic
