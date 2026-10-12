# دليل رفع المشروع على Hostinger - Nextvora

هذا الدليل يشرح خطوات رفع مشروعك بالكامل على استضافة Hostinger، سواء كنت تستخدم خدمة **VPS** أو **Node.js Hosting** العادية.

---

## الخطوة 1: تجهيز قاعدة البيانات (MySQL)

1.  ادخل إلى لوحة تحكم Hostinger (hPanel).
2.  انتقل إلى **Databases** -> **MySQL Databases**.
3.  أنشئ قاعدة بيانات جديدة باسم `nextvora` (أو أي اسم تفضله).
4.  قم بإنشاء مستخدم جديد وكلمة مرور قوية، واحفظ هذه البيانات جانباً.
5.  افتح **phpMyAdmin** لقاعدة البيانات الجديدة.
6.  انقر على تبويب **Import** وقم برفع ملف `mysql_schema.sql` الموجود في المجلد الرئيسي للمشروع.

---

## الخطوة 2: تجهيز ورفع الواجهة الأمامية (Frontend)

يتم تشغيل الواجهة الأمامية كملفات ساكنة (Static Files) بعد بنائها.

1.  على جهازك المحلي، افتح المجلد الرئيسي للمشروع.
2.  تأكد من أن ملف `.env` يحتوي على العنوان الصحيح للـ API (سيتم تغييره لاحقاً لعنوان السيرفر).
3.  قم بتشغيل الأمر:
    ```bash
    npm run build
    ```
4.  بعد انتهاء البناء، سيظهر مجلد باسم `dist`.
5.  قم بضغط محتويات مجلد `dist` في ملف ZIP.
6.  في Hostinger، انتقل إلى **File Manager**.
7.  ادخل إلى مجلد `public_html` وقم برفع ملف ZIP وفكه هناك.
8.  **ملاحظة هامة**: لمنع مشاكل التوجيه (Routing) في React، قم بإنشاء ملف `.htaccess` داخل `public_html` وضع فيه الكود التالي:
    ```apache
    <IfModule mod_rewrite.c>
      RewriteEngine On
      RewriteBase /
      RewriteRule ^index\.html$ - [L]
      RewriteCond %{REQUEST_FILENAME} !-f
      RewriteCond %{REQUEST_FILENAME} !-d
      RewriteCond %{REQUEST_FILENAME} !-l
      RewriteRule . /index.html [L]
    </IfModule>
    ```

---

## الخطوة 3: تجهيز ورفع النظام الخلفي (Backend)

1.  انتقل إلى مجلد `backend` في جهازك المحلي.
2.  قم بضغط كافة الملفات **باستثناء** مجلد `node_modules` و ملف `.env` المحلي.
3.  في Hostinger، إذا كنت تستخدم **Node.js Hosting**:
    *   قم برفع الملف المضغوط إلى مجلد خاص (مثلاً `public_html/api` أو مجلد في المستوى الأعلى).
    *   استخدم **Node.js Selector** في لوحة التحكم لتحديد الملف الرئيسي وهو `server.js`.
4.  إذا كنت تستخدم **VPS**:
    *   ارفع الملفات عبر FTP/SFTP.
    *   استخدم SSH للدخول للسيرفر، ثم نفذ `npm install`.
    *   استخدم `pm2` لتشغيل السيرفر باستمرار: `pm2 start server.js --name academy-api`.

---

## الخطوة 4: إعداد المتغيرات البيئية (Environment Variables)

داخل مجلد الـ `backend` على السيرفر، قم بإنشاء ملف `.env` (بناءً على `.env.example`) وقم بتعبئة البيانات:
```env
PORT=5000
DB_HOST=localhost
DB_PORT=3306
DB_USER=اسم_مستخدم_قاعدة_البيانات
DB_PASS=كلمة_مرور_قاعدة_البيانات
DB_NAME=اسم_قاعدة_البيانات
JWT_SECRET=اكتب_سلسلة_عشوائية_طويلة_هنا
NODE_ENV=production
```

---

## الخطوة 5: الربط النهائي

تأكد من أن الواجهة الأمامية (Frontend) تعرف عنوان الـ API الجديد:
1.  إذا كان مسار الـ API هو `https://yourdomain.com/api` (باستخدام Proxy) أو `https://yourdomain.com:5000/api`.
2.  يجب إعادة بناء الفرونت اند (npm run build) برابط الـ API الصحيح إذا لزم الأمر، أو استخدام متغيرات البيئة في السيرفر.
