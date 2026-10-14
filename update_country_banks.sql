-- تحديث جدول إعدادات العملات لدعم بيانات الحسابات البنكية المحلية (Algeria, Morocco, etc.)
-- يمكنك تشغيل هذه الأوامر في phpMyAdmin على استضافة الموقع إذا لم تكن الأعمدة مضافة:

ALTER TABLE `country_currency_rules` ADD COLUMN IF NOT EXISTS `bank_name` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `country_currency_rules` ADD COLUMN IF NOT EXISTS `account_holder` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `country_currency_rules` ADD COLUMN IF NOT EXISTS `account_number` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `country_currency_rules` ADD COLUMN IF NOT EXISTS `iban` VARCHAR(255) DEFAULT NULL;
ALTER TABLE `country_currency_rules` ADD COLUMN IF NOT EXISTS `swift_code` VARCHAR(100) DEFAULT NULL;
ALTER TABLE `country_currency_rules` ADD COLUMN IF NOT EXISTS `bank_instructions` TEXT DEFAULT NULL;
ALTER TABLE `country_currency_rules` ADD COLUMN IF NOT EXISTS `bank_instructions_ar` TEXT DEFAULT NULL;

-- تحديث مباشر لحساب الجزائر في حال أردت تفعيله فوراً في قاعدة البيانات:
UPDATE `country_currency_rules` 
SET 
    `bank_name` = 'BaridiMob',
    `account_holder` = 'Halim Bouzettouta',
    `account_number` = '00799999004068764402',
    `bank_instructions_ar` = 'يرجى التحويل بالدينار الجزائري عبر تطبيق بريدي موب (BaridiMob RIP) وكتابة رقم الهاتف في سبب التحويل ثم إرفاق صورة الوصل.'
WHERE `country_code` = 'DZ';
