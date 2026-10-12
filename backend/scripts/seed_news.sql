INSERT INTO x_adnagri_online_db.news (
    id, 
    title, 
    content, 
    type, 
    priority, 
    target_audience, 
    is_published, 
    is_featured, 
    views_count
) VALUES (
    UUID(), 
    'مرحباً بكم في مركز الأخبار والمحتوى الجديد لمنصة Nexyvora', 
    'يسعدنا إطلاق مركز الأخبار والمحتوى المتكامل! يمكنكم الآن الاطلاع على كافة المستجدات الرسمية، الإعلانات، وتحميل ملفات الـ PDF ومقاطع الفيديو التوضيحية والصور عالية الدقة بنقرة واحدة، بالإضافة إلى إمكانية نسخ أي نص بسهولة لمشاركته مع فريقكم.', 
    'news', 
    'high', 
    'all', 
    1, 
    1, 
    24
);
