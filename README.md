# Goldenstream Scoreboard

سكوربورد لايف للبث: Login / Sign up، كل يوزر يعمل أكتر من بورد، تحكم في السكور، ألوان ولوجوهات، حفظ الفرق، وصفحة Display شفافة للـ OBS بتتحدث لحظياً.

**الستاك:** React + Vite (فرونت) و Supabase (Auth + Postgres + Realtime + Storage).

## 1) جهّز Supabase
1. اعمل حساب على supabase.com واعمل **New project**.
2. افتح **SQL Editor → New query**، الصق محتوى `supabase/schema.sql` كله ودوس **Run**.
   ده بيعمل: جداول `boards` و `saved_teams`، الصلاحيات (RLS)، دالة `bump_score`، تفعيل Realtime، وباكت `logos` للصور.
3. من **Project Settings → API** خد الـ `Project URL` والـ `anon public key`.
4. (اختياري وأنت بتجرب) **Authentication → Providers → Email**: اقفل *Confirm email* عشان تدخل على طول.
   ولما ترفع الموقع: ضيف رابطه في **Authentication → URL Configuration → Site URL**.

## 2) شغّل الفرونت
```bash
cp .env.example .env      # وحط فيه الـ URL والـ key
npm install
npm run dev               # http://localhost:5173
```

## 3) الصفحات
| المسار | الوظيفة |
|---|---|
| `/login` , `/signup` | دخول وتسجيل |
| `/` | البوردات بتاعتك + إنشاء/مسح |
| `/board/:id` | المعاينة + أزرار السكور + الإعدادات |
| `/display/:id` | صفحة OBS (من غير login) — `?pos=top` أو `center` أو `bottom` |

**OBS:** Sources → Browser → حط لينك الـ display، Width 1920 و Height 1080.

## 4) الرفع (Deploy)
Vercel أو Netlify: اربط الريبو وحط متغيرات `.env` في إعدادات المشروع.
`vercel.json` و `public/_redirects` موجودين عشان المسارات تشتغل.

## ملاحظات
- القراءة من `boards` مفتوحة (عشان OBS يشتغل من غير login)؛ أي حد معاه id البورد يقدر يشوفه بس، والتعديل والمسح لصاحبه بس.
- السكور بيتغير بدالة في الداتابيز، فلو اتنين بيتحكموا في نفس الوقت مفيش ضغطة بتضيع.
