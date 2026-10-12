-- ============================================================
-- NEXYVORA CANONICAL DATABASE SCHEMA (MySQL Version)
-- Complete 55-Table Schema Synchronized with Backend
-- ============================================================

CREATE DATABASE IF NOT EXISTS `nextvora`;
USE `nextvora`;

SET FOREIGN_KEY_CHECKS = 0;

-- ------------------------------------------------------------
-- Table: bonus_pool_distributions
-- ------------------------------------------------------------
CREATE TABLE `bonus_pool_distributions` (
  `id` varchar(36) NOT NULL,
  `pool_id` varchar(36) NOT NULL,
  `period_year` int(11) NOT NULL,
  `period_month` int(11) NOT NULL,
  `gross_sales` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_commissions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_margin` decimal(12,2) NOT NULL DEFAULT '0.00',
  `pool_percentage` decimal(5,2) NOT NULL DEFAULT '2.00',
  `pool_base_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rollover_in` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_pool_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `eligible_leaders_count` int(11) NOT NULL DEFAULT '0',
  `share_per_leader` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rollover_out` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('distributed','rolled_over','pending') NOT NULL DEFAULT 'pending',
  `notes` text,
  `executed_by` varchar(36) DEFAULT NULL,
  `executed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_pool_period` (`pool_id`,`period_year`,`period_month`),
  KEY `idx_period` (`period_year`,`period_month`),
  KEY `idx_pool_id` (`pool_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: bonus_pool_payouts
-- ------------------------------------------------------------
CREATE TABLE `bonus_pool_payouts` (
  `id` varchar(36) NOT NULL,
  `distribution_id` varchar(36) NOT NULL,
  `pool_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` enum('paid','failed') NOT NULL DEFAULT 'paid',
  `transaction_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_dist_user` (`distribution_id`,`user_id`),
  KEY `idx_pool_user` (`pool_id`,`user_id`),
  KEY `idx_user` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: bonus_pools
-- ------------------------------------------------------------
CREATE TABLE `bonus_pools` (
  `id` varchar(36) NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_ar` varchar(100) NOT NULL,
  `target_rank_id` varchar(36) DEFAULT NULL,
  `target_rank_level` int(11) NOT NULL DEFAULT '5',
  `pool_percentage` decimal(5,2) NOT NULL DEFAULT '2.00',
  `calculation_basis` varchar(30) NOT NULL DEFAULT 'net_margin',
  `current_rollover` decimal(12,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_target_rank` (`target_rank_id`),
  KEY `idx_target_level` (`target_rank_level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: challenges
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: cohorts
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: commissions
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: community_comments
-- ------------------------------------------------------------
CREATE TABLE `community_comments` (
  `id` varchar(36) NOT NULL,
  `post_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `content` text NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_post_created` (`post_id`,`created_at`),
  KEY `fk_comm_comm_user` (`user_id`),
  CONSTRAINT `fk_comm_comm_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comm_comm_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: community_likes
-- ------------------------------------------------------------
CREATE TABLE `community_likes` (
  `id` varchar(36) NOT NULL,
  `post_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_post_user` (`post_id`,`user_id`),
  KEY `fk_comm_likes_user` (`user_id`),
  CONSTRAINT `fk_comm_likes_post` FOREIGN KEY (`post_id`) REFERENCES `community_posts` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_comm_likes_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: community_posts
-- ------------------------------------------------------------
CREATE TABLE `community_posts` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `channel` varchar(50) DEFAULT 'general',
  `title` varchar(255) NOT NULL,
  `content` text NOT NULL,
  `likes_count` int(11) DEFAULT '0',
  `comments_count` int(11) DEFAULT '0',
  `is_pinned` tinyint(4) DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_channel` (`channel`),
  KEY `idx_created` (`created_at`),
  KEY `fk_comm_posts_user` (`user_id`),
  CONSTRAINT `fk_comm_posts_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: conversation_participants
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: conversations
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: country_currency_rules
-- ------------------------------------------------------------
CREATE TABLE `country_currency_rules` (
  `country_code` varchar(10) NOT NULL,
  `country_name` varchar(100) NOT NULL,
  `country_name_ar` varchar(100) NOT NULL,
  `currency_code` varchar(10) NOT NULL,
  `currency_symbol` varchar(10) NOT NULL,
  `usd_rate` decimal(12,4) NOT NULL DEFAULT '1.0000',
  `usdt_rate` decimal(12,4) NOT NULL DEFAULT '1.0000',
  `usdt_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `local_currency_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `stripe_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `paypal_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `payoneer_enabled` tinyint(1) NOT NULL DEFAULT '0',
  `bank_transfer_enabled` tinyint(1) NOT NULL DEFAULT '1',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `sort_order` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`country_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table: currency_audit_logs
-- ------------------------------------------------------------
CREATE TABLE `currency_audit_logs` (
  `id` varchar(36) NOT NULL,
  `admin_id` varchar(36) NOT NULL,
  `admin_email` varchar(255) NOT NULL,
  `action` varchar(100) NOT NULL,
  `country_code` varchar(10) NOT NULL,
  `field_name` varchar(100) NOT NULL,
  `old_value` text,
  `new_value` text,
  `ip_address` varchar(50) DEFAULT NULL,
  `user_agent` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_audit_country` (`country_code`),
  KEY `idx_audit_admin` (`admin_id`),
  KEY `idx_audit_created` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table: diplomas
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: email_logs
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: email_settings
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: email_templates
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: formation_content
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: formation_enrollments
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: formation_payments
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: formation_progress
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: formation_quiz_attempts
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: formation_quiz_questions
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: formation_quizzes
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: formations
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: founder_distributions
-- ------------------------------------------------------------
CREATE TABLE `founder_distributions` (
  `id` varchar(36) NOT NULL,
  `period_year` int(11) NOT NULL,
  `period_month` int(11) NOT NULL,
  `gross_sales` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_commissions` decimal(12,2) NOT NULL DEFAULT '0.00',
  `net_margin` decimal(12,2) NOT NULL DEFAULT '0.00',
  `pool_percentage` decimal(5,2) NOT NULL DEFAULT '2.00',
  `pool_base_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rollover_in` decimal(12,2) NOT NULL DEFAULT '0.00',
  `total_pool_amount` decimal(12,2) NOT NULL DEFAULT '0.00',
  `founders_count` int(11) NOT NULL DEFAULT '0',
  `share_per_founder` decimal(12,2) NOT NULL DEFAULT '0.00',
  `rollover_out` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('distributed','rolled_over','pending') NOT NULL DEFAULT 'pending',
  `notes` text,
  `executed_by` varchar(36) DEFAULT NULL,
  `executed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_founder_dist_period` (`period_year`,`period_month`),
  KEY `idx_founder_dist_period` (`period_year`,`period_month`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: founder_members
-- ------------------------------------------------------------
CREATE TABLE `founder_members` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `seat_number` int(11) NOT NULL,
  `qualified_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `direct_sales_achieved` decimal(12,2) NOT NULL DEFAULT '0.00',
  `status` enum('active','suspended') NOT NULL DEFAULT 'active',
  `granted_by` enum('system','admin_manual') NOT NULL DEFAULT 'system',
  `notes` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_founder_user` (`user_id`),
  UNIQUE KEY `uq_founder_seat` (`seat_number`),
  KEY `idx_founder_status` (`status`),
  CONSTRAINT `fk_founder_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: founder_payouts
-- ------------------------------------------------------------
CREATE TABLE `founder_payouts` (
  `id` varchar(36) NOT NULL,
  `distribution_id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `seat_number` int(11) NOT NULL,
  `amount` decimal(12,2) NOT NULL,
  `status` enum('paid','failed') NOT NULL DEFAULT 'paid',
  `transaction_id` varchar(36) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_fp_dist_user` (`distribution_id`,`user_id`),
  KEY `idx_fp_user` (`user_id`),
  KEY `idx_fp_seat` (`seat_number`),
  CONSTRAINT `fk_fp_dist` FOREIGN KEY (`distribution_id`) REFERENCES `founder_distributions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_fp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: founder_settings
-- ------------------------------------------------------------
CREATE TABLE `founder_settings` (
  `id` varchar(36) NOT NULL,
  `total_seats` int(11) NOT NULL DEFAULT '100',
  `target_direct_sales` decimal(12,2) NOT NULL DEFAULT '5000.00',
  `pool_percentage` decimal(5,2) NOT NULL DEFAULT '2.00',
  `calculation_basis` varchar(30) NOT NULL DEFAULT 'net_margin',
  `current_rollover` decimal(12,2) NOT NULL DEFAULT '0.00',
  `is_active` tinyint(1) NOT NULL DEFAULT '1',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table: holidays
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: leader_achievers
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: meeting_attendance
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: message_reactions
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: messages
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: modules
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: news
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: notifications
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: package_courses
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: packages
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: payment_methods
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: payments
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: placement_test_questions
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: platform_settings
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: profiles
-- ------------------------------------------------------------
CREATE TABLE `profiles` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `avatar_url` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `city` varchar(255) DEFAULT NULL,
  `country` varchar(255) DEFAULT NULL,
  `country_code` varchar(10) DEFAULT NULL,
  `whatsapp_number` varchar(50) DEFAULT NULL,
  `phone` varchar(50) DEFAULT NULL,
  `address` text,
  `bio` text,
  `date_of_birth` date DEFAULT NULL,
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`),
  KEY `idx_profiles_country_code` (`country_code`),
  CONSTRAINT `profiles_ibfk_1` FOREIGN KEY (`id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: program_pricing
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: programs
-- ------------------------------------------------------------
CREATE TABLE `programs` (
  `id` varchar(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text,
  `duration` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: promised_packages
-- ------------------------------------------------------------
CREATE TABLE `promised_packages` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `package_id` varchar(36) NOT NULL,
  `granted_by` varchar(36) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'marketing',
  `status` enum('active','pending','revoked') NOT NULL DEFAULT 'active',
  `user_package_id` varchar(36) DEFAULT NULL,
  `notes` text,
  `granted_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_pp_user_status` (`user_id`,`status`),
  KEY `idx_pp_package` (`package_id`),
  KEY `idx_pp_status` (`status`),
  KEY `fk_pp_granter` (`granted_by`),
  CONSTRAINT `fk_pp_granter` FOREIGN KEY (`granted_by`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pp_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_pp_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: ranks
-- ------------------------------------------------------------
CREATE TABLE `ranks` (
  `id` varchar(36) NOT NULL,
  `level` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `name_ar` varchar(100) NOT NULL,
  `badge_icon` varchar(50) DEFAULT 'Award',
  `min_direct_sales` int(11) DEFAULT '0',
  `min_team_turnover` decimal(12,2) DEFAULT '0.00',
  `reward_bonus` decimal(10,2) DEFAULT '0.00',
  `unlocked_generations` int(11) NOT NULL DEFAULT '2',
  `color_hex` varchar(20) DEFAULT '#7c3aed',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `level` (`level`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: specialties
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: student_test_results
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: students
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: support_messages
-- ------------------------------------------------------------
CREATE TABLE `support_messages` (
  `id` varchar(36) NOT NULL,
  `ticket_id` varchar(36) NOT NULL,
  `sender_id` varchar(36) NOT NULL,
  `sender_role` enum('user','admin') NOT NULL DEFAULT 'user',
  `message` text NOT NULL,
  `attachment_url` varchar(1000) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_ticket_messages` (`ticket_id`,`created_at`),
  KEY `fk_support_messages_sender` (`sender_id`),
  CONSTRAINT `fk_support_messages_sender` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_support_messages_ticket` FOREIGN KEY (`ticket_id`) REFERENCES `support_tickets` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: support_tickets
-- ------------------------------------------------------------
CREATE TABLE `support_tickets` (
  `id` varchar(36) NOT NULL,
  `ticket_number` varchar(20) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `subject` varchar(255) NOT NULL,
  `category` varchar(50) NOT NULL DEFAULT 'general',
  `priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
  `status` enum('open','in_progress','waiting_for_info','resolved','closed') NOT NULL DEFAULT 'open',
  `last_reply_by` enum('user','admin') NOT NULL DEFAULT 'user',
  `last_reply_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `closed_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ticket_number` (`ticket_number`),
  KEY `idx_tickets_user_status` (`user_id`,`status`),
  KEY `idx_tickets_status` (`status`),
  KEY `idx_tickets_priority` (`priority`),
  KEY `idx_tickets_created_at` (`created_at`),
  CONSTRAINT `fk_support_tickets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: teachers
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: transactions
-- ------------------------------------------------------------
CREATE TABLE `transactions` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'commission',
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

-- ------------------------------------------------------------
-- Table: typing_indicators
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: user_kyc
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: user_packages
-- ------------------------------------------------------------
CREATE TABLE `user_packages` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `package_id` varchar(36) NOT NULL,
  `amount_paid` decimal(10,2) NOT NULL,
  `payment_method` varchar(50) DEFAULT 'manual',
  `payment_reference` varchar(255) DEFAULT NULL,
  `receipt_url` varchar(255) DEFAULT NULL,
  `notes` text,
  `status` enum('active','expired','upgraded','pending','cancelled','rejected') NOT NULL DEFAULT 'pending',
  `is_current` tinyint(1) DEFAULT '1',
  `is_promised` tinyint(1) DEFAULT '0',
  `upgraded_from_package_id` varchar(36) DEFAULT NULL,
  `purchased_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `expires_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `fk_up_user` (`user_id`),
  KEY `fk_up_package` (`package_id`),
  CONSTRAINT `fk_up_package` FOREIGN KEY (`package_id`) REFERENCES `packages` (`id`),
  CONSTRAINT `fk_up_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: user_payout_settings
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: user_roles
-- ------------------------------------------------------------
CREATE TABLE `user_roles` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `role` enum('admin','teacher','student') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`,`role`),
  CONSTRAINT `user_roles_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- ------------------------------------------------------------
-- Table: user_wallets
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Table: users
-- ------------------------------------------------------------
CREATE TABLE `users` (
  `id` varchar(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `username` varchar(100) DEFAULT NULL,
  `role` enum('admin','teacher','student') NOT NULL DEFAULT 'student',
  `email_verified` tinyint(1) NOT NULL DEFAULT '0',
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

-- ------------------------------------------------------------
-- Table: verification_otps
-- ------------------------------------------------------------
CREATE TABLE `verification_otps` (
  `id` varchar(36) NOT NULL,
  `identifier` varchar(255) NOT NULL,
  `type` varchar(50) NOT NULL DEFAULT 'registration',
  `code` varchar(10) NOT NULL,
  `expires_at` datetime NOT NULL,
  `is_verified` tinyint(1) NOT NULL DEFAULT '0',
  `attempts` int(11) NOT NULL DEFAULT '0',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_otp_lookup` (`identifier`,`type`,`is_verified`,`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ------------------------------------------------------------
-- Table: withdrawal_requests
-- ------------------------------------------------------------
CREATE TABLE `withdrawal_requests` (
  `id` varchar(36) NOT NULL,
  `user_id` varchar(36) NOT NULL,
  `amount` decimal(10,2) NOT NULL,
  `payment_method` varchar(100) NOT NULL DEFAULT 'other',
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

-- ------------------------------------------------------------
-- Table: zoom_meetings
-- ------------------------------------------------------------
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

SET FOREIGN_KEY_CHECKS = 1;
