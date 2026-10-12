import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useTeacherMeetings } from '@/hooks/useMeetingRoom';
import { 
  Video, 
  Calendar,
  Clock,
  Plus,
  Users,
  CheckCircle,
  ExternalLink,
} from 'lucide-react';
import { format } from 'date-fns';

export default function TeacherMeetings() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  
  const { data: meetings, isLoading } = useTeacherMeetings();
  
  const openMeetings = meetings?.filter(m => m.room_open) || [];
  const upcomingMeetings = meetings?.filter(m => !m.room_open && m.status === 'scheduled') || [];
  const pastMeetings = meetings?.filter(m => m.status === 'completed') || [];

  return (
    <DashboardLayout role="teacher">
      <PageHeader
        title="My Meetings"
        description="Manage your live class sessions"
        breadcrumbs={[
          { label: t('nav.dashboard'), href: '/teacher' },
          { label: 'Meetings' },
        ]}
        actions={
          <Button onClick={() => navigate('/admin/meetings')}>
            <Plus className="h-4 w-4 mr-2" />
            Schedule Meeting
          </Button>
        }
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
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{meeting.cohort?.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => navigate(`/teacher/meetings/${meeting.id}`)}
                        variant="outline"
                        className="flex-1"
                      >
                        View Room
                      </Button>
                      {meeting.meeting_url && (
                        <Button 
                          onClick={() => window.open(meeting.meeting_url!, '_blank')}
                          className="flex-1 bg-green-600 hover:bg-green-700"
                        >
                          <ExternalLink className="h-4 w-4 mr-2" />
                          Join
                        </Button>
                      )}
                    </div>
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
                <Button className="mt-4" onClick={() => navigate('/admin/meetings')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Schedule Meeting
                </Button>
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
                    <div className="space-y-2 text-sm mb-4">
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
                        <span>{meeting.cohort?.name}</span>
                      </div>
                    </div>
                    <Button 
                      onClick={() => navigate(`/teacher/meetings/${meeting.id}`)}
                      variant="outline"
                      className="w-full"
                    >
                      <Video className="h-4 w-4 mr-2" />
                      Open Meeting Room
                    </Button>
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
                <Card key={meeting.id} className="opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
                  onClick={() => navigate(`/teacher/meetings/${meeting.id}`)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{meeting.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span>{format(new Date(meeting.scheduled_at), 'PP')}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Click to view attendance
                    </p>
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
