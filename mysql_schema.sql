-- ============================================================
-- NEXYVORA DATABASE SCHEMA (MySQL Version)
-- Core Database Architecture
-- ============================================================

CREATE DATABASE IF NOT EXISTS `nexyvora`;
USE `nexyvora`;

-- 1. Users table (Replaces auth.users)
CREATE TABLE IF NOT EXISTS `users` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 2. Profiles table
CREATE TABLE IF NOT EXISTS `profiles` (
  `id` VARCHAR(36) PRIMARY KEY,
  `email` VARCHAR(255) NOT NULL,
  `full_name` VARCHAR(255),
  `avatar_url` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 3. User Roles table
CREATE TABLE IF NOT EXISTS `user_roles` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `role` ENUM('admin', 'teacher', 'student') NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (`user_id`, `role`),
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 4. Programs table
CREATE TABLE IF NOT EXISTS `programs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `duration` VARCHAR(100),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 5. Specialties table
CREATE TABLE IF NOT EXISTS `specialties` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `program_id` VARCHAR(36),
  `description` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 6. Cohorts table
CREATE TABLE IF NOT EXISTS `cohorts` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `specialty_id` VARCHAR(36),
  `start_date` DATE,
  `end_date` DATE,
  `status` VARCHAR(50) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`specialty_id`) REFERENCES `specialties`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 7. Students table
CREATE TABLE IF NOT EXISTS `students` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36),
  `cohort_id` VARCHAR(36),
  `enrollment_date` DATE,
  `status` VARCHAR(50) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 8. Teachers table
CREATE TABLE IF NOT EXISTS `teachers` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36),
  `specialty` VARCHAR(255),
  `hire_date` DATE,
  `status` VARCHAR(50) DEFAULT 'active',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 9. Modules table
CREATE TABLE IF NOT EXISTS `modules` (
  `id` VARCHAR(36) PRIMARY KEY,
  `code` VARCHAR(50) NOT NULL,
  `name` VARCHAR(255) NOT NULL,
  `specialty_id` VARCHAR(36),
  `teacher_id` VARCHAR(36),
  `hours` INTEGER,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`specialty_id`) REFERENCES `specialties`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`teacher_id`) REFERENCES `teachers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 10. Diplomas table
CREATE TABLE IF NOT EXISTS `diplomas` (
  `id` VARCHAR(36) PRIMARY KEY,
  `serial_number` VARCHAR(100) UNIQUE NOT NULL,
  `student_id` VARCHAR(36),
  `program` VARCHAR(255) NOT NULL,
  `specialty` VARCHAR(255) NOT NULL,
  `issue_date` DATE,
  `status` VARCHAR(50) DEFAULT 'pending',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 11. Platform Settings
CREATE TABLE IF NOT EXISTS `platform_settings` (
  `id` VARCHAR(36) PRIMARY KEY,
  `key` VARCHAR(255) UNIQUE NOT NULL,
  `value` TEXT,
  `type` VARCHAR(50) DEFAULT 'text',
  `category` VARCHAR(50) DEFAULT 'general',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 12. Holidays
CREATE TABLE IF NOT EXISTS `holidays` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `start_date` DATE NOT NULL,
  `end_date` DATE NOT NULL,
  `type` VARCHAR(50) DEFAULT 'holiday',
  `is_recurring` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 13. News
CREATE TABLE IF NOT EXISTS `news` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT NOT NULL,
  `type` VARCHAR(50) DEFAULT 'news',
  `priority` VARCHAR(50) DEFAULT 'medium',
  `target_audience` VARCHAR(50) DEFAULT 'all',
  `author_id` VARCHAR(36),
  `is_published` BOOLEAN DEFAULT TRUE,
  `published_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `expires_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 14. Email Settings
CREATE TABLE IF NOT EXISTS `email_settings` (
  `id` VARCHAR(36) PRIMARY KEY,
  `smtp_host` VARCHAR(255),
  `smtp_port` INTEGER DEFAULT 587,
  `smtp_username` VARCHAR(255),
  `smtp_password` VARCHAR(255),
  `encryption` VARCHAR(50) DEFAULT 'tls',
  `from_email` VARCHAR(255),
  `from_name` VARCHAR(255),
  `is_active` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 15. Email Templates
CREATE TABLE IF NOT EXISTS `email_templates` (
  `id` VARCHAR(36) PRIMARY KEY,
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) UNIQUE NOT NULL,
  `subject` VARCHAR(255) NOT NULL,
  `body_html` TEXT NOT NULL,
  `body_text` TEXT,
  `variables` JSON,
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 16. Email Logs
CREATE TABLE IF NOT EXISTS `email_logs` (
  `id` VARCHAR(36) PRIMARY KEY,
  `template_id` VARCHAR(36),
  `recipient_email` VARCHAR(255) NOT NULL,
  `recipient_name` VARCHAR(255),
  `recipient_type` VARCHAR(100),
  `subject` VARCHAR(255) NOT NULL,
  `body_html` TEXT,
  `status` VARCHAR(50) DEFAULT 'pending',
  `error_message` TEXT,
  `sent_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`template_id`) REFERENCES `email_templates`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 17. Zoom Meetings
CREATE TABLE IF NOT EXISTS `zoom_meetings` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `host_id` VARCHAR(36) NOT NULL,
  `module_id` VARCHAR(36),
  `cohort_id` VARCHAR(36),
  `meeting_url` TEXT,
  `meeting_id` VARCHAR(255),
  `passcode` VARCHAR(100),
  `scheduled_at` TIMESTAMP NOT NULL,
  `duration_minutes` INTEGER DEFAULT 60,
  `status` VARCHAR(50) DEFAULT 'scheduled',
  `room_open` BOOLEAN DEFAULT FALSE,
  `room_opened_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`host_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`module_id`) REFERENCES `modules`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 18. Meeting Attendance
CREATE TABLE IF NOT EXISTS `meeting_attendance` (
  `id` VARCHAR(36) PRIMARY KEY,
  `meeting_id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'absent',
  `joined_at` TIMESTAMP NULL,
  `left_at` TIMESTAMP NULL,
  `notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(`meeting_id`, `student_id`),
  FOREIGN KEY (`meeting_id`) REFERENCES `zoom_meetings`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 19. Placement Test Questions
CREATE TABLE IF NOT EXISTS `placement_test_questions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `question_text` TEXT NOT NULL,
  `options` JSON NOT NULL,
  `correct_option_index` INTEGER NOT NULL,
  `points` INTEGER DEFAULT 1,
  `program_weight` JSON,
  `is_active` BOOLEAN DEFAULT TRUE,
  `order_index` INTEGER DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- 20. Student Test Results
CREATE TABLE IF NOT EXISTS `student_test_results` (
  `id` VARCHAR(36) PRIMARY KEY,
  `student_id` VARCHAR(36) NOT NULL,
  `answers` JSON NOT NULL,
  `score` INTEGER DEFAULT 0,
  `total_points` INTEGER DEFAULT 0,
  `assigned_program_id` VARCHAR(36),
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(`student_id`),
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`assigned_program_id`) REFERENCES `programs`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 21. Payments
CREATE TABLE IF NOT EXISTS `payments` (
  `id` VARCHAR(36) PRIMARY KEY,
  `student_id` VARCHAR(36) NOT NULL,
  `program_id` VARCHAR(36),
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) DEFAULT 'USD',
  `payment_method` VARCHAR(100) NOT NULL,
  `status` VARCHAR(50) DEFAULT 'pending',
  `receipt_url` TEXT,
  `reference_number` VARCHAR(100),
  `notes` TEXT,
  `transaction_id` VARCHAR(255),
  `gateway_response` JSON,
  `reviewed_by` VARCHAR(36),
  `reviewed_at` TIMESTAMP NULL,
  `admin_notes` TEXT,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 22. Program Pricing
CREATE TABLE IF NOT EXISTS `program_pricing` (
  `id` VARCHAR(36) PRIMARY KEY,
  `program_id` VARCHAR(36) NOT NULL UNIQUE,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) DEFAULT 'USD',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`program_id`) REFERENCES `programs`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 23. Conversations
CREATE TABLE IF NOT EXISTS `conversations` (
  `id` VARCHAR(36) PRIMARY KEY,
  `type` ENUM('direct', 'group') NOT NULL DEFAULT 'direct',
  `name` VARCHAR(255),
  `cohort_id` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`cohort_id`) REFERENCES `cohorts`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 24. Conversation Participants
CREATE TABLE IF NOT EXISTS `conversation_participants` (
  `id` VARCHAR(36) PRIMARY KEY,
  `conversation_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `joined_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `last_read_at` TIMESTAMP NULL,
  UNIQUE(`conversation_id`, `user_id`),
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 25. Messages
CREATE TABLE IF NOT EXISTS `messages` (
  `id` VARCHAR(36) PRIMARY KEY,
  `conversation_id` VARCHAR(36) NOT NULL,
  `sender_id` VARCHAR(36) NOT NULL,
  `content` TEXT NOT NULL,
  `attachment_url` TEXT,
  `attachment_type` VARCHAR(100),
  `reply_to_id` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reply_to_id`) REFERENCES `messages`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 26. Notifications
CREATE TABLE IF NOT EXISTS `notifications` (
  `id` VARCHAR(36) PRIMARY KEY,
  `user_id` VARCHAR(36) NOT NULL,
  `type` VARCHAR(50) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content` TEXT,
  `reference_id` VARCHAR(36),
  `reference_type` VARCHAR(100),
  `is_read` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 27. Message Reactions
CREATE TABLE IF NOT EXISTS `message_reactions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `message_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `emoji` VARCHAR(50) NOT NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(`message_id`, `user_id`, `emoji`),
  FOREIGN KEY (`message_id`) REFERENCES `messages`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 28. Typing Indicators
CREATE TABLE IF NOT EXISTS `typing_indicators` (
  `id` VARCHAR(36) PRIMARY KEY,
  `conversation_id` VARCHAR(36) NOT NULL,
  `user_id` VARCHAR(36) NOT NULL,
  `started_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(`conversation_id`, `user_id`),
  FOREIGN KEY (`conversation_id`) REFERENCES `conversations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 29. Formations
CREATE TABLE IF NOT EXISTS `formations` (
  `id` VARCHAR(36) PRIMARY KEY,
  `title` VARCHAR(255) NOT NULL,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL DEFAULT 0,
  `currency` VARCHAR(10) DEFAULT 'USD',
  `thumbnail_url` TEXT,
  `is_published` BOOLEAN DEFAULT FALSE,
  `created_by` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 30. Formation Content
CREATE TABLE IF NOT EXISTS `formation_content` (
  `id` VARCHAR(36) PRIMARY KEY,
  `formation_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `content_type` ENUM('video', 'pdf', 'quiz', 'text') NOT NULL,
  `file_url` TEXT,
  `duration_seconds` INTEGER,
  `order_index` INTEGER DEFAULT 0,
  `quiz_id` VARCHAR(36),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`formation_id`) REFERENCES `formations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 31. Formation Enrollments
CREATE TABLE IF NOT EXISTS `formation_enrollments` (
  `id` VARCHAR(36) PRIMARY KEY,
  `formation_id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `payment_status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `payment_id` VARCHAR(36),
  `enrolled_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(`formation_id`, `student_id`),
  FOREIGN KEY (`formation_id`) REFERENCES `formations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 32. Formation Payments
CREATE TABLE IF NOT EXISTS `formation_payments` (
  `id` VARCHAR(36) PRIMARY KEY,
  `formation_id` VARCHAR(36) NOT NULL,
  `student_id` VARCHAR(36) NOT NULL,
  `amount` DECIMAL(10,2) NOT NULL,
  `currency` VARCHAR(10) DEFAULT 'USD',
  `payment_method` VARCHAR(100) NOT NULL,
  `reference_number` VARCHAR(100),
  `receipt_url` TEXT,
  `notes` TEXT,
  `status` ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  `admin_notes` TEXT,
  `reviewed_by` VARCHAR(36),
  `reviewed_at` TIMESTAMP NULL,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`formation_id`) REFERENCES `formations`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`student_id`) REFERENCES `students`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`reviewed_by`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB;

-- 33. Formation Progress
CREATE TABLE IF NOT EXISTS `formation_progress` (
  `id` VARCHAR(36) PRIMARY KEY,
  `enrollment_id` VARCHAR(36) NOT NULL,
  `content_id` VARCHAR(36) NOT NULL,
  `watched_seconds` INTEGER DEFAULT 0,
  `completed` BOOLEAN DEFAULT FALSE,
  `completed_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE(`enrollment_id`, `content_id`),
  FOREIGN KEY (`enrollment_id`) REFERENCES `formation_enrollments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`content_id`) REFERENCES `formation_content`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 34. Formation Quizzes
CREATE TABLE IF NOT EXISTS `formation_quizzes` (
  `id` VARCHAR(36) PRIMARY KEY,
  `formation_id` VARCHAR(36) NOT NULL,
  `title` VARCHAR(255) NOT NULL,
  `passing_score` INTEGER DEFAULT 70,
  `order_index` INTEGER DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (`formation_id`) REFERENCES `formations`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 35. Formation Quiz Questions
CREATE TABLE IF NOT EXISTS `formation_quiz_questions` (
  `id` VARCHAR(36) PRIMARY KEY,
  `quiz_id` VARCHAR(36) NOT NULL,
  `question_text` TEXT NOT NULL,
  `options` JSON NOT NULL,
  `correct_option_index` INTEGER NOT NULL,
  `order_index` INTEGER DEFAULT 0,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`quiz_id`) REFERENCES `formation_quizzes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;

-- 36. Formation Quiz Attempts
CREATE TABLE IF NOT EXISTS `formation_quiz_attempts` (
  `id` VARCHAR(36) PRIMARY KEY,
  `enrollment_id` VARCHAR(36) NOT NULL,
  `quiz_id` VARCHAR(36) NOT NULL,
  `answers` JSON NOT NULL,
  `score` INTEGER NOT NULL,
  `passed` BOOLEAN NOT NULL,
  `completed_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (`enrollment_id`) REFERENCES `formation_enrollments`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`quiz_id`) REFERENCES `formation_quizzes`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB;
