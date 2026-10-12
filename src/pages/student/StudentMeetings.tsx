import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useStudentMeetings, 
  useJoinMeeting,
  useMeetingRoomSubscription,
  Meeting,
} from '@/hooks/useMeetingRoom';
import { useAuth } from '@/contexts/AuthContext';
import { studentService } from '@/services/apiService';
import { 
  Video, 
  Calendar,
  Clock,
  ExternalLink,
  Loader2,
  Users,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function StudentMeetings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { data: meetings, isLoading, refetch } = useStudentMeetings();
  const joinMeeting = useJoinMeeting();
  
  // Get student cohort for realtime subscription
  const [cohortId, setCohortId] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchCohort = async () => {
      if (!user) return;
      try {
        const student = await studentService.getRecord();
        if (student?.cohort_id) setCohortId(student.cohort_id);
      } catch (err) {
        // student record not found
      }
    };
    fetchCohort();
  }, [user]);
  
  // Real-time notification when room opens
  const handleRoomOpened = useCallback((meeting: Meeting) => {
    toast.success(`Meeting "${meeting.title}" is now open!`, {
      action: {
        label: 'Join Now',
        onClick: () => handleJoin(meeting),
      },
    });
    refetch();
  }, [refetch]);
  
  useMeetingRoomSubscription(cohortId, handleRoomOpened);
  
  const handleJoin = async (meeting: Meeting) => {
    await joinMeeting.mutateAsync(meeting.id);
    if (meeting.meeting_url) {
      window.open(meeting.meeting_url, '_blank');
    }
  };
  
  const openMeetings = meetings?.filter(m => m.room_open) || [];
  const upcomingMeetings = meetings?.filter(m => !m.room_open && m.status === 'scheduled') || [];
  const pastMeetings = meetings?.filter(m => m.status === 'completed') || [];

  return (
    <DashboardLayout role="student">
      <PageHeader
        title="Live Meetings"
        description="Join live classes and view upcoming sessions"
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/student' },
          { label: 'Meetings' },
        ]}
      />

      <div className="p-6 space-y-6">
        {/* Live Now */}
        {openMeetings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
              </span>
              Live Now
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {openMeetings.map(meeting => (
                <Card key={meeting.id} className="border-green-500/50 bg-green-50/50 dark:bg-green-900/10">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{meeting.title}</CardTitle>
                      <Badge className="bg-green-600">Live</Badge>
                    </div>
                    <CardDescription>
                      {meeting.module?.name || meeting.cohort?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                      <Users className="h-4 w-4" />
                      <span>Host: {meeting.host?.full_name || meeting.host?.email}</span>
                    </div>
                    <Button 
                      onClick={() => handleJoin(meeting)}
                      disabled={joinMeeting.isPending}
                      className="w-full bg-green-600 hover:bg-green-700"
                    >
                      {joinMeeting.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <Video className="h-4 w-4 mr-2" />
                      )}
                      Join Meeting
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Meetings */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Upcoming Meetings</h2>
          {isLoading ? (
            <div className="grid md:grid-cols-2 gap-4">
              {[1, 2].map(i => (
                <Skeleton key={i} className="h-40" />
              ))}
            </div>
          ) : upcomingMeetings.length === 0 ? (
            <Card className="text-center py-8">
              <CardContent>
                <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No upcoming meetings scheduled</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {upcomingMeetings.map(meeting => (
                <Card key={meeting.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{meeting.title}</CardTitle>
                    <CardDescription>
                      {meeting.module?.name || meeting.cohort?.name}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(meeting.scheduled_at), 'PPP')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{format(new Date(meeting.scheduled_at), 'p')} ({meeting.duration_minutes} min)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>Host: {meeting.host?.full_name || meeting.host?.email}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Past Meetings */}
        {pastMeetings.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Past Meetings</h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {pastMeetings.slice(0, 6).map(meeting => (
                <Card key={meeting.id} className="opacity-75">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{meeting.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{format(new Date(meeting.scheduled_at), 'PP')}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import React from 'react';
