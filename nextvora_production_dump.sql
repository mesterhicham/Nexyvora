-- MySQL dump 10.13  Distrib 5.7.24, for Win64 (x86_64)
--
-- Host: 127.0.0.1    Database: nextvora
-- ------------------------------------------------------
-- Server version	5.7.24

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `challenges`
--

DROP TABLE IF EXISTS `challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `challenges` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `title_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `description` text COLLATE utf8mb4_unicode_ci,
  `description_ar` text COLLATE utf8mb4_unicode_ci,
  `image_url` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `target_sales` int(11) DEFAULT '0',
  `target_revenue` decimal(12,2) DEFAULT '0.00',
  `reward_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'CASH',
  `reward_amount` decimal(12,2) DEFAULT '0.00',
  `reward_title` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `reward_title_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `leg_limit_percent` int(11) DEFAULT '40',
  `required_directs` int(11) DEFAULT '0',
  `directs_type` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'ANY',
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `challenges`
--

LOCK TABLES `challenges` WRITE;
/*!40000 ALTER TABLE `challenges` DISABLE KEYS */;
INSERT INTO `challenges` VALUES ('219ee3e2-d9a4-4cae-aaec-a3a2f6c7f688','Team Builder Challenge','تحدي بناء الفريق الخماسي','Help 5 members in your 1st generation make their first sale to earn leadership bonus and priority withdrawals.','ساعد 5 أعضاء في جيلك الأول على تحقيق مبيعاتهم لتفعيل مكافأة القيادة وترقية أولوية السحب.','https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=60',5,750.00,'CASH',150.00,'$150 USD leadership bonus + Priority payout','$150 USD بونص قيادة + ترقية أولوية السحب',40,5,'FLOW','2026-09-24','2026-10-24','active','2026-09-24 06:20:34','2026-09-24 06:20:34'),('8e61f859-7a27-4dcf-ad39-4003b9a71ebd','Fast Start Challenge','تحدي الانطلاقة السريعة (Fast Start)','Achieve your first 3 direct sales within your first 14 days on the platform to unlock exclusive instant cash reward.','حقق أول 3 مبيعات مباشرة خلال أول 14 يوماً من تسجيلك في المنصة لتحصل على مكافأة نقدية فورية وشارة المسوق الواعد.','https://images.unsplash.com/photo-1552664730-d307ca884978?w=800&auto=format&fit=crop&q=60',3,0.00,'CASH',50.00,'$50 instant cash bonus + Rising Marketer badge','$50 بونص كاش فوري + شارة المسوق الواعد',100,3,'ANY','2026-09-24','2026-10-08','active','2026-09-24 06:20:34','2026-09-24 06:20:34'),('de7220ee-e536-470d-b89d-39c2f131a4af','Global Travel & VIP Leadership Gala','تحدي رحلة النخبة إلى دبي ومؤتمر القادة VIP','Reach $5,000 USD in team sales and qualify for an all-expenses paid luxury trip to Dubai and VIP Mastermind.','حقق حجم مبيعات فريق يتجاوز $5,000 USD وتأهل لرحلة فاخرة مدفوعة التكاليف بالكامل إلى دبي مع إقامة 5 نجوم وحضور مؤتمر القادة.','https://images.unsplash.com/photo-1512453979798-5ea266f8880c?w=800&auto=format&fit=crop&q=60',10,5000.00,'TRAVEL',1200.00,'All-inclusive 5-star trip to Dubai + VIP Coaching Gala','رحلة مدفوعة التكاليف بالكامل 5 نجوم إلى دبي + مؤتمر القادة VIP',40,5,'ANY','2026-09-24','2026-11-23','active','2026-09-24 06:20:34','2026-09-24 06:20:34');
/*!40000 ALTER TABLE `challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cohorts`
--

DROP TABLE IF EXISTS `cohorts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cohorts` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `specialty_id` varchar(36) DEFAULT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `specialty_id` (`specialty_id`),
  CONSTRAINT `cohorts_ibfk_1` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cohorts`
--

LOCK TABLES `cohorts` WRITE;
/*!40000 ALTER TABLE `cohorts` DISABLE KEYS */;
/*!40000 ALTER TABLE `cohorts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `commissions`
--

DROP TABLE IF EXISTS `commissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `commissions` (
  `id` varchar(36) NOT NULL,
  `recipient_id` varchar(36) NOT NULL,
  `source_user_id` varchar(36) NOT NULL,
  `package_id` varchar(36) NOT NULL,
  `user_package_id` varchar(36) DEFAULT NULL,
  `generation_level` tinyint(4) NOT NULL,
  `rate_percentage` decimal(5,2) NOT NULL,
  `sale_amount` decimal(10,2) NOT NULL,
  `commission_amount` decimal(10,2) NOT NULL,
  `status` enum('available','pending','paid','cancelled') DEFAULT 'available',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_comm_recipient` (`recipient_id`),
  KEY `fk_comm_source` (`source_user_id`),
  KEY `fk_comm_package` (`package_id`),
  CONSTRAINT `fk_comm_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`),
  CONSTRAINT `fk_comm_recipient` FOREIGN KEY (`recipient_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comm_source` FOREIGN KEY (`source_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `commissions`
--

LOCK TABLES `commissions` WRITE;
/*!40000 ALTER TABLE `commissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `commissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversation_participants`
--

DROP TABLE IF EXISTS `conversation_participants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversation_participants` (
  `id` varchar(36) NOT NULL,
  `conversation_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `joined_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `last_read_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversation_id` (`conversation_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `conversation_participants_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `conversation_participants_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversation_participants`
--

LOCK TABLES `conversation_participants` WRITE;
/*!40000 ALTER TABLE `conversation_participants` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversation_participants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversations` (
  `id` varchar(36) NOT NULL,
  `type` enum('direct','group') NOT NULL DEFAULT 'direct',
  `name` varchar(255) DEFAULT NULL,
  `cohort_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `cohort_id` (`cohort_id`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`cohort_id`) REFERENCES `cohorts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `diplomas`
--

DROP TABLE IF EXISTS `diplomas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `diplomas` (
  `id` varchar(36) NOT NULL,
  `serial_number` varchar(100) NOT NULL,
  `student_id` varchar(36) DEFAULT NULL,
  `program` varchar(255) NOT NULL,
  `specialty` varchar(255) NOT NULL,
  `issue_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `serial_number` (`serial_number`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `diplomas_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `diplomas`
--

LOCK TABLES `diplomas` WRITE;
/*!40000 ALTER TABLE `diplomas` DISABLE KEYS */;
/*!40000 ALTER TABLE `diplomas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_logs`
--

DROP TABLE IF EXISTS `email_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_logs` (
  `id` varchar(36) NOT NULL,
  `template_id` varchar(36) DEFAULT NULL,
  `recipient_email` varchar(255) NOT NULL,
  `recipient_name` varchar(255) DEFAULT NULL,
  `recipient_type` varchar(100) DEFAULT NULL,
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body_html` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `status` varchar(50) DEFAULT 'pending',
  `error_message` text,
  `sent_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `template_id` (`template_id`),
  CONSTRAINT `email_logs_ibfk_1` FOREIGN KEY (`template_id`) REFERENCES `email_templates` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_logs`
--

LOCK TABLES `email_logs` WRITE;
/*!40000 ALTER TABLE `email_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_settings`
--

DROP TABLE IF EXISTS `email_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_settings` (
  `id` varchar(36) NOT NULL,
  `smtp_host` varchar(255) DEFAULT NULL,
  `smtp_port` int(11) DEFAULT '587',
  `smtp_username` varchar(255) DEFAULT NULL,
  `smtp_password` varchar(255) DEFAULT NULL,
  `encryption` varchar(50) DEFAULT 'tls',
  `from_email` varchar(255) DEFAULT NULL,
  `from_name` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_settings`
--

LOCK TABLES `email_settings` WRITE;
/*!40000 ALTER TABLE `email_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `email_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `email_templates`
--

DROP TABLE IF EXISTS `email_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `email_templates` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `subject` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `body_html` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `body_text` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `variables` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `email_templates`
--

LOCK TABLES `email_templates` WRITE;
/*!40000 ALTER TABLE `email_templates` DISABLE KEYS */;
INSERT INTO `email_templates` VALUES ('1fa67fcd-6cc6-4713-b7e7-d078e8e0924b','إعادة تعيين كلمة المرور (Password Reset)','password-reset','طلب إعادة تعيين كلمة المرور الخاصة بحسابك في Nextvora','<div dir=\"rtl\" style=\"font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);\">\n  <div style=\"background: linear-gradient(135deg, #334155 0%, #1e293b 100%); padding: 35px 30px; text-align: center;\">\n    <h1 style=\"color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;\">إعادة تعيين كلمة المرور 🔐</h1>\n    <p style=\"color: #94a3b8; margin: 6px 0 0 0; font-size: 14px;\">Nextvora Security Center</p>\n  </div>\n  \n  <div style=\"padding: 35px 30px;\">\n    <h2 style=\"color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;\">مرحباً {{name}}،</h2>\n    <p style=\"color: #475569; font-size: 15px; line-height: 1.7;\">\n      تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك في <strong>{{platform_name}}</strong>. إذا كنت أنت من قام بهذا الطلب، يمكنك إنشاء كلمة مرور جديدة عبر النقر على الزر أدناه:\n    </p>\n\n    <div style=\"text-align: center; margin: 30px 0;\">\n      <a href=\"{{reset_link}}\" style=\"display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 16px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(109, 40, 217, 0.35);\">\n        إعادة تعيين كلمة المرور ➔\n      </a>\n    </div>\n\n    <p style=\"color: #64748b; font-size: 13px; line-height: 1.6;\">\n      هذا الرابط صالح للاستخدام لمدة {{expires_in}} دقيقة فقط. إذا لم تكن قد طلبت تغيير كلمة المرور، فيمكنك تجاهل هذه الرسالة بأمان وستبقى بيانات حسابك محمية.\n    </p>\n  </div>\n  \n  <div style=\"background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;\">\n    © {{platform_name}} - مركز الأمان والحماية.\n  </div>\n</div>','مرحباً {{name}}، لقد تم طلب إعادة تعيين كلمة المرور لحسابك. استخدم الرابط التالي: {{reset_link}}.','[\"name\", \"reset_link\", \"expires_in\", \"platform_name\"]',1,'2026-03-03 15:55:00','2026-09-22 00:25:48'),('489bce9c-2ad4-4bad-9e37-aada08d62819','إشعار استلام عمولة وأرباح جديدة (Commission Earned)','commission-earned','مبروك! استلمت عمولة جديدة بقيمة ${{amount}} في محفظتك 💰','<div dir=\"rtl\" style=\"font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);\">\n  <div style=\"background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 35px 30px; text-align: center;\">\n    <h1 style=\"color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;\">أرباح جديدة في محفظتك 💸</h1>\n    <p style=\"color: #d1fae5; margin: 6px 0 0 0; font-size: 14px;\">Nextvora Affiliate System</p>\n  </div>\n  \n  <div style=\"padding: 35px 30px;\">\n    <h2 style=\"color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;\">تهانينا الحارة يا {{name}}! 🌟</h2>\n    <p style=\"color: #475569; font-size: 15px; line-height: 1.7;\">\n      يسعدنا إعلامك بأنه تم إضافة عمولة تسويقية جديدة إلى رصيد محفظتك بفضل نشاط شبكتك وفريقك التسويقي.\n    </p>\n\n    <div style=\"background-color: #ecfdf5; border: 2px solid #a7f3d0; border-radius: 18px; padding: 24px; text-align: center; margin: 25px 0;\">\n      <span style=\"display: block; font-size: 13px; color: #047857; font-weight: 700; text-transform: uppercase;\">مبلغ العمولة المكتسب</span>\n      <span style=\"display: block; font-size: 36px; font-weight: 900; color: #065f46; font-family: monospace; margin: 6px 0;\">\n        +{{amount}} {{currency}}\n      </span>\n      <div style=\"display: inline-block; background-color: #d1fae5; color: #065f46; border-radius: 20px; padding: 4px 14px; font-size: 12px; font-weight: 700;\">\n        من الجيل رقم: {{generation}} (العضو: {{source_user}})\n      </div>\n    </div>\n\n    <table style=\"width: 100%; border-collapse: collapse; margin-top: 15px; font-size: 14px;\">\n      <tr style=\"border-bottom: 1px solid #f1f5f9;\">\n        <td style=\"padding: 12px 0; color: #64748b;\">الرصيد الكلي في المحفظة الآن:</td>\n        <td style=\"padding: 12px 0; font-weight: 700; color: #1e293b; text-align: left; font-family: monospace;\">{{wallet_balance}} {{currency}}</td>\n      </tr>\n      <tr style=\"border-bottom: 1px solid #f1f5f9;\">\n        <td style=\"padding: 12px 0; color: #64748b;\">تاريخ العملية:</td>\n        <td style=\"padding: 12px 0; font-weight: 700; color: #1e293b; text-align: left;\">{{date}}</td>\n      </tr>\n    </table>\n\n    <div style=\"text-align: center; margin: 30px 0 10px 0;\">\n      <a href=\"{{wallet_url}}\" style=\"display: inline-block; background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 14px; font-weight: 700; font-size: 14px;\">\n        عرض محفظتك وسحب الأرباح ➔\n      </a>\n    </div>\n  </div>\n  \n  <div style=\"background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;\">\n    © {{platform_name}} - نموك هو نجاحنا المشترك.\n  </div>\n</div>','تهانينا يا {{name}}! لقد استلمت عمولة جديدة بقيمة {{amount}} {{currency}} من الجيل {{generation}}.','[\"name\", \"amount\", \"currency\", \"generation\", \"source_user\", \"wallet_balance\", \"platform_name\"]',1,'2026-09-22 00:25:48','2026-09-22 00:25:48'),('80e9b2c5-61fc-4dbf-864e-31020ec40363','الترحيب بالعضو الجديد (Welcome Member)','welcome-member','أهلاً بك في منصة Nextvora! ابدأ رحلتك التعليمية والمالية الآن 🚀','<div dir=\"rtl\" style=\"font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);\">\n  <div style=\"background: linear-gradient(135deg, #6d28d9 0%, #7c3aed 100%); padding: 40px 30px; text-align: center;\">\n    <h1 style=\"color: #ffffff; margin: 0; font-size: 28px; font-weight: 800;\">Nextvora Academy</h1>\n    <p style=\"color: #ddd6fe; margin: 8px 0 0 0; font-size: 15px;\">بوابتك نحو التعلّم والنمو المالي والريادة</p>\n  </div>\n  \n  <div style=\"padding: 35px 30px;\">\n    <h2 style=\"color: #1e293b; font-size: 22px; font-weight: 700; margin-top: 0;\">أهلاً وسهلاً بك يا {{name}} 🎉</h2>\n    <p style=\"color: #475569; font-size: 15px; line-height: 1.8;\">\n      يسعدنا جداً انضمامك إلى أسرة <strong>{{platform_name}}</strong>! تم إعداد حسابك بنجاح وأصبح بإمكانك الآن استكشاف الباقات التعليمية، تطوير مهاراتك، والبدء في بناء فريقك وشبكتك التسويقية.\n    </p>\n\n    <div style=\"background: linear-gradient(135deg, #fdf4ff 0%, #f5f3ff 100%); border: 1px solid #e9d5ff; border-radius: 16px; padding: 20px; margin: 25px 0;\">\n      <h3 style=\"color: #701a75; font-size: 15px; margin: 0 0 10px 0; font-weight: 700;\">🔗 رابط الإحالة الخاص بك (Affiliate Link):</h3>\n      <div style=\"background-color: #ffffff; padding: 12px 16px; border-radius: 10px; border: 1px solid #e2e8f0; font-size: 13px; color: #4338ca; font-family: monospace; word-break: break-all;\">\n        {{referral_link}}\n      </div>\n      <p style=\"color: #701a75; font-size: 12px; margin: 8px 0 0 0;\">شارك هذا الرابط لدعوة أعضاء جدد إلى فريقك والربح من عمولات الأجيال الخمسة!</p>\n    </div>\n\n    <div style=\"text-align: center; margin: 30px 0;\">\n      <a href=\"{{login_url}}\" style=\"display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%); color: #ffffff; text-decoration: none; padding: 14px 36px; border-radius: 16px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 15px rgba(109, 40, 217, 0.35);\">\n        تسجيل الدخول إلى حسابك ➔\n      </a>\n    </div>\n  </div>\n  \n  <div style=\"background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;\">\n    © {{platform_name}} - فريق النجاح والشراكة.\n  </div>\n</div>','مرحباً {{name}}، أهلاً بك في Nextvora. حسابك مفعل الآن وجاهز للاستخدام.','[\"name\", \"email\", \"referral_link\", \"login_url\", \"platform_name\"]',1,'2026-09-22 00:25:48','2026-09-22 00:25:48'),('9758888a-e3c0-4470-aaa2-8b54bd25763b','تأكيد شحن المحفظة / إيداع ناجح (Deposit Approved)','deposit-approved','تمت الموافقة على طلب الإيداع بقيمة ${{amount}} في محفظتك ✅','<div dir=\"rtl\" style=\"font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);\">\n  <div style=\"background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); padding: 35px 30px; text-align: center;\">\n    <h1 style=\"color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;\">تأكيد شحن الرصيد ✅</h1>\n    <p style=\"color: #dbeafe; margin: 6px 0 0 0; font-size: 14px;\">معاملة مالية ناجحة</p>\n  </div>\n  \n  <div style=\"padding: 35px 30px;\">\n    <h2 style=\"color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;\">مرحباً {{name}}،</h2>\n    <p style=\"color: #475569; font-size: 15px; line-height: 1.7;\">\n      يسرنا إبلاغك بأن الإدارة قامت بالتحقق من إيصال الدفع الخاص بك والموافقة على شحن رصيد محفظتك بنجاح.\n    </p>\n\n    <div style=\"background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 16px; padding: 20px; margin: 20px 0;\">\n      <table style=\"width: 100%; border-collapse: collapse; font-size: 14px;\">\n        <tr style=\"border-bottom: 1px solid #dbeafe;\">\n          <td style=\"padding: 10px 0; color: #1e40af;\">المبلغ المودع:</td>\n          <td style=\"padding: 10px 0; font-weight: 900; color: #1d4ed8; text-align: left; font-size: 18px; font-family: monospace;\">+{{amount}} {{currency}}</td>\n        </tr>\n        <tr style=\"border-bottom: 1px solid #dbeafe;\">\n          <td style=\"padding: 10px 0; color: #1e40af;\">رقم المعاملة:</td>\n          <td style=\"padding: 10px 0; font-weight: 600; color: #1e293b; text-align: left; font-family: monospace;\">{{transaction_id}}</td>\n        </tr>\n        <tr style=\"border-bottom: 1px solid #dbeafe;\">\n          <td style=\"padding: 10px 0; color: #1e40af;\">الرصيد الجديد بالمحفظة:</td>\n          <td style=\"padding: 10px 0; font-weight: 700; color: #16a34a; text-align: left; font-family: monospace;\">{{new_balance}} {{currency}}</td>\n        </tr>\n        <tr>\n          <td style=\"padding: 10px 0; color: #1e40af;\">التاريخ:</td>\n          <td style=\"padding: 10px 0; font-weight: 600; color: #475569; text-align: left;\">{{date}}</td>\n        </tr>\n      </table>\n    </div>\n\n    <p style=\"color: #64748b; font-size: 13px;\">\n      يمكنك الآن استخدام هذا الرصيد لشراء الباقات التدريبية أو تفعيل الخدمات والترقيات في أي وقت.\n    </p>\n  </div>\n  \n  <div style=\"background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;\">\n    © {{platform_name}} - الإدارة المالية.\n  </div>\n</div>','مرحباً {{name}}، تمت الموافقة على إيداعك بقيمة {{amount}} {{currency}} ورصيدك الحالي أصبح {{new_balance}}.','[\"name\", \"amount\", \"currency\", \"transaction_id\", \"new_balance\", \"date\", \"platform_name\"]',1,'2026-09-22 00:25:48','2026-09-22 00:25:48'),('bb64c230-005c-4211-ad03-6694f626f18d','تم التحقق من الهوية بنجاح (KYC Approved)','kyc-approved','تهانينا! تم توثيق وتأكيد هويتك في Nextvora بنجاح (KYC Verified) 🛡️','<div dir=\"rtl\" style=\"font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);\">\n  <div style=\"background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); padding: 35px 30px; text-align: center;\">\n    <h1 style=\"color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;\">تم توثيق الحساب بنجاح 🛡️</h1>\n    <p style=\"color: #bae6fd; margin: 6px 0 0 0; font-size: 14px;\">Nextvora Identity Verification</p>\n  </div>\n  \n  <div style=\"padding: 35px 30px;\">\n    <h2 style=\"color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;\">مرحباً {{name}}،</h2>\n    <p style=\"color: #475569; font-size: 15px; line-height: 1.7;\">\n      يسرنا إعلامك بأن فريق التدقيق الأمني قام بمراجعة مستندات إثبات الهوية (KYC) الخاصة بك، وتمت الموافقة عليها بنجاح.\n    </p>\n\n    <div style=\"background-color: #f0f9ff; border: 1px solid #bae6fd; border-radius: 16px; padding: 18px; margin: 20px 0; text-align: center;\">\n      <span style=\"display: inline-block; background-color: #0284c7; color: #ffffff; font-size: 13px; font-weight: 700; padding: 6px 18px; border-radius: 20px;\">\n        حسابك الآن: موثّق بالكامل (Verified Account)\n      </span>\n      <p style=\"color: #0369a1; font-size: 13px; margin: 10px 0 0 0;\">\n        تم فتح جميع حدود المعاملات المالية، وسحب الأرباح دون أي قيود.\n      </p>\n    </div>\n\n    <div style=\"text-align: center; margin: 25px 0 10px 0;\">\n      <a href=\"{{dashboard_url}}\" style=\"display: inline-block; background: linear-gradient(135deg, #0284c7 0%, #0369a1 100%); color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 14px; font-weight: 700; font-size: 14px;\">\n        الذهاب إلى لوحة التحكم ➔\n      </a>\n    </div>\n  </div>\n  \n  <div style=\"background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;\">\n    © {{platform_name}} - فريق الأمان والامتثال.\n  </div>\n</div>','مرحباً {{name}}، تمت مراجعة مستنداتك وتوثيق حسابك بنجاح.','[\"name\", \"platform_name\", \"dashboard_url\"]',1,'2026-09-22 00:25:48','2026-09-22 00:25:48'),('bd5534fe-2012-476e-b182-33d7ebb7d80e','الموافقة على طلب السحب وتحويل المبلغ (Withdrawal Approved)','withdrawal-approved','تمت معالجة وتحويل طلب السحب الخاص بك بقيمة ${{amount}} 🏦','<div dir=\"rtl\" style=\"font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);\">\n  <div style=\"background: linear-gradient(135deg, #4f46e5 0%, #6366f1 100%); padding: 35px 30px; text-align: center;\">\n    <h1 style=\"color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;\">تم تحويل أرباحك بنجاح 🏦</h1>\n    <p style=\"color: #e0e7ff; margin: 6px 0 0 0; font-size: 14px;\">Nextvora Financial Department</p>\n  </div>\n  \n  <div style=\"padding: 35px 30px;\">\n    <h2 style=\"color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;\">مرحباً {{name}}،</h2>\n    <p style=\"color: #475569; font-size: 15px; line-height: 1.7;\">\n      يسعدنا إعلامك بأنه تمت الموافقة على طلب سحب أرباحك وإتمام عملية التحويل المالي إلى حسابك.\n    </p>\n\n    <div style=\"background-color: #eef2ff; border: 1px solid #c7d2fe; border-radius: 16px; padding: 20px; margin: 20px 0;\">\n      <table style=\"width: 100%; border-collapse: collapse; font-size: 14px;\">\n        <tr style=\"border-bottom: 1px solid #e0e7ff;\">\n          <td style=\"padding: 10px 0; color: #3730a3;\">المبلغ المحول:</td>\n          <td style=\"padding: 10px 0; font-weight: 900; color: #4338ca; text-align: left; font-size: 18px; font-family: monospace;\">{{amount}} {{currency}}</td>\n        </tr>\n        <tr style=\"border-bottom: 1px solid #e0e7ff;\">\n          <td style=\"padding: 10px 0; color: #3730a3;\">طريقة الدفع / التحويل:</td>\n          <td style=\"padding: 10px 0; font-weight: 600; color: #1e293b; text-align: left;\">{{payment_method}}</td>\n        </tr>\n        <tr style=\"border-bottom: 1px solid #e0e7ff;\">\n          <td style=\"padding: 10px 0; color: #3730a3;\">إثبات / مرجع التحويل:</td>\n          <td style=\"padding: 10px 0; font-weight: 600; color: #1e293b; text-align: left; font-family: monospace;\">{{transaction_proof}}</td>\n        </tr>\n        <tr>\n          <td style=\"padding: 10px 0; color: #3730a3;\">تاريخ الإتمام:</td>\n          <td style=\"padding: 10px 0; font-weight: 600; color: #475569; text-align: left;\">{{date}}</td>\n        </tr>\n      </table>\n    </div>\n\n    <p style=\"color: #64748b; font-size: 13px;\">\n      قد يستغرق ظهور الرصيد في حسابك البنكي أو محفظتك الخارجية وقتاً يسيراً حسب الجهة المالية المحددة.\n    </p>\n  </div>\n  \n  <div style=\"background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;\">\n    © {{platform_name}} - الإدارة المالية.\n  </div>\n</div>','مرحباً {{name}}، تمت معالجة طلب سحب أرباحك بقيمة {{amount}} {{currency}} عبر {{payment_method}} بنجاح.','[\"name\", \"amount\", \"currency\", \"payment_method\", \"transaction_proof\", \"date\", \"platform_name\"]',1,'2026-09-22 00:25:48','2026-09-22 00:25:48'),('c5145068-0ba5-4bb3-b0d3-0ad6345438f0','Welcome Email','welcome','Welcome to {{platform_name}}!','<h1>Welcome {{user_name}}!</h1>',NULL,'[\"user_name\", \"platform_name\"]',1,'2026-03-03 15:55:00','2026-03-03 15:55:00'),('c6267130-ebe2-4f2b-9d35-bf600b8cbf15','تأكيد شراء باقة اشتراك (Package Purchase)','package-purchased','تهانينا! تم تفعيل باقة {{package_name}} الخاصة بك بنجاح 🎓','<div dir=\"rtl\" style=\"font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);\">\n  <div style=\"background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 35px 30px; text-align: center;\">\n    <h1 style=\"color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;\">تم تفعيل باقتك بنجاح! 🎓</h1>\n    <p style=\"color: #f3e8ff; margin: 6px 0 0 0; font-size: 14px;\">Nextvora Educational Membership</p>\n  </div>\n  \n  <div style=\"padding: 35px 30px;\">\n    <h2 style=\"color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;\">أهلاً {{name}}،</h2>\n    <p style=\"color: #475569; font-size: 15px; line-height: 1.7;\">\n      تهانينا! تم تفعيل باقتك التعليمية الجديدة بنجاح، ويمكنك الآن الوصول الفوري إلى جميع الدورات والمميزات الحصرية المشمولة في باقتك.\n    </p>\n\n    <div style=\"background-color: #faf5ff; border: 1px solid #e9d5ff; border-radius: 16px; padding: 20px; margin: 20px 0;\">\n      <table style=\"width: 100%; border-collapse: collapse; font-size: 14px;\">\n        <tr style=\"border-bottom: 1px solid #f3e8ff;\">\n          <td style=\"padding: 10px 0; color: #6b21a8;\">اسم الباقة:</td>\n          <td style=\"padding: 10px 0; font-weight: 900; color: #7e22ce; text-align: left; font-size: 16px;\">{{package_name}}</td>\n        </tr>\n        <tr style=\"border-bottom: 1px solid #f3e8ff;\">\n          <td style=\"padding: 10px 0; color: #6b21a8;\">المستوى / الفئة:</td>\n          <td style=\"padding: 10px 0; font-weight: 700; color: #1e293b; text-align: left; text-transform: uppercase;\">{{tier}}</td>\n        </tr>\n        <tr style=\"border-bottom: 1px solid #f3e8ff;\">\n          <td style=\"padding: 10px 0; color: #6b21a8;\">القيمة:</td>\n          <td style=\"padding: 10px 0; font-weight: 800; color: #047857; text-align: left; font-family: monospace;\">{{price}} {{currency}}</td>\n        </tr>\n      </table>\n    </div>\n\n    <div style=\"text-align: center; margin: 30px 0 10px 0;\">\n      <a href=\"{{academy_url}}\" style=\"display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); color: #ffffff; text-decoration: none; padding: 12px 32px; border-radius: 14px; font-weight: 700; font-size: 14px;\">\n        بدء مشاهدة الدورات والدروس ➔\n      </a>\n    </div>\n  </div>\n  \n  <div style=\"background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 18px; text-align: center; color: #94a3b8; font-size: 12px;\">\n    © {{platform_name}} - أكاديمية التميز.\n  </div>\n</div>','مرحباً {{name}}، تم تفعيل باقة {{package_name}} الخاصة بك بنجاح بقيمة {{price}} {{currency}}.','[\"name\", \"package_name\", \"price\", \"currency\", \"tier\", \"platform_name\"]',1,'2026-09-22 00:25:48','2026-09-22 00:25:48'),('eb754b10-500b-4011-be96-7ab34c3158b6','كود التحقق لتفعيل الحساب (Registration OTP)','registration-otp','كود التحقق الخاص بك لتفعيل حساب Nextvora: {{otp_code}}','<div dir=\"rtl\" style=\"font-family: -apple-system, BlinkMacSystemFont, \'Segoe UI\', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #ede9fe; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(124, 58, 237, 0.08);\">\n  <div style=\"background: linear-gradient(135deg, #7c3aed 0%, #9333ea 100%); padding: 40px 30px; text-align: center;\">\n    <h1 style=\"color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;\">Nextvora</h1>\n    <p style=\"color: #ede9fe; margin: 8px 0 0 0; font-size: 14px;\">تفعيل الحساب والتحقق من الهوية</p>\n  </div>\n  \n  <div style=\"padding: 35px 30px;\">\n    <h2 style=\"color: #1e293b; font-size: 20px; font-weight: 700; margin-top: 0;\">مرحباً بك {{name}} 👋</h2>\n    <p style=\"color: #475569; font-size: 15px; line-height: 1.7;\">\n      شكراً لانضمامك إلى مجتمع <strong>{{platform_name}}</strong>. لتأكيد حسابك والبدء في استخدام كافة ميزات المنصة، يرجى إدخال رمز التحقق (OTP) التالي:\n    </p>\n    \n    <div style=\"margin: 30px 0; text-align: center;\">\n      <div style=\"display: inline-block; background-color: #f5f3ff; border: 2px dashed #a855f7; border-radius: 16px; padding: 18px 36px; font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #6d28d9; font-family: monospace;\">\n        {{otp_code}}\n      </div>\n      <p style=\"color: #64748b; font-size: 13px; margin-top: 10px;\">هذا الرمز صالح للاستخدام لمدة {{expires_in}} دقيقة فقط.</p>\n    </div>\n    \n    <div style=\"background-color: #f8fafc; border-radius: 12px; padding: 16px; border: 1px solid #f1f5f9; margin-top: 25px;\">\n      <p style=\"color: #64748b; font-size: 13px; margin: 0; line-height: 1.6;\">\n        🔒 لأسباب أمنية، لا تشارك هذا الرمز مع أي شخص. فريق الدعم في Nextvora لن يطلب منك هذا الرمز أبداً.\n      </p>\n    </div>\n  </div>\n  \n  <div style=\"background-color: #fbfbfe; border-top: 1px solid #f1f5f9; padding: 20px; text-align: center; color: #94a3b8; font-size: 12px;\">\n    © {{platform_name}} - جميع الحقوق محفوظة.\n  </div>\n</div>','مرحباً {{name}}، كود التحقق الخاص بك في منصة Nextvora هو: {{otp_code}}. صالح لمدة {{expires_in}} دقيقة.','[\"name\", \"otp_code\", \"platform_name\", \"expires_in\"]',1,'2026-09-22 00:25:48','2026-09-22 00:25:48');
/*!40000 ALTER TABLE `email_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formation_content`
--

DROP TABLE IF EXISTS `formation_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formation_content` (
  `id` varchar(36) NOT NULL,
  `formation_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content_type` enum('video','pdf','quiz','text') NOT NULL,
  `file_url` text,
  `duration_seconds` int(11) DEFAULT NULL,
  `order_index` int(11) DEFAULT '0',
  `quiz_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `formation_id` (`formation_id`),
  CONSTRAINT `formation_content_ibfk_1` FOREIGN KEY (`formation_id`) REFERENCES `formations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formation_content`
--

LOCK TABLES `formation_content` WRITE;
/*!40000 ALTER TABLE `formation_content` DISABLE KEYS */;
/*!40000 ALTER TABLE `formation_content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formation_enrollments`
--

DROP TABLE IF EXISTS `formation_enrollments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formation_enrollments` (
  `id` varchar(36) NOT NULL,
  `formation_id` varchar(36) NOT NULL,
  `student_id` varchar(36) NOT NULL,
  `payment_status` enum('pending','approved','rejected') DEFAULT 'pending',
  `payment_id` varchar(36) DEFAULT NULL,
  `enrolled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `formation_id` (`formation_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `formation_enrollments_ibfk_1` FOREIGN KEY (`formation_id`) REFERENCES `formations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `formation_enrollments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formation_enrollments`
--

LOCK TABLES `formation_enrollments` WRITE;
/*!40000 ALTER TABLE `formation_enrollments` DISABLE KEYS */;
INSERT INTO `formation_enrollments` VALUES ('110b5164-244c-4a9b-8069-e139006825f4','b2c4af36-6711-489f-b798-297079e12409','1e33a8e8-5b9f-40b5-9177-207bbd705f5d','approved',NULL,'2026-09-20 19:26:01'),('cf84f9be-bb5c-408c-932e-1a6424842d9e','b2c4af36-6711-489f-b798-297079e12409','d80012e2-434f-4362-bcf9-00004e11c3e6','approved',NULL,'2026-09-22 02:12:41'),('f75f2ff8-215b-4dbf-b321-34c9dd7f5934','b2c4af36-6711-489f-b798-297079e12409','2a4f0e02-a27b-42d9-8f1f-93eba46f5ef0','approved',NULL,'2026-09-24 06:44:15');
/*!40000 ALTER TABLE `formation_enrollments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formation_payments`
--

DROP TABLE IF EXISTS `formation_payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formation_payments` (
  `id` varchar(36) NOT NULL,
  `formation_id` varchar(36) NOT NULL,
  `student_id` varchar(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'USD',
  `payment_method` varchar(100) NOT NULL,
  `reference_number` varchar(100) DEFAULT NULL,
  `receipt_url` text,
  `notes` text,
  `status` enum('pending','approved','rejected') DEFAULT 'pending',
  `admin_notes` text,
  `reviewed_by` varchar(36) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `formation_id` (`formation_id`),
  KEY `student_id` (`student_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `formation_payments_ibfk_1` FOREIGN KEY (`formation_id`) REFERENCES `formations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `formation_payments_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `formation_payments_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formation_payments`
--

LOCK TABLES `formation_payments` WRITE;
/*!40000 ALTER TABLE `formation_payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `formation_payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formation_progress`
--

DROP TABLE IF EXISTS `formation_progress`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formation_progress` (
  `id` varchar(36) NOT NULL,
  `enrollment_id` varchar(36) NOT NULL,
  `content_id` varchar(36) NOT NULL,
  `watched_seconds` int(11) DEFAULT '0',
  `completed` tinyint(1) DEFAULT '0',
  `completed_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `enrollment_id` (`enrollment_id`,`content_id`),
  KEY `content_id` (`content_id`),
  CONSTRAINT `formation_progress_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `formation_enrollments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `formation_progress_ibfk_2` FOREIGN KEY (`content_id`) REFERENCES `formation_content` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formation_progress`
--

LOCK TABLES `formation_progress` WRITE;
/*!40000 ALTER TABLE `formation_progress` DISABLE KEYS */;
/*!40000 ALTER TABLE `formation_progress` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formation_quiz_attempts`
--

DROP TABLE IF EXISTS `formation_quiz_attempts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formation_quiz_attempts` (
  `id` varchar(36) NOT NULL,
  `enrollment_id` varchar(36) NOT NULL,
  `quiz_id` varchar(36) NOT NULL,
  `answers` json NOT NULL,
  `score` int(11) NOT NULL,
  `passed` tinyint(1) NOT NULL,
  `completed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `enrollment_id` (`enrollment_id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `formation_quiz_attempts_ibfk_1` FOREIGN KEY (`enrollment_id`) REFERENCES `formation_enrollments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `formation_quiz_attempts_ibfk_2` FOREIGN KEY (`quiz_id`) REFERENCES `formation_quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formation_quiz_attempts`
--

LOCK TABLES `formation_quiz_attempts` WRITE;
/*!40000 ALTER TABLE `formation_quiz_attempts` DISABLE KEYS */;
/*!40000 ALTER TABLE `formation_quiz_attempts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formation_quiz_questions`
--

DROP TABLE IF EXISTS `formation_quiz_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formation_quiz_questions` (
  `id` varchar(36) NOT NULL,
  `quiz_id` varchar(36) NOT NULL,
  `question_text` text NOT NULL,
  `options` json NOT NULL,
  `correct_option_index` int(11) NOT NULL,
  `order_index` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `quiz_id` (`quiz_id`),
  CONSTRAINT `formation_quiz_questions_ibfk_1` FOREIGN KEY (`quiz_id`) REFERENCES `formation_quizzes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formation_quiz_questions`
--

LOCK TABLES `formation_quiz_questions` WRITE;
/*!40000 ALTER TABLE `formation_quiz_questions` DISABLE KEYS */;
/*!40000 ALTER TABLE `formation_quiz_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formation_quizzes`
--

DROP TABLE IF EXISTS `formation_quizzes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formation_quizzes` (
  `id` varchar(36) NOT NULL,
  `formation_id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `passing_score` int(11) DEFAULT '70',
  `order_index` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `formation_id` (`formation_id`),
  CONSTRAINT `formation_quizzes_ibfk_1` FOREIGN KEY (`formation_id`) REFERENCES `formations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formation_quizzes`
--

LOCK TABLES `formation_quizzes` WRITE;
/*!40000 ALTER TABLE `formation_quizzes` DISABLE KEYS */;
/*!40000 ALTER TABLE `formation_quizzes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formations`
--

DROP TABLE IF EXISTS `formations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `formations` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'USD',
  `thumbnail_url` text,
  `is_published` tinyint(1) DEFAULT '0',
  `created_by` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `formations_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formations`
--

LOCK TABLES `formations` WRITE;
/*!40000 ALTER TABLE `formations` DISABLE KEYS */;
INSERT INTO `formations` VALUES ('b2c4af36-6711-489f-b798-297079e12409','','',100.00,'USD','http://localhost:5000/uploads/file-1775989330499-cfb80fea.jpeg',1,'71ddaa9a-1fc1-4a18-aeea-512d9787e684','2026-04-12 10:22:10','2026-04-12 10:22:10');
/*!40000 ALTER TABLE `formations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `holidays`
--

DROP TABLE IF EXISTS `holidays`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `holidays` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `start_date` date NOT NULL,
  `end_date` date NOT NULL,
  `type` varchar(50) DEFAULT 'holiday',
  `is_recurring` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `holidays`
--

LOCK TABLES `holidays` WRITE;
/*!40000 ALTER TABLE `holidays` DISABLE KEYS */;
/*!40000 ALTER TABLE `holidays` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `leader_achievers`
--

DROP TABLE IF EXISTS `leader_achievers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `leader_achievers` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `rank_id` varchar(36) NOT NULL,
  `direct_sales_at_time` decimal(10,2) DEFAULT '0.00',
  `team_turnover_at_time` decimal(10,2) DEFAULT '0.00',
  `reward_amount` decimal(10,2) DEFAULT '0.00',
  `reward_paid` tinyint(1) DEFAULT '0',
  `achieved_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_la_user` (`user_id`),
  KEY `fk_la_rank` (`rank_id`),
  CONSTRAINT `fk_la_rank` FOREIGN KEY (`rank_id`) REFERENCES `ranks` (`id`),
  CONSTRAINT `fk_la_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `leader_achievers`
--

LOCK TABLES `leader_achievers` WRITE;
/*!40000 ALTER TABLE `leader_achievers` DISABLE KEYS */;
/*!40000 ALTER TABLE `leader_achievers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `meeting_attendance`
--

DROP TABLE IF EXISTS `meeting_attendance`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `meeting_attendance` (
  `id` varchar(36) NOT NULL,
  `meeting_id` varchar(36) NOT NULL,
  `student_id` varchar(36) NOT NULL,
  `status` varchar(50) DEFAULT 'absent',
  `joined_at` timestamp NULL DEFAULT NULL,
  `left_at` timestamp NULL DEFAULT NULL,
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `meeting_id` (`meeting_id`,`student_id`),
  KEY `student_id` (`student_id`),
  CONSTRAINT `meeting_attendance_ibfk_1` FOREIGN KEY (`meeting_id`) REFERENCES `zoom_meetings` (`id`) ON DELETE CASCADE,
  CONSTRAINT `meeting_attendance_ibfk_2` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `meeting_attendance`
--

LOCK TABLES `meeting_attendance` WRITE;
/*!40000 ALTER TABLE `meeting_attendance` DISABLE KEYS */;
/*!40000 ALTER TABLE `meeting_attendance` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `message_reactions`
--

DROP TABLE IF EXISTS `message_reactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `message_reactions` (
  `id` varchar(36) NOT NULL,
  `message_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `emoji` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `message_id` (`message_id`,`user_id`,`emoji`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `message_reactions_ibfk_1` FOREIGN KEY (`message_id`) REFERENCES `messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `message_reactions_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `message_reactions`
--

LOCK TABLES `message_reactions` WRITE;
/*!40000 ALTER TABLE `message_reactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `message_reactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` varchar(36) NOT NULL,
  `conversation_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `attachment_url` text,
  `attachment_type` varchar(100) DEFAULT NULL,
  `reply_to_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `conversation_id` (`conversation_id`),
  KEY `sender_id` (`sender_id`),
  KEY `reply_to_id` (`reply_to_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_3` FOREIGN KEY (`reply_to_id`) REFERENCES `messages` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `modules`
--

DROP TABLE IF EXISTS `modules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `modules` (
  `id` varchar(36) NOT NULL,
  `code` varchar(50) NOT NULL,
  `name` varchar(255) NOT NULL,
  `specialty_id` varchar(36) DEFAULT NULL,
  `teacher_id` varchar(36) DEFAULT NULL,
  `hours` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `specialty_id` (`specialty_id`),
  KEY `teacher_id` (`teacher_id`),
  CONSTRAINT `modules_ibfk_1` FOREIGN KEY (`specialty_id`) REFERENCES `specialties` (`id`) ON DELETE CASCADE,
  CONSTRAINT `modules_ibfk_2` FOREIGN KEY (`teacher_id`) REFERENCES `teachers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `modules`
--

LOCK TABLES `modules` WRITE;
/*!40000 ALTER TABLE `modules` DISABLE KEYS */;
/*!40000 ALTER TABLE `modules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `news`
--

DROP TABLE IF EXISTS `news`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `news` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `type` varchar(50) DEFAULT 'news',
  `priority` varchar(50) DEFAULT 'medium',
  `target_audience` varchar(50) DEFAULT 'all',
  `author_id` varchar(36) DEFAULT NULL,
  `is_published` tinyint(1) DEFAULT '1',
  `published_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `author_id` (`author_id`),
  CONSTRAINT `news_ibfk_1` FOREIGN KEY (`author_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `news`
--

LOCK TABLES `news` WRITE;
/*!40000 ALTER TABLE `news` DISABLE KEYS */;
/*!40000 ALTER TABLE `news` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` varchar(50) NOT NULL,
  `title` varchar(255) NOT NULL,
  `content` text,
  `reference_id` varchar(36) DEFAULT NULL,
  `reference_type` varchar(100) DEFAULT NULL,
  `is_read` tinyint(1) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `notifications_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES ('14facf43-ed61-4d77-b1bd-2fed6a6eb294','71ddaa9a-1fc1-4a18-aeea-512d9787e684','deposit','طلب إيداع رصيد جديد','قام الطالب بتقديم طلب إيداع محفظة بقيمة $100 USD عبر usdt.',NULL,NULL,0,'2026-09-20 19:24:48'),('3a126490-596e-43a6-861e-f547262998b0','71ddaa9a-1fc1-4a18-aeea-512d9787e684','deposit','طلب إيداع رصيد جديد','قام الطالب بتقديم طلب إيداع محفظة بقيمة $100 USD عبر baridimob.',NULL,NULL,0,'2026-09-22 02:26:34'),('4304a21c-c5f0-49fe-8549-a4891fec42a5','71ddaa9a-1fc1-4a18-aeea-512d9787e684','deposit','طلب إيداع رصيد جديد','قام الطالب بتقديم طلب إيداع محفظة بقيمة $100 USD عبر usdt.',NULL,NULL,0,'2026-09-20 19:23:23'),('6e0b002c-736c-47ed-b0dc-5e8595bee403','71ddaa9a-1fc1-4a18-aeea-512d9787e684','deposit','طلب إيداع رصيد جديد','قام الطالب بتقديم طلب إيداع محفظة بقيمة $100 USD عبر baridimob.',NULL,NULL,0,'2026-09-22 02:26:09'),('7998b309-4ed6-4274-bd76-0f59d867a015','71ddaa9a-1fc1-4a18-aeea-512d9787e684','deposit','طلب إيداع رصيد جديد','قام الطالب بتقديم طلب إيداع محفظة بقيمة $100 USD عبر usdt.',NULL,NULL,0,'2026-09-20 19:26:54'),('8b8c6874-e767-47d4-8a70-c3f7562cfb60','71ddaa9a-1fc1-4a18-aeea-512d9787e684','commission','عمولة تسويقية جديدة','مبروك! حصلت على عمولة بقيمة $100 (10%) من مبيعات الجيل 1 لشراء باقة النخبة (VIP).',NULL,NULL,0,'2026-09-20 03:14:57'),('a184c624-ca16-4914-8d86-9a995076cd9d','79151f5e-a6ca-4b6b-b715-9527ed848e53','commission','عمولة تسويقية جديدة','مبروك! حصلت على عمولة بقيمة $10 (10%) من مبيعات الجيل 1 لشراء الباقة الأساسية.',NULL,NULL,0,'2026-09-22 02:26:34'),('a22b66d2-6b4d-4da5-993b-de6d8a965e88','71ddaa9a-1fc1-4a18-aeea-512d9787e684','deposit','طلب إيداع رصيد جديد','قام الطالب بتقديم طلب إيداع محفظة بقيمة $150 USD عبر baridimob.',NULL,NULL,0,'2026-09-20 19:22:39'),('a6c104e3-5935-49ba-a00b-5a52406f66d8','fc831146-6347-4168-ab54-356b1d0a522a','deposit','تم تأكيد شحن المحفظة','تمت الموافقة على طلب إيداعك بقيمة $100.00 USD وإضافته إلى رصيد محفظتك. رصيدك الحالي: $350.00 USD.',NULL,NULL,0,'2026-09-20 19:24:48'),('bdd01a93-7e6f-4e87-b0e5-87a1ec324ab0','fc831146-6347-4168-ab54-356b1d0a522a','deposit','تم تأكيد شحن المحفظة','تمت الموافقة على طلب إيداعك بقيمة $150.00 USD وإضافته إلى رصيد محفظتك. رصيدك الحالي: $150.00 USD.',NULL,NULL,0,'2026-09-20 19:22:40'),('c421bece-2929-414b-8a1a-f02a58b3cb0b','71ddaa9a-1fc1-4a18-aeea-512d9787e684','deposit','طلب إيداع رصيد جديد','قام الطالب بتقديم طلب إيداع محفظة بقيمة $75 USD عبر baridimob.',NULL,NULL,0,'2026-09-22 02:25:01'),('d3d865dc-a4cc-4d92-85cf-d272c33da1ff','fc831146-6347-4168-ab54-356b1d0a522a','deposit','تم تأكيد شحن المحفظة','تمت الموافقة على طلب إيداعك بقيمة $100.00 USD وإضافته إلى رصيد محفظتك. رصيدك الحالي: $450.00 USD.',NULL,NULL,0,'2026-09-20 19:26:54'),('d88bd321-61dd-4387-80c9-7785caab4a2b','fc831146-6347-4168-ab54-356b1d0a522a','deposit','تم تأكيد شحن المحفظة','تمت الموافقة على طلب إيداعك بقيمة $100.00 USD وإضافته إلى رصيد محفظتك. رصيدك الحالي: $450.00 USD.',NULL,NULL,0,'2026-09-20 19:26:01'),('de4d7e68-bccf-4814-97b8-a16fe7767629','fc831146-6347-4168-ab54-356b1d0a522a','deposit','تم تأكيد شحن المحفظة','تمت الموافقة على طلب إيداعك بقيمة $100.00 USD وإضافته إلى رصيد محفظتك. رصيدك الحالي: $250.00 USD.',NULL,NULL,0,'2026-09-20 19:23:23'),('e5cec8ba-4e19-4686-9ec9-8313dbdb717e','71ddaa9a-1fc1-4a18-aeea-512d9787e684','deposit','طلب إيداع رصيد جديد','قام الطالب بتقديم طلب إيداع محفظة بقيمة $100 USD عبر usdt.',NULL,NULL,0,'2026-09-20 19:26:01');
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `package_courses`
--

DROP TABLE IF EXISTS `package_courses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `package_courses` (
  `id` varchar(36) NOT NULL,
  `package_id` varchar(36) NOT NULL,
  `formation_id` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_package_formation` (`package_id`,`formation_id`),
  KEY `fk_pc_formation` (`formation_id`),
  CONSTRAINT `fk_pc_formation` FOREIGN KEY (`formation_id`) REFERENCES `formations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pc_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `package_courses`
--

LOCK TABLES `package_courses` WRITE;
/*!40000 ALTER TABLE `package_courses` DISABLE KEYS */;
INSERT INTO `package_courses` VALUES ('43c047a0-04ab-4779-b345-ce319287c55d','43d59e19-9b65-4206-9ca5-a3d20007bb5b','b2c4af36-6711-489f-b798-297079e12409','2026-09-20 18:10:44'),('bea2a874-cba4-4dbd-857b-55902749433d','49eec1c0-0b57-427d-a59e-4ef7b0979102','b2c4af36-6711-489f-b798-297079e12409','2026-09-20 19:06:48');
/*!40000 ALTER TABLE `package_courses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `packages`
--

DROP TABLE IF EXISTS `packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `packages` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `name_ar` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `slug` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `level` int(11) NOT NULL,
  `unlocked_generations` int(11) NOT NULL DEFAULT '1',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `description_ar` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `features` text CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci,
  `badge_text` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `slug` (`slug`),
  UNIQUE KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `packages`
--

LOCK TABLES `packages` WRITE;
/*!40000 ALTER TABLE `packages` DISABLE KEYS */;
INSERT INTO `packages` VALUES ('43d59e19-9b65-4206-9ca5-a3d20007bb5b','CORE','CORE — الأساس','core-50',50.00,1,2,'Core membership & project overview access','اشتراك العضوية في الأكاديمية والوصول إلى الفيديوهات التعريفية بالمشروع وتفعيل رابط الإحالة.','[\"اشتراك العضوية في المنصة\",\"فيديوهات تعريفية بالمشروع (يحددها الأدمن)\",\"تفعيل كود ورابط الإحالة الخاص بك\",\"أرباح تسويق بالعمولة (الجيل 1 و 2)\",\"محفظة مالية لسحب العمولات\"]','اشتراك العضوية',1,'2026-09-20 03:08:16','2026-09-23 16:14:47'),('49eec1c0-0b57-427d-a59e-4ef7b0979102','FLOW','FLOW — الانطلاقة (المستوى 1)','flow-150',150.00,2,3,'Level 1: E-Commerce & Digital Business powered by AI','المستوى 1: التجارة الإلكترونية والبيزنس الرقمي من الصفر إلى الاحتراف بالذكاء الاصطناعي.','[\"إنشاء متجر إلكتروني متكامل بالذكاء الاصطناعي\",\"إنشاء علامة تجارية وهوية بصرية كاملة\",\"إنشاء المحتوى وفيديوهات UGC بالذكاء الاصطناعي\",\"إدارة المحتوى عبر المنصات (Instagram, TikTok, Facebook)\",\"البحث عن المنتجات الرابحة (Product Research)\",\"إنشاء وتصميم الإعلانات الممولة\",\"إدارة الحملات (Meta, TikTok, Snapchat Ads)\",\"تحليل النتائج وتحسين الحملات الإعلانية\",\"أرباح تسويق بالعمولة حتى الجيل 3\"]','المستوى 1: الأكثر طلباً',1,'2026-09-20 03:08:16','2026-09-23 16:14:47'),('4b72233e-e1ce-4e55-9080-dc4d55724fd8','GROW','GROW — النمو (المستوى 2)','grow-500',500.00,3,4,'Level 2: AI Agents, Workflows & Automation','المستوى 2: بناء وكلاء الذكاء الاصطناعي وأنظمة الأتمتة والمنتجات الرقمية.','[\"يشمل جميع محتويات المستوى 1 (FLOW)\",\"إنشاء وكلاء الذكاء الاصطناعي (AI Agents)\",\"وكلاء للتسويق، خدمة العملاء، والبحث وصناعة المحتوى\",\"إنشاء أنظمة الأتمتة الذكية (AI Workflows)\",\"ربط المنصات وأتمتة التجارة الإلكترونية\",\"مواكبة أحدث أدوات ونماذج الذكاء الاصطناعي\",\"البرمجة بمساعدة الذكاء الاصطناعي وإصلاح الأكواد\",\"إنشاء تطبيقات ومشاريع SaaS باستخدام AI\",\"أرباح تسويق بالعمولة حتى الجيل 4\"]','المستوى 2: قيمة ممتازة',1,'2026-09-20 03:08:16','2026-09-23 16:14:47'),('692a2b4b-5b99-4b37-a723-13d039b78264','PRIME','PRIME — التميز (المستوى 3)','prime-1000',1000.00,4,5,'Level 3: AI Builder, SaaS & 1-on-1 Mentorship','المستوى 3: بناء المواقع والتطبيقات والـ SaaS بالذكاء الاصطناعي + مرافقة شخصية.','[\"يشمل جميع محتويات المستوى 1 و 2 (FLOW + GROW)\",\"البرمجة المتقدمة (ChatGPT, Codex, Google AI Studio, Antigravity, VS Code)\",\"إنشاء المواقع والتطبيقات ولوحات التحكم والأنظمة والـ APIs\",\"بناء SaaS كامل: الفكرة ← UX/UI ← البرمجة ← الإطلاق ← تحقيق الدخل\",\"👨‍🏫 مرافقة شخصية: جلستان شهرياً لدراسة وتوجيه مشروعك\",\"♾️ وصول Premium كامل لجميع الدورات والتحديثات والـ Workflows\",\"أرباح تسويق بالعمولة حتى الجيل 5 بالكامل\"]','المستوى 3: VIP النخبة',1,'2026-09-20 03:08:16','2026-09-23 16:15:13');
/*!40000 ALTER TABLE `packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_methods`
--

DROP TABLE IF EXISTS `payment_methods`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_methods` (
  `id` varchar(36) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `name_ar` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `type` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `provider` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'manual',
  `currency` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'USD',
  `crypto_currency` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'USDT_BEP20',
  `crypto_network` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'BEP20',
  `crypto_wallet_address` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `bank_name` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_holder` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `account_number` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `swift_code` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `instructions` text COLLATE utf8mb4_unicode_ci,
  `instructions_ar` text COLLATE utf8mb4_unicode_ci,
  `require_receipt` tinyint(1) DEFAULT '1',
  `api_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `secret_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `public_key` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `webhook_secret` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `is_sandbox` tinyint(1) DEFAULT '0',
  `min_deposit` decimal(12,2) DEFAULT '10.00',
  `max_deposit` decimal(12,2) DEFAULT '10000.00',
  `min_withdrawal` decimal(12,2) DEFAULT '20.00',
  `max_withdrawal` decimal(12,2) DEFAULT '5000.00',
  `fee_percent` decimal(5,2) DEFAULT '0.00',
  `fee_fixed` decimal(12,2) DEFAULT '0.00',
  `enabled_for_deposit` tinyint(1) DEFAULT '1',
  `enabled_for_withdrawal` tinyint(1) DEFAULT '1',
  `status` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT 'active',
  `sort_order` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_methods`
--

LOCK TABLES `payment_methods` WRITE;
/*!40000 ALTER TABLE `payment_methods` DISABLE KEYS */;
INSERT INTO `payment_methods` VALUES ('4ea72e64-8440-4eaf-a14f-08ac5cc422a5','Credit / Debit Card (Online Gateway)','الدفع الإلكتروني بالبطاقة البنكية (Visa / MasterCard)','card_gateway','stripe','USD','','','','','','','','Pay securely using your Credit or Debit Card (Visa, MasterCard, Apple Pay). Instant balance credit upon successful checkout.','قم بالدفع الفوري والآمن باستخدام بطاقتك البنكية فيزا أو ماستركارد. يتم شحن الرصيد آلياً وفورياً بعد إتمام الدفع.',0,'','','','',1,10.00,5000.00,20.00,2500.00,2.90,0.30,1,1,'active',1,'2026-09-24 06:36:22','2026-09-24 06:36:22'),('6c49cb35-3add-4b61-a619-6d12b4509b50','NOWPayments.io — USDT (BEP20)','NOWPayments.io — العملات الرقمية USDT (شبكة BEP20)','nowpayments_crypto','nowpayments','USDT','USDT_BEP20','BEP20','0x1A2B3C4D5E6F7A8B9C0D1E2F3A4B5C6D7E8F9A0B','','','','','Send USDT strictly via BNB Smart Chain (BEP20). Auto-detected and credited within 2 block confirmations.','يرجى إرسال عملة USDT حصراً عبر شبكة BNB Smart Chain (BEP20). يتم تأكيد وشحن الرصيد تلقائياً عبر NOWPayments.',0,'','','','',0,10.00,50000.00,25.00,20000.00,1.00,1.00,1,1,'active',3,'2026-09-24 06:36:22','2026-09-24 06:36:22'),('ce881cd9-4ad9-4651-9f90-d08c69c8f163','Bank Transfer / Manual Payment','التحويل البنكي اليدوي (Bank Transfer / Manuel)','bank_transfer','manual','USD','','','','Nextvora International Bank','Nextvora Academy LLC','US98 0000 1234 5678 9012 3456','NXTVUS33XXX','Please transfer the exact amount to our bank account above and upload the transfer receipt with reference number.','يرجى إرسال المبلغ المطلوب إلى الحساب البنكي أعلاه وإرفاق وصل التحويل مع رقم العملية لتأكيد وشحن رصيدك.',1,'','','','',0,20.00,25000.00,50.00,10000.00,0.00,0.00,1,1,'active',2,'2026-09-24 06:36:22','2026-09-24 06:36:22');
/*!40000 ALTER TABLE `payment_methods` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` varchar(36) NOT NULL,
  `student_id` varchar(36) NOT NULL,
  `program_id` varchar(36) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'USD',
  `payment_method` varchar(100) NOT NULL,
  `status` varchar(50) DEFAULT 'pending',
  `receipt_url` text,
  `reference_number` varchar(100) DEFAULT NULL,
  `notes` text,
  `transaction_id` varchar(255) DEFAULT NULL,
  `gateway_response` json DEFAULT NULL,
  `reviewed_by` varchar(36) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `admin_notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `student_id` (`student_id`),
  KEY `program_id` (`program_id`),
  KEY `reviewed_by` (`reviewed_by`),
  CONSTRAINT `payments_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `payments_ibfk_2` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE SET NULL,
  CONSTRAINT `payments_ibfk_3` FOREIGN KEY (`reviewed_by`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `placement_test_questions`
--

DROP TABLE IF EXISTS `placement_test_questions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `placement_test_questions` (
  `id` varchar(36) NOT NULL,
  `question_text` text NOT NULL,
  `options` json NOT NULL,
  `correct_option_index` int(11) NOT NULL,
  `points` int(11) DEFAULT '1',
  `program_weight` json DEFAULT NULL,
  `is_active` tinyint(1) DEFAULT '1',
  `order_index` int(11) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `placement_test_questions`
--

LOCK TABLES `placement_test_questions` WRITE;
/*!40000 ALTER TABLE `placement_test_questions` DISABLE KEYS */;
/*!40000 ALTER TABLE `placement_test_questions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platform_settings`
--

DROP TABLE IF EXISTS `platform_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `platform_settings` (
  `id` varchar(36) NOT NULL,
  `key` varchar(255) NOT NULL,
  `value` text,
  `type` varchar(50) DEFAULT 'text',
  `category` varchar(50) DEFAULT 'general',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `key` (`key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platform_settings`
--

LOCK TABLES `platform_settings` WRITE;
/*!40000 ALTER TABLE `platform_settings` DISABLE KEYS */;
INSERT INTO `platform_settings` VALUES ('08c65226-238f-4b6f-80c6-ef887a3742d7','affiliate_min_withdrawal','50','number','affiliate','2026-09-20 03:08:16','2026-09-20 03:08:16'),('0bd72014-9f75-4f2f-af49-2ab59970a9ff','academy_intro_title','فيديو تعريفي بمشروع ورؤية أكاديمية Nextvora','text','academy','2026-09-23 16:53:39','2026-09-23 16:53:39'),('1ff33b3d-430c-4307-a8af-9d7cc6d7784d','affiliate_gen1_rate','10','number','affiliate','2026-09-20 03:08:16','2026-09-20 03:08:16'),('2482cca9-6102-44c0-b08e-d91603540c81','academy_intro_video_url','https://www.youtube.com/embed/dQw4w9WgXcQ','text','academy','2026-09-23 16:53:39','2026-09-23 16:53:39'),('2a53b217-0c43-4172-ac2c-0bfdcba6c425','affiliate_require_pack_purchase','1','boolean','affiliate','2026-09-20 03:08:16','2026-09-20 03:08:16'),('340c0fde-f9e3-4978-b60a-138eba95df9b','footer_text','All rights reserved','text','ui_texts','2026-03-03 15:55:00','2026-03-03 15:55:00'),('49cf59f5-074b-42c0-946b-c647dfe4c7f0','academy_intro_description','مرحباً بك في أكاديمية Nextvora! دليلك الشامل للانطلاق في التجارة الإلكترونية، الأتمتة بالذكاء الاصطناعي، وبناء المنتجات الرقمية والـ SaaS من الصفر حتى تحقيق الحرية المالية.','text','academy','2026-09-23 16:53:39','2026-09-23 16:53:39'),('6b872fc0-4c4e-46d9-a8aa-345a763fd300','academy_intro_author','إدارة Nextvora','text','academy','2026-09-23 16:53:39','2026-09-23 16:53:39'),('74f7d94f-99e6-43df-97f5-4d50542952eb','accent_color','262 83% 58%','color','theme','2026-03-03 15:55:00','2026-03-03 15:55:00'),('7c1a795b-aa07-44bc-9106-5be00ac97b91','logo_url','','image','branding','2026-03-03 15:55:00','2026-09-24 06:35:38'),('8a46cd2e-114e-4bd0-bcb8-a53a6c0950d4','og_description','Nextvora - Professional Education & E-Learning Platform','text','general','2026-04-06 12:33:22','2026-09-20 00:30:38'),('8fdb0f53-bf19-4545-a958-c737e00ace3d','welcome_message','Welcome to our learning platform','text','ui_texts','2026-03-03 15:55:00','2026-03-03 15:55:00'),('95108444-ea31-4374-97d9-61fa2e1d275f','affiliate_gen4_rate','2','number','affiliate','2026-09-20 03:08:16','2026-09-20 03:08:16'),('96dee5b7-3f28-4133-913a-03445979ecb9','academy_intro_badge','دليل البداية للمشروع','text','academy','2026-09-23 16:53:39','2026-09-23 16:53:39'),('a29b080b-5ef7-4f0e-bb8b-c87d0440d7ad','og_title','Nextvora','text','general','2026-04-06 12:33:25','2026-09-20 00:30:38'),('a3d99b24-ce42-42d8-a235-00354ebc1455','platform_name','Nextvora','text','branding','2026-03-03 15:55:00','2026-09-20 00:30:38'),('a3ff70bb-4ad1-46e3-a7c1-770e851e99eb','site_title','Nextvora','text','general','2026-04-06 12:32:45','2026-09-20 00:30:38'),('b8249a52-88aa-48d0-bed0-b671f4eb4557','affiliate_gen2_rate','4','number','affiliate','2026-09-20 03:08:16','2026-09-20 03:08:16'),('b8f343bb-c36c-4d15-8832-deaba13ee998','affiliate_gen3_rate','3','number','affiliate','2026-09-20 03:08:16','2026-09-20 03:08:16'),('c3bc43f0-4e77-4a3d-bb59-eff8742f49ca','affiliate_gen5_rate','1','number','affiliate','2026-09-20 03:08:16','2026-09-20 03:08:16'),('e4ed7d0a-0da8-4f38-a502-d1535dfd2197','site_description','Nextvora - Professional Education & E-Learning Platform','text','general','2026-04-06 12:33:29','2026-09-20 00:30:38'),('fe0d67ee-d992-4db8-8223-f5f74de908fd','primary_color','222 47% 11%','color','theme','2026-03-03 15:55:00','2026-03-03 15:55:00');
/*!40000 ALTER TABLE `platform_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `profiles`
--

DROP TABLE IF EXISTS `profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `profiles` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `avatar_url` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `city` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `whatsapp_number` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `bio` text,
  `date_of_birth` date DEFAULT NULL,
  PRIMARY KEY (`id`),
  CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `profiles`
--

LOCK TABLES `profiles` WRITE;
/*!40000 ALTER TABLE `profiles` DISABLE KEYS */;
INSERT INTO `profiles` VALUES ('03fcaa25-36e7-45c9-b194-a84706d57534','hicham@nextvora.com','Hicham saleh',NULL,'2026-09-23 00:35:51','2026-09-23 00:35:51','Kenitra','Morocco','+212707613493',NULL,NULL,NULL,NULL),('159e51c7-b1ff-4968-a658-20af44006c13','metanaturel7@gmail.com','HICHAM Hamani',NULL,'2026-04-18 12:40:58','2026-04-18 12:40:58','kenitra','Morocco','0628470255',NULL,NULL,NULL,NULL),('1f7a89a6-e120-4d44-9299-9c175a3fd9e1','teacher_1780138123202@example.com','API Teacher',NULL,'2026-05-30 10:48:43','2026-05-30 10:48:43','Test City','Algeria','123456789',NULL,NULL,NULL,NULL),('23ff68d2-5ed9-435c-aff9-59f9ee3d4ae4','hicham@academy.com','metanaturel7',NULL,'2026-09-24 05:42:21','2026-09-24 05:42:21','OUEZZANE','Morocco','0677887766',NULL,NULL,NULL,NULL),('479360e6-5cb8-42a3-b18b-b27c2cd6cbfe','teacher_ar@test.com','Final Teacher',NULL,'2026-04-18 15:09:03','2026-04-18 15:09:03','Cairo','Algeria','+20123456789',NULL,NULL,NULL,NULL),('71ddaa9a-1fc1-4a18-aeea-512d9787e684','admin@academy.com','Admin User',NULL,'2026-04-06 12:25:57','2026-04-06 12:25:57',NULL,NULL,NULL,NULL,NULL,NULL,NULL),('79151f5e-a6ca-4b6b-b715-9527ed848e53','teacher_final@test.com','Final Teacher',NULL,'2026-04-18 15:03:27','2026-04-18 15:03:27','Paris','Algeria','+33123456789',NULL,NULL,NULL,NULL),('a69dee56-bded-4009-8457-7801c1c87c47','test_teacher_v2@example.com','API Teacher',NULL,'2026-04-18 14:23:44','2026-04-18 14:23:44','Test City','Algeria','123456789',NULL,NULL,NULL,NULL);
/*!40000 ALTER TABLE `profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `program_pricing`
--

DROP TABLE IF EXISTS `program_pricing`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `program_pricing` (
  `id` varchar(36) NOT NULL,
  `program_id` varchar(36) NOT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT '0.00',
  `currency` varchar(10) DEFAULT 'USD',
  `is_active` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `program_id` (`program_id`),
  CONSTRAINT `program_pricing_ibfk_1` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `program_pricing`
--

LOCK TABLES `program_pricing` WRITE;
/*!40000 ALTER TABLE `program_pricing` DISABLE KEYS */;
/*!40000 ALTER TABLE `program_pricing` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `programs`
--

DROP TABLE IF EXISTS `programs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `programs` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `duration` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `programs`
--

LOCK TABLES `programs` WRITE;
/*!40000 ALTER TABLE `programs` DISABLE KEYS */;
/*!40000 ALTER TABLE `programs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ranks`
--

DROP TABLE IF EXISTS `ranks`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ranks` (
  `id` varchar(36) NOT NULL,
  `level` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_ar` varchar(100) NOT NULL,
  `badge_icon` varchar(50) DEFAULT 'Award',
  `min_direct_sales` int(11) DEFAULT '0',
  `min_team_turnover` decimal(12,2) DEFAULT '0.00',
  `reward_bonus` decimal(10,2) DEFAULT '0.00',
  `color_hex` varchar(20) DEFAULT '#7c3aed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ranks`
--

LOCK TABLES `ranks` WRITE;
/*!40000 ALTER TABLE `ranks` DISABLE KEYS */;
INSERT INTO `ranks` VALUES ('0c97e2df-8bfc-481f-b309-cd8e7247dc1a',5,'Diamond VIP','الماسي VIP','Gem',30,20000.00,1000.00,'#06b6d4','2026-09-20 03:08:16'),('2740a011-7010-4a25-a0c6-c36e8a7878ca',4,'Gold Leader','قائد ذهبي','Crown',15,8000.00,400.00,'#eab308','2026-09-20 03:08:16'),('2debe360-626f-4189-9a95-bdbac1aee594',2,'Bronze Leader','قائد برونزي','Shield',3,1000.00,50.00,'#cd7f32','2026-09-20 03:08:16'),('2fc3845f-ee26-485f-b609-a43c97d48208',1,'Member','عضو','User',0,0.00,0.00,'#94a3b8','2026-09-20 03:08:16'),('8c9b361c-ab9b-4b62-a3db-3f4c2ec53c5e',3,'Silver Leader','قائد فضي','Award',7,3000.00,150.00,'#94a3b8','2026-09-20 03:08:16');
/*!40000 ALTER TABLE `ranks` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `specialties`
--

DROP TABLE IF EXISTS `specialties`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `specialties` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `program_id` varchar(36) DEFAULT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `program_id` (`program_id`),
  CONSTRAINT `specialties_ibfk_1` FOREIGN KEY (`program_id`) REFERENCES `programs` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `specialties`
--

LOCK TABLES `specialties` WRITE;
/*!40000 ALTER TABLE `specialties` DISABLE KEYS */;
/*!40000 ALTER TABLE `specialties` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `student_test_results`
--

DROP TABLE IF EXISTS `student_test_results`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `student_test_results` (
  `id` varchar(36) NOT NULL,
  `student_id` varchar(36) NOT NULL,
  `answers` json NOT NULL,
  `score` int(11) DEFAULT '0',
  `total_points` int(11) DEFAULT '0',
  `assigned_program_id` varchar(36) DEFAULT NULL,
  `completed_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `student_id` (`student_id`),
  KEY `assigned_program_id` (`assigned_program_id`),
  CONSTRAINT `student_test_results_ibfk_1` FOREIGN KEY (`student_id`) REFERENCES `students` (`id`) ON DELETE CASCADE,
  CONSTRAINT `student_test_results_ibfk_2` FOREIGN KEY (`assigned_program_id`) REFERENCES `programs` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `student_test_results`
--

LOCK TABLES `student_test_results` WRITE;
/*!40000 ALTER TABLE `student_test_results` DISABLE KEYS */;
/*!40000 ALTER TABLE `student_test_results` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `students`
--

DROP TABLE IF EXISTS `students`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `students` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `cohort_id` varchar(36) DEFAULT NULL,
  `enrollment_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `cohort_id` (`cohort_id`),
  CONSTRAINT `students_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `students_ibfk_2` FOREIGN KEY (`cohort_id`) REFERENCES `cohorts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `students`
--

LOCK TABLES `students` WRITE;
/*!40000 ALTER TABLE `students` DISABLE KEYS */;
INSERT INTO `students` VALUES ('1e33a8e8-5b9f-40b5-9177-207bbd705f5d','fc831146-6347-4168-ab54-356b1d0a522a',NULL,NULL,'active','2026-09-20 19:26:01'),('2a4f0e02-a27b-42d9-8f1f-93eba46f5ef0','23ff68d2-5ed9-435c-aff9-59f9ee3d4ae4',NULL,NULL,'active','2026-09-24 05:42:21'),('d80012e2-434f-4362-bcf9-00004e11c3e6','159e51c7-b1ff-4968-a658-20af44006c13',NULL,NULL,'active','2026-04-18 12:40:58'),('fb618313-158f-49cb-9eda-1f57e6c69c85','03fcaa25-36e7-45c9-b194-a84706d57534',NULL,NULL,'active','2026-09-23 00:35:51');
/*!40000 ALTER TABLE `students` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `teachers`
--

DROP TABLE IF EXISTS `teachers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `teachers` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) DEFAULT NULL,
  `specialty` varchar(255) DEFAULT NULL,
  `experience` text,
  `hire_date` date DEFAULT NULL,
  `status` varchar(50) DEFAULT 'active',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `teachers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `teachers`
--

LOCK TABLES `teachers` WRITE;
/*!40000 ALTER TABLE `teachers` DISABLE KEYS */;
INSERT INTO `teachers` VALUES ('97ba8077-3d78-4af9-8a20-5229387f4a26','79151f5e-a6ca-4b6b-b715-9527ed848e53','Math','10 ans',NULL,'pending','2026-04-18 15:03:27'),('a0b44cc7-8f0f-490c-8966-50108786a026','a69dee56-bded-4009-8457-7801c1c87c47','Computer Science','5 years',NULL,'pending','2026-04-18 14:23:44'),('c019a59a-6dfb-408e-8de5-b192141adbb3','479360e6-5cb8-42a3-b18b-b27c2cd6cbfe','Lugha Arabiya','5 Sanawat',NULL,'pending','2026-04-18 15:09:03'),('c905e4ba-4e3e-4a91-81d2-93c49d00035b','1f7a89a6-e120-4d44-9299-9c175a3fd9e1','Computer Science','5 years',NULL,'pending','2026-05-30 10:48:43');
/*!40000 ALTER TABLE `teachers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `transactions`
--

DROP TABLE IF EXISTS `transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `transactions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` enum('deposit','withdrawal','commission','bonus','admin_credit','admin_debit','package_purchase') NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `currency` varchar(10) DEFAULT 'USD',
  `balance_before` decimal(10,2) DEFAULT '0.00',
  `balance_after` decimal(10,2) DEFAULT '0.00',
  `status` enum('pending','completed','failed','rejected') DEFAULT 'completed',
  `reference_id` varchar(100) DEFAULT NULL,
  `description` text,
  `metadata` json DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_tx_user` (`user_id`),
  CONSTRAINT `fk_tx_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `transactions`
--

LOCK TABLES `transactions` WRITE;
/*!40000 ALTER TABLE `transactions` DISABLE KEYS */;
INSERT INTO `transactions` VALUES ('081ba1d7-054d-45dd-a76b-20b92ab68220','fc831146-6347-4168-ab54-356b1d0a522a','deposit',150.00,'USD',0.00,150.00,'completed','BARIDI-VERIFY-1789932159947','طلب إيداع في المحفظة عبر baridimob [تم التأكيد]','{\"notes\": \"Testing deposit capability\", \"receiptUrl\": \"\", \"requestedAt\": \"2026-09-20T19:22:39.966Z\", \"paymentMethod\": \"baridimob\", \"paymentReference\": \"BARIDI-VERIFY-1789932159947\"}','2026-09-20 19:22:39'),('0d9a3f59-3b8a-4aeb-a3e7-9f8043ab6651','159e51c7-b1ff-4968-a658-20af44006c13','package_purchase',100.00,'USD',1000.00,900.00,'completed','WALLET-1790043160800','شراء باقة من رصيد المحفظة: الباقة الأساسية','{\"isUpgrade\": false, \"packageId\": \"43d59e19-9b65-4206-9ca5-a3d20007bb5b\", \"paymentMethod\": \"wallet\"}','2026-09-22 02:12:40'),('20b5b76c-6368-499b-8f1e-bc402e16211e','fc831146-6347-4168-ab54-356b1d0a522a','deposit',100.00,'USD',150.00,250.00,'completed','USDT-TRC20-TEST-1789932203158','طلب إيداع في المحفظة عبر usdt [تم التأكيد]','{\"notes\": \"Testing crypto deposit\", \"receiptUrl\": \"\", \"requestedAt\": \"2026-09-20T19:23:23.179Z\", \"paymentMethod\": \"usdt\", \"paymentReference\": \"USDT-TRC20-TEST-1789932203158\"}','2026-09-20 19:23:23'),('2325b731-21d1-4bd0-ac12-9682d780c051','fc831146-6347-4168-ab54-356b1d0a522a','package_purchase',100.00,'USD',450.00,350.00,'completed','AUTO-WALLET-TRX','شراء باقة من رصيد المحفظة: الباقة الأساسية','{\"isUpgrade\": false, \"packageId\": \"43d59e19-9b65-4206-9ca5-a3d20007bb5b\", \"paymentMethod\": \"wallet\"}','2026-09-20 19:26:01'),('37cc9222-5921-47e6-bbf7-3cec58742d28','23ff68d2-5ed9-435c-aff9-59f9ee3d4ae4','package_purchase',100.00,'USD',950.00,850.00,'completed','WALLET-1790232274108','ترقية باقة من رصيد المحفظة إلى FLOW — الانطلاقة (المستوى 1)','{\"isUpgrade\": true, \"packageId\": \"49eec1c0-0b57-427d-a59e-4ef7b0979102\", \"paymentMethod\": \"wallet\"}','2026-09-24 06:44:34'),('449cc193-bbc0-40bd-9809-493ac72fe4c5','fc831146-6347-4168-ab54-356b1d0a522a','package_purchase',150.00,'USD',450.00,300.00,'completed','AUTO-WALLET-UPGRADE','ترقية باقة من رصيد المحفظة إلى الباقة المتقدمة (برو)','{\"isUpgrade\": true, \"packageId\": \"49eec1c0-0b57-427d-a59e-4ef7b0979102\", \"paymentMethod\": \"wallet\"}','2026-09-20 19:26:54'),('4981ea00-2c56-4d30-ac26-17fa923e5e79','159e51c7-b1ff-4968-a658-20af44006c13','admin_credit',1000.00,'USD',0.00,1000.00,'completed','ADM-1790043141476','DEPOSET',NULL,'2026-09-22 02:12:21'),('5eb160ef-14e8-4f71-8d3d-d5d23344f591','fc831146-6347-4168-ab54-356b1d0a522a','deposit',100.00,'USD',350.00,450.00,'completed','USDT-TRC20-TEST-1789932414748','طلب إيداع في المحفظة عبر usdt [تم التأكيد]','{\"notes\": \"Testing crypto deposit\", \"receiptUrl\": \"\", \"requestedAt\": \"2026-09-20T19:26:54.766Z\", \"paymentMethod\": \"usdt\", \"paymentReference\": \"USDT-TRC20-TEST-1789932414748\"}','2026-09-20 19:26:54'),('a9d41e7b-7b9b-41b5-b032-8bd45cfda6b9','23ff68d2-5ed9-435c-aff9-59f9ee3d4ae4','admin_credit',1000.00,'USD',0.00,1000.00,'completed','ADM-1790232239446','VV',NULL,'2026-09-24 06:43:59'),('b8a112df-772c-48a2-a5a1-6820f511e966','23ff68d2-5ed9-435c-aff9-59f9ee3d4ae4','package_purchase',50.00,'USD',1000.00,950.00,'completed','WALLET-1790232255120','شراء باقة من رصيد المحفظة: CORE — الأساس','{\"isUpgrade\": false, \"packageId\": \"43d59e19-9b65-4206-9ca5-a3d20007bb5b\", \"paymentMethod\": \"wallet\"}','2026-09-24 06:44:15'),('c6f639de-4b63-458e-9abd-09081eb934dd','fc831146-6347-4168-ab54-356b1d0a522a','deposit',100.00,'USD',350.00,450.00,'completed','USDT-TRC20-TEST-1789932361004','طلب إيداع في المحفظة عبر usdt [تم التأكيد]','{\"notes\": \"Testing crypto deposit\", \"receiptUrl\": \"\", \"requestedAt\": \"2026-09-20T19:26:01.026Z\", \"paymentMethod\": \"usdt\", \"paymentReference\": \"USDT-TRC20-TEST-1789932361004\"}','2026-09-20 19:26:01'),('db1fe69f-ed75-4042-bb37-e4f56b04b36b','fc831146-6347-4168-ab54-356b1d0a522a','deposit',100.00,'USD',250.00,350.00,'completed','USDT-TRC20-TEST-1789932288722','طلب إيداع في المحفظة عبر usdt [تم التأكيد]','{\"notes\": \"Testing crypto deposit\", \"receiptUrl\": \"\", \"requestedAt\": \"2026-09-20T19:24:48.742Z\", \"paymentMethod\": \"usdt\", \"paymentReference\": \"USDT-TRC20-TEST-1789932288722\"}','2026-09-20 19:24:48');
/*!40000 ALTER TABLE `transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `typing_indicators`
--

DROP TABLE IF EXISTS `typing_indicators`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `typing_indicators` (
  `id` varchar(36) NOT NULL,
  `conversation_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `started_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `conversation_id` (`conversation_id`,`user_id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `typing_indicators_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `typing_indicators_ibfk_2` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `typing_indicators`
--

LOCK TABLES `typing_indicators` WRITE;
/*!40000 ALTER TABLE `typing_indicators` DISABLE KEYS */;
/*!40000 ALTER TABLE `typing_indicators` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_kyc`
--

DROP TABLE IF EXISTS `user_kyc`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_kyc` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `full_name` varchar(150) NOT NULL,
  `document_type` enum('national_id','passport','driving_license') DEFAULT 'national_id',
  `document_number` varchar(100) NOT NULL,
  `front_image_url` varchar(255) NOT NULL,
  `back_image_url` varchar(255) DEFAULT NULL,
  `status` enum('pending','verified','rejected') DEFAULT 'pending',
  `admin_notes` text,
  `reviewed_by` varchar(36) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_kyc_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_kyc`
--

LOCK TABLES `user_kyc` WRITE;
/*!40000 ALTER TABLE `user_kyc` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_kyc` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_packages`
--

DROP TABLE IF EXISTS `user_packages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_packages` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `package_id` varchar(36) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'manual',
  `payment_reference` varchar(255) DEFAULT NULL,
  `status` enum('active','expired','upgraded','pending') DEFAULT 'active',
  `is_current` tinyint(1) DEFAULT '1',
  `upgraded_from_package_id` varchar(36) DEFAULT NULL,
  `purchased_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_up_user` (`user_id`),
  KEY `fk_up_package` (`package_id`),
  CONSTRAINT `fk_up_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`),
  CONSTRAINT `fk_up_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_packages`
--

LOCK TABLES `user_packages` WRITE;
/*!40000 ALTER TABLE `user_packages` DISABLE KEYS */;
INSERT INTO `user_packages` VALUES ('0e8eb204-b62d-11f1-bef7-a08cfd9e9d75','79151f5e-a6ca-4b6b-b715-9527ed848e53','692a2b4b-5b99-4b37-a723-13d039b78264',100.00,'wallet',NULL,'active',1,NULL,'2026-09-22 02:26:31','2027-09-22 02:26:31'),('2946bd8a-7969-4afa-90cb-7aa25e27be07','23ff68d2-5ed9-435c-aff9-59f9ee3d4ae4','43d59e19-9b65-4206-9ca5-a3d20007bb5b',50.00,'wallet','WALLET-1790232255120','upgraded',0,NULL,'2026-09-24 06:44:15','2027-09-24 06:44:15'),('2df56879-d839-4a49-a548-d65b531cfe40','fc831146-6347-4168-ab54-356b1d0a522a','49eec1c0-0b57-427d-a59e-4ef7b0979102',150.00,'wallet','AUTO-WALLET-UPGRADE','active',1,'43d59e19-9b65-4206-9ca5-a3d20007bb5b','2026-09-20 19:26:54','2027-09-20 19:26:54'),('84af9c2e-37d9-4b5e-a342-3af095ce522a','159e51c7-b1ff-4968-a658-20af44006c13','43d59e19-9b65-4206-9ca5-a3d20007bb5b',100.00,'wallet','WALLET-1790043160800','active',1,NULL,'2026-09-22 02:12:40','2027-09-22 02:12:40'),('8e0279a9-d829-42ce-8b92-9d2fa316da3a','23ff68d2-5ed9-435c-aff9-59f9ee3d4ae4','49eec1c0-0b57-427d-a59e-4ef7b0979102',100.00,'wallet','WALLET-1790232274108','active',1,'43d59e19-9b65-4206-9ca5-a3d20007bb5b','2026-09-24 06:44:34','2027-09-24 06:44:34'),('9e2d83dc-f73b-476a-9653-ca0261874413','fc831146-6347-4168-ab54-356b1d0a522a','43d59e19-9b65-4206-9ca5-a3d20007bb5b',100.00,'wallet','AUTO-WALLET-TRX','upgraded',0,NULL,'2026-09-20 19:26:01','2027-09-20 19:26:01'),('c26738d6-19e5-4551-a23d-ba5ba55607d0','71ddaa9a-1fc1-4a18-aeea-512d9787e684','692a2b4b-5b99-4b37-a723-13d039b78264',1000.00,'admin_grant',NULL,'active',1,NULL,'2026-09-20 03:14:55','2027-09-20 03:14:55');
/*!40000 ALTER TABLE `user_packages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_payout_settings`
--

DROP TABLE IF EXISTS `user_payout_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_payout_settings` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `bank_name` varchar(100) DEFAULT NULL,
  `account_holder` varchar(100) DEFAULT NULL,
  `iban` varchar(50) DEFAULT NULL,
  `swift_code` varchar(50) DEFAULT NULL,
  `paypal_email` varchar(255) DEFAULT NULL,
  `payoneer_email` varchar(255) DEFAULT NULL,
  `stripe_account` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_payout_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_payout_settings`
--

LOCK TABLES `user_payout_settings` WRITE;
/*!40000 ALTER TABLE `user_payout_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `user_payout_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('admin','teacher','student') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`role`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES ('00bbe8a8-f3ff-42f6-9492-f06400ff5762','03fcaa25-36e7-45c9-b194-a84706d57534','student','2026-09-23 00:35:51'),('116c96e2-96fa-4fbe-8061-c9bb53ebc592','1f7a89a6-e120-4d44-9299-9c175a3fd9e1','teacher','2026-05-30 10:48:43'),('4b451e9d-1e3a-49f4-89f3-89b2014846b9','479360e6-5cb8-42a3-b18b-b27c2cd6cbfe','teacher','2026-04-18 15:09:03'),('7918491a-7087-4019-8d19-fa50d1e0b22b','71ddaa9a-1fc1-4a18-aeea-512d9787e684','admin','2026-04-06 12:25:57'),('aa038bfc-6082-4953-b0fe-d32e0f960eae','23ff68d2-5ed9-435c-aff9-59f9ee3d4ae4','student','2026-09-24 05:42:21'),('b8af130b-ded3-4bec-899e-b052d12cb28a','79151f5e-a6ca-4b6b-b715-9527ed848e53','teacher','2026-04-18 15:03:27'),('d3634eac-ddd5-4eb8-901f-001860fca749','a69dee56-bded-4009-8457-7801c1c87c47','teacher','2026-04-18 14:23:44');
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_wallets`
--

DROP TABLE IF EXISTS `user_wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_wallets` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `balance` decimal(10,2) DEFAULT '0.00',
  `pending_balance` decimal(10,2) DEFAULT '0.00',
  `total_earned` decimal(10,2) DEFAULT '0.00',
  `total_withdrawn` decimal(10,2) DEFAULT '0.00',
  `can_withdraw` tinyint(1) DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_wallet_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_wallets`
--

LOCK TABLES `user_wallets` WRITE;
/*!40000 ALTER TABLE `user_wallets` DISABLE KEYS */;
INSERT INTO `user_wallets` VALUES ('0d293445-926b-4c44-acbb-cedee4559062','fc831146-6347-4168-ab54-356b1d0a522a',300.00,0.00,0.00,0.00,1,'2026-09-20 03:08:15','2026-09-20 19:26:54'),('42fb9b45-b159-4c7a-a45d-b0028512608e','5a7cf940-5980-4db9-adfb-ebfc19544abe',0.00,0.00,0.00,0.00,1,'2026-09-20 03:08:15','2026-09-20 03:08:15'),('500a6408-f259-4de9-b271-3ba41510eb5a','159e51c7-b1ff-4968-a658-20af44006c13',900.00,0.00,0.00,0.00,1,'2026-09-20 03:08:15','2026-09-22 02:12:40'),('79847d80-a6e8-46da-9462-c8460173e95f','79151f5e-a6ca-4b6b-b715-9527ed848e53',10.00,0.00,10.00,0.00,1,'2026-09-20 03:08:15','2026-09-22 02:26:34'),('ab6d4666-11d1-42c6-81b6-21cd0d2fe55d','1f7a89a6-e120-4d44-9299-9c175a3fd9e1',0.00,0.00,0.00,0.00,1,'2026-09-20 03:08:15','2026-09-20 03:08:15'),('b901f2bb-ebb9-4c03-ad51-f00359085168','23ff68d2-5ed9-435c-aff9-59f9ee3d4ae4',850.00,0.00,0.00,0.00,1,'2026-09-24 05:42:21','2026-09-24 06:44:34'),('c80e14ac-8a0b-40a3-aab2-9e8a3e95d4f3','71ddaa9a-1fc1-4a18-aeea-512d9787e684',0.00,0.00,0.00,0.00,1,'2026-09-20 03:08:15','2026-09-20 03:16:04'),('d80da4c0-2118-4dd8-99c4-be630212aa0a','4c4efd91-df0f-4338-8efc-8970429855db',0.00,0.00,0.00,0.00,1,'2026-09-20 03:08:15','2026-09-20 03:08:15'),('f037631b-01ef-4935-a1ec-2b751a143616','479360e6-5cb8-42a3-b18b-b27c2cd6cbfe',0.00,0.00,0.00,0.00,1,'2026-09-20 03:08:15','2026-09-20 03:08:15'),('f253e2ff-8d32-4490-bcb4-30baabd523fb','a69dee56-bded-4009-8457-7801c1c87c47',0.00,0.00,0.00,0.00,1,'2026-09-20 03:08:15','2026-09-20 03:08:15'),('f712f4e4-d58c-48ba-a6bd-fc5a6972efbc','03fcaa25-36e7-45c9-b194-a84706d57534',0.00,0.00,0.00,0.00,1,'2026-09-23 00:35:51','2026-09-23 00:35:51');
/*!40000 ALTER TABLE `user_wallets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `role` enum('admin','teacher','student') NOT NULL DEFAULT 'student',
  `affiliate_code` varchar(20) DEFAULT NULL,
  `referrer_id` varchar(36) DEFAULT NULL,
  `affiliate_status` enum('inactive','active','suspended') DEFAULT 'active',
  `affiliate_enabled` tinyint(1) DEFAULT '1',
  `status` varchar(20) NOT NULL DEFAULT 'active',
  `kyc_status` enum('unverified','pending','verified','rejected') DEFAULT 'unverified',
  `password` varchar(255) NOT NULL,
  `wallet_pin` varchar(20) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `affiliate_code` (`affiliate_code`),
  KEY `fk_users_referrer` (`referrer_id`),
  CONSTRAINT `fk_users_referrer` FOREIGN KEY (`referrer_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES ('03fcaa25-36e7-45c9-b194-a84706d57534','hicham@nextvora.com',NULL,'student','NV596359',NULL,'active',1,'active','unverified','$2b$12$5K.w7NZjFK2n9sLlCpui6Oco/0UDs5T1F38o/6/mxJghFA2NtgJ4q',NULL,'2026-09-23 00:35:51','2026-09-23 00:35:51'),('159e51c7-b1ff-4968-a658-20af44006c13','metanaturel7@gmail.com','metanaturel7','student','NV545201',NULL,'active',1,'active','unverified','$2b$12$.AKquQKnR/8QwmJlo6undezGn90j0u9QKcUWMun4eKczM7KxrQfwq',NULL,'2026-04-18 12:40:58','2026-09-20 18:28:31'),('1f7a89a6-e120-4d44-9299-9c175a3fd9e1','teacher_1780138123202@example.com','teacher_1780138123202','teacher','NV988840',NULL,'active',1,'active','unverified','$2b$12$CAEm3rorVEhmRwm3q7JDfe4Gytn6fDrA4nkCO0XZf/3k3Y3fN9fMy','1234','2026-05-30 10:48:43','2026-09-20 18:33:59'),('23ff68d2-5ed9-435c-aff9-59f9ee3d4ae4','hicham@academy.com',NULL,'student','NV284793',NULL,'active',1,'active','unverified','$2b$12$KtDSL9PVimKaXy30ZeDNxOuQuyW9wIKF5K1WqNLQLA51cQ/mlt8gW',NULL,'2026-09-24 05:42:21','2026-09-24 05:42:21'),('479360e6-5cb8-42a3-b18b-b27c2cd6cbfe','teacher_ar@test.com','teacher_ar','teacher','NV824474',NULL,'active',1,'active','unverified','$2b$12$AO6VYmVd7kXs3BvsMzNmOOG5.NgdDd7AFjVrKeH893o.Cp3XrSRdm',NULL,'2026-04-18 15:09:03','2026-09-20 18:28:31'),('4c4efd91-df0f-4338-8efc-8970429855db','test@example.com','test','student','NV258919',NULL,'active',1,'active','unverified','$2b$10$vSiqniMOuuTjF7PDu0i8L.z./uFET.xG22i0lHuEJqK/es/qbiQXe',NULL,'2026-03-03 23:05:12','2026-09-20 18:28:31'),('5a7cf940-5980-4db9-adfb-ebfc19544abe','testuser1772576626331@academy.com','testuser1772576626331','student','NV732907',NULL,'active',1,'active','unverified','$2b$10$OtqZtQztKzK/1zgQSj.on.IBCh3uYaSnvXu6CcSX1hY7tHg6SLOw.',NULL,'2026-03-03 22:23:46','2026-09-20 18:28:31'),('71ddaa9a-1fc1-4a18-aeea-512d9787e684','admin@academy.com','admin','admin','NV535747',NULL,'active',1,'active','unverified','$2b$10$lgmXpXQmJPGD3uXry8ZJVO50Sf6wk0vymysYTagfWE.l.9oC3wJb.',NULL,'2026-04-06 12:25:57','2026-09-20 18:28:31'),('79151f5e-a6ca-4b6b-b715-9527ed848e53','teacher_final@test.com','teacher_final','teacher','NV139144',NULL,'active',1,'active','unverified','$2b$12$uqqhB260Mf0nW/aONZldi.Aw1XBV7j0j9SV1tpfZXtpmogScRWLs2',NULL,'2026-04-18 15:03:27','2026-09-20 18:28:31'),('a69dee56-bded-4009-8457-7801c1c87c47','test_teacher_v2@example.com','test_teacher_v2','teacher','NV570032',NULL,'active',1,'active','unverified','$2b$12$nShNncnXwqY8vbXpinayCeiTnyRTL8Y1xQcS5FiX3cqskn9GeD2US',NULL,'2026-04-18 14:23:44','2026-09-20 18:28:31'),('fc831146-6347-4168-ab54-356b1d0a522a','student@academy.com','student','student','NV784627',NULL,'active',1,'active','unverified','$2b$10$z4RWtr5ORJ7ppWOmo0fgx.4AediCvoxN3.oLsDBKv2AMEw/mqmy4W',NULL,'2026-03-03 22:19:19','2026-09-20 18:28:31');
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `withdrawal_requests`
--

DROP TABLE IF EXISTS `withdrawal_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `withdrawal_requests` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` enum('bank_transfer','paypal','payoneer','stripe','other') NOT NULL,
  `payment_details` text NOT NULL,
  `status` enum('pending','approved','rejected','completed') DEFAULT 'pending',
  `admin_notes` text,
  `transaction_proof` varchar(255) DEFAULT NULL,
  `processed_by` varchar(36) DEFAULT NULL,
  `processed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `fk_with_user` (`user_id`),
  CONSTRAINT `fk_with_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `withdrawal_requests`
--

LOCK TABLES `withdrawal_requests` WRITE;
/*!40000 ALTER TABLE `withdrawal_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `withdrawal_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `zoom_meetings`
--

DROP TABLE IF EXISTS `zoom_meetings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `zoom_meetings` (
  `id` varchar(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `description` text,
  `host_id` varchar(36) NOT NULL,
  `module_id` varchar(36) DEFAULT NULL,
  `cohort_id` varchar(36) DEFAULT NULL,
  `meeting_url` text,
  `meeting_id` varchar(255) DEFAULT NULL,
  `passcode` varchar(100) DEFAULT NULL,
  `scheduled_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `duration_minutes` int(11) DEFAULT '60',
  `status` varchar(50) DEFAULT 'scheduled',
  `room_open` tinyint(1) DEFAULT '0',
  `room_opened_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `host_id` (`host_id`),
  KEY `module_id` (`module_id`),
  KEY `cohort_id` (`cohort_id`),
  CONSTRAINT `zoom_meetings_ibfk_1` FOREIGN KEY (`host_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `zoom_meetings_ibfk_2` FOREIGN KEY (`module_id`) REFERENCES `modules` (`id`) ON DELETE SET NULL,
  CONSTRAINT `zoom_meetings_ibfk_3` FOREIGN KEY (`cohort_id`) REFERENCES `cohorts` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `zoom_meetings`
--

LOCK TABLES `zoom_meetings` WRITE;
/*!40000 ALTER TABLE `zoom_meetings` DISABLE KEYS */;
/*!40000 ALTER TABLE `zoom_meetings` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-24 19:23:50
