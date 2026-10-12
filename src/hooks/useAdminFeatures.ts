import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminService } from '@/services/apiService';
import { toast } from 'sonner';

// ============= PLATFORM SETTINGS =============
export function usePlatformSettings() {
  return useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      try {
        const data = await adminService.getSettings();
        const settings: Record<string, { value: string | null; type: string; category: string }> = {};
        if (Array.isArray(data)) {
          data.forEach((s: any) => {
            settings[s.key] = { value: s.value, type: s.type, category: s.category };
          });
        }
        return { raw: data || [], map: settings };
      } catch (err) {
        console.warn('Failed to fetch platform settings, using defaults:', err);
        return { raw: [], map: {} };
      }
    },
    retry: 1,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePlatformSetting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.updateSetting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success('Setting updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update setting: ${error.message}`);
    },
  });
}

// ============= HOLIDAYS =============
export function useHolidays() {
  return useQuery({
    queryKey: ['holidays'],
    queryFn: adminService.getHolidays,
  });
}

export function useCreateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.createHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create holiday: ${error.message}`);
    },
  });
}

export function useUpdateHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.updateHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update holiday: ${error.message}`);
    },
  });
}

export function useDeleteHoliday() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.deleteHoliday,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['holidays'] });
      toast.success('Holiday deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete holiday: ${error.message}`);
    },
  });
}

// ============= NEWS & CONTENT CENTER =============
export function useNews(filtersOrAudience?: string | { targetAudience?: string; type?: string; featured?: boolean }) {
  const filters = typeof filtersOrAudience === 'string' ? { targetAudience: filtersOrAudience } : filtersOrAudience;
  return useQuery({
    queryKey: ['news', filters],
    queryFn: async () => {
      const data = await adminService.getNews({
        type: filters?.type,
        featured: filters?.featured,
      });
      if (filters?.targetAudience && filters.targetAudience !== 'all') {
        return data.filter((n: any) => n.target_audience === filters.targetAudience || n.target_audience === 'all');
      }
      return data;
    },
  });
}

export function useAllNews(filters?: { type?: string; featured?: boolean }) {
  return useQuery({
    queryKey: ['all-news', filters],
    queryFn: () => adminService.getNews(filters),
  });
}

export function useRecordNewsView() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => adminService.recordNewsView(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['all-news'] });
    },
  });
}

export function useCreateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.createNews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['all-news'] });
      toast.success('News created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create news: ${error.message}`);
    },
  });
}

export function useUpdateNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.updateNews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['all-news'] });
      toast.success('News updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update news: ${error.message}`);
    },
  });
}

export function useDeleteNews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.deleteNews,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['news'] });
      queryClient.invalidateQueries({ queryKey: ['all-news'] });
      toast.success('News deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete news: ${error.message}`);
    },
  });
}

// ============= EMAIL SETTINGS =============
export function useEmailSettings() {
  return useQuery({
    queryKey: ['email-settings'],
    queryFn: adminService.getEmailSettings,
  });
}

export function useSaveEmailSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.saveEmailSettings,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-settings'] });
      toast.success('Email settings saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save email settings: ${error.message}`);
    },
  });
}

export function useEmailTemplates() {
  return useQuery({
    queryKey: ['email-templates'],
    queryFn: adminService.getEmailTemplates,
  });
}

export function useUpdateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.updateEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Email template updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update email template: ${error.message}`);
    },
  });
}

export function useTestEmailSettings() {
  return useMutation({
    mutationFn: adminService.testEmailSettings,
    onSuccess: (data: any) => {
      toast.success(data?.message || 'Test email sent successfully!');
    },
    onError: (error: any) => {
      const msg = error.response?.data?.error || error.message || 'Failed to send test email';
      toast.error(`فشل إرسال بريد الاختبار: ${msg}`);
    },
  });
}

export function useResetEmailTemplates() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.resetDefaultEmailTemplates,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Default email templates restored successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to restore default templates: ${error.message}`);
    },
  });
}

export function useCreateEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.createEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Email template created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create template: ${error.message}`);
    },
  });
}

export function useDeleteEmailTemplate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.deleteEmailTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['email-templates'] });
      toast.success('Email template deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete template: ${error.message}`);
    },
  });
}

export function useEmailLogs() {
  return useQuery({
    queryKey: ['email-logs'],
    queryFn: adminService.getEmailLogs,
  });
}

// ============= ZOOM MEETINGS =============
export function useZoomMeetings() {
  return useQuery({
    queryKey: ['zoom-meetings'],
    queryFn: adminService.getZoomMeetings,
  });
}

export function useCreateZoomMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.createZoomMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoom-meetings'] });
      toast.success('Meeting scheduled successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to schedule meeting: ${error.message}`);
    },
  });
}

export function useUpdateZoomMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.updateZoomMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoom-meetings'] });
      toast.success('Meeting updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update meeting: ${error.message}`);
    },
  });
}

export function useDeleteZoomMeeting() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.deleteZoomMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['zoom-meetings'] });
      toast.success('Meeting deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete meeting: ${error.message}`);
    },
  });
}

export function useMeetingAttendance(meetingId: string) {
  return useQuery({
    queryKey: ['meeting-attendance', meetingId],
    queryFn: () => adminService.getMeetingAttendance(meetingId),
    enabled: !!meetingId,
  });
}

export function useUpdateMeetingAttendance() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: adminService.updateMeetingAttendance,
    onSuccess: (_, variables: any) => {
      queryClient.invalidateQueries({ queryKey: ['meeting-attendance', variables.meeting_id] });
      toast.success('Attendance updated');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update attendance: ${error.message}`);
    },
  });
}
