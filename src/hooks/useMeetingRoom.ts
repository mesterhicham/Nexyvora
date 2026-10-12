import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService, studentService } from '@/services/apiService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Types
export interface Meeting {
  id: string;
  title: string;
  description: string | null;
  meeting_url: string | null;
  meeting_id: string | null;
  passcode: string | null;
  scheduled_at: string;
  duration_minutes: number;
  status: string;
  host_id: string;
  cohort_id: string | null;
  module_id: string | null;
  room_open: boolean;
  room_opened_at: string | null;
  created_at: string;
  host?: {
    full_name: string | null;
    email: string;
  };
  cohort?: {
    id: string;
    name: string;
  };
  module?: {
    id: string;
    name: string;
  };
}

export interface MeetingAttendance {
  id: string;
  meeting_id: string;
  student_id: string;
  status: string;
  joined_at: string | null;
  left_at: string | null;
  notes: string | null;
  student?: {
    id: string;
    user_id: string;
    profile?: {
      full_name: string | null;
      email: string;
    };
  };
}

// Fetch meetings for teacher
export function useTeacherMeetings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['teacher-meetings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return adminService.getTeacherMeetings();
    },
    enabled: !!user,
  });
}

// Fetch meetings for student (based on their cohort)
export function useStudentMeetings() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['student-meetings', user?.id],
    queryFn: async () => {
      if (!user) return [];
      return adminService.getStudentMeetings();
    },
    enabled: !!user,
  });
}

// Fetch single meeting
export function useMeeting(meetingId: string | null) {
  return useQuery({
    queryKey: ['meeting', meetingId],
    queryFn: async () => {
      if (!meetingId) return null;
      const allMeetings = await adminService.getZoomMeetings();
      return allMeetings.find((m: any) => m.id === meetingId) || null;
    },
    enabled: !!meetingId,
  });
}

// Fetch meeting attendance
export function useMeetingAttendance(meetingId: string | null) {
  return useQuery({
    queryKey: ['meeting-attendance', meetingId],
    queryFn: async () => {
      if (!meetingId) return [];
      return adminService.getMeetingAttendance(meetingId);
    },
    enabled: !!meetingId,
  });
}

// Open/close meeting room
export function useToggleMeetingRoom() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ meetingId, open }: { meetingId: string; open: boolean }) => {
      return adminService.toggleRoomOpen(meetingId, open);
    },
    onSuccess: (_, { meetingId, open }) => {
      queryClient.invalidateQueries({ queryKey: ['meeting', meetingId] });
      queryClient.invalidateQueries({ queryKey: ['teacher-meetings'] });
      queryClient.invalidateQueries({ queryKey: ['student-meetings'] });
      toast.success(open ? 'Meeting room opened!' : 'Meeting room closed');
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle meeting room: ${error.message}`);
    },
  });
}

// Join meeting (mark as present)
export function useJoinMeeting() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (meetingId: string) => {
      if (!user) throw new Error('Not authenticated');
      return adminService.updateMeetingAttendance({
        meeting_id: meetingId,
        student_id: user.id,
        status: 'present',
      });
    },
    onSuccess: (_, meetingId) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-attendance', meetingId] });
      toast.success('You have joined the meeting');
    },
    onError: (error: Error) => {
      toast.error(`Failed to join meeting: ${error.message}`);
    },
  });
}

// Update attendance manually
export function useUpdateAttendance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ attendanceId, status, notes }: {
      attendanceId: string;
      status: string;
      notes?: string;
    }) => {
      return adminService.updateMeetingAttendance({ id: attendanceId, status, notes });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meeting-attendance'] });
      toast.success('Attendance updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update attendance: ${error.message}`);
    },
  });
}

// Real-time subscription for meeting room status
export function useMeetingRoomSubscription(cohortId: string | null, onRoomOpened: (meeting: Meeting) => void) {
  // Can poll or no-op
}

// Notifications hooks
export function useNotifications() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => [],
    enabled: !!user,
  });
}

export function useUnreadNotificationsCount() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['unread-notifications-count', user?.id],
    queryFn: async () => 0,
    enabled: !!user,
  });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });
}
