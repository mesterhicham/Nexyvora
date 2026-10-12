export type UserRole = 'admin' | 'teacher' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  program: string;
  specialty: string;
  cohort: string;
  enrollmentDate: string;
  status: 'active' | 'graduated' | 'suspended';
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  specialty: string;
  modules: string[];
  joinDate: string;
  status: 'active' | 'inactive';
}

export interface Program {
  id: string;
  name: string;
  duration: string;
  description: string;
  image_url?: string | null;
  specialties?: number;
  students?: number;
}

export interface Specialty {
  id: string;
  name: string;
  program: string;
  modules: number;
  students: number;
}

export interface Cohort {
  id: string;
  name: string;
  program: string;
  specialty: string;
  startDate: string;
  endDate: string;
  students: number;
  status: 'active' | 'completed' | 'upcoming';
}

export interface Module {
  id: string;
  name: string;
  code: string;
  specialty: string;
  hours: number;
  teacher: string;
}

export interface Lesson {
  id: string;
  title: string;
  module: string;
  date: string;
  duration: string;
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface Assignment {
  id: string;
  title: string;
  module: string;
  dueDate: string;
  submissions: number;
  totalStudents: number;
  status: 'active' | 'closed';
}

export interface Diploma {
  id: string;
  serialNumber: string;
  studentName: string;
  program: string;
  specialty: string;
  issueDate: string;
  status: 'issued' | 'pending';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  date: string;
  priority: 'high' | 'medium' | 'low';
}

export interface Grade {
  id: string;
  module: string;
  assignment: string;
  grade: number;
  maxGrade: number;
  date: string;
}

export interface Attendance {
  id: string;
  date: string;
  module: string;
  status: 'present' | 'absent' | 'late';
}

export type TicketStatus = 'open' | 'in_progress' | 'waiting_for_info' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high' | 'urgent';
export type TicketCategory = 'general' | 'technical' | 'billing' | 'academy' | 'wallet' | 'kyc';

export interface SupportMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  sender_role: 'user' | 'admin';
  message: string;
  attachment_url?: string | null;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
  sender_user_role?: string;
}

export interface SupportTicket {
  id: string;
  ticket_number: string;
  user_id: string;
  subject: string;
  category: TicketCategory;
  priority: TicketPriority;
  status: TicketStatus;
  last_reply_by: 'user' | 'admin';
  last_reply_at: string;
  closed_at?: string | null;
  created_at: string;
  updated_at: string;
  message_count?: number;
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  user_role?: string;
}

export interface SupportStats {
  total: number;
  open: number;
  in_progress: number;
  waiting_for_info: number;
  resolved: number;
  closed: number;
  urgent: number;
}

