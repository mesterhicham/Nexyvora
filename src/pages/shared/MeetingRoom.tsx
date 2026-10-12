import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  useMeeting, 
  useMeetingAttendance, 
  useToggleMeetingRoom,
  useUpdateAttendance,
} from '@/hooks/useMeetingRoom';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Video, 
  VideoOff, 
  Users, 
  Clock, 
  Calendar,
  ExternalLink,
  CheckCircle,
  XCircle,
  Loader2,
  Edit,
} from 'lucide-react';
import { format } from 'date-fns';
export default function MeetingRoom() {
  const { t } = useTranslation();
  const { meetingId } = useParams<{ meetingId: string }>();
  const navigate = useNavigate();
  const { user, role } = useAuth();
  const userRole = role || 'student';
  
  const { data: meeting, isLoading: loadingMeeting } = useMeeting(meetingId || null);
  const { data: attendance, isLoading: loadingAttendance } = useMeetingAttendance(meetingId || null);
  const toggleRoom = useToggleMeetingRoom();
  const updateAttendance = useUpdateAttendance();
  
  const [editingAttendance, setEditingAttendance] = useState<string | null>(null);
  const [editStatus, setEditStatus] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const isHost = meeting?.host_id === user?.id || userRole === 'admin';
  
  const presentCount = attendance?.filter(a => a.status === 'present').length || 0;
  const absentCount = attendance?.filter(a => a.status === 'absent').length || 0;
  
  const handleToggleRoom = () => {
    if (!meetingId) return;
    toggleRoom.mutate({ meetingId, open: !meeting?.room_open });
  };
  
  const handleEditAttendance = (a: typeof attendance[0]) => {
    setEditingAttendance(a.id);
    setEditStatus(a.status);
    setEditNotes(a.notes || '');
  };
  
  const handleSaveAttendance = async () => {
    if (!editingAttendance) return;
    await updateAttendance.mutateAsync({
      attendanceId: editingAttendance,
      status: editStatus,
      notes: editNotes,
    });
    setEditingAttendance(null);
  };
  
  if (loadingMeeting || !role) {
    return (
      <DashboardLayout role={role || 'student'}>
        <div className="p-6 space-y-6">
          <Skeleton className="h-10 w-64" />
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </DashboardLayout>
    );
  }
  
  if (!meeting) {
    return (
      <DashboardLayout role={role}>
        <div className="p-6 text-center">
          <h2 className="text-xl font-semibold mb-2">Meeting not found</h2>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role={role}>
      <PageHeader
        title={meeting.title}
        description={meeting.description || 'Meeting Room'}
        breadcrumbs={[
          { label: t('nav.dashboard'), href: `/${userRole}` },
          { label: 'Meetings', href: `/${userRole}/meetings` },
          { label: meeting.title },
        ]}
        actions={
          isHost && (
            <Button
              onClick={handleToggleRoom}
              variant={meeting.room_open ? 'destructive' : 'default'}
              disabled={toggleRoom.isPending}
            >
              {toggleRoom.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : meeting.room_open ? (
                <VideoOff className="h-4 w-4 mr-2" />
              ) : (
                <Video className="h-4 w-4 mr-2" />
              )}
              {meeting.room_open ? 'Close Room' : 'Open Room'}
            </Button>
          )
        }
      />

      <div className="p-6 space-y-6">
        {/* Meeting Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-5 w-5" />
                  Meeting Status
                </CardTitle>
                <CardDescription>
                  {meeting.cohort?.name || 'No cohort assigned'}
                  {meeting.module && ` • ${meeting.module.name}`}
                </CardDescription>
              </div>
              <Badge 
                variant={meeting.room_open ? 'default' : 'secondary'}
                className={meeting.room_open ? 'bg-green-600' : ''}
              >
                {meeting.room_open ? 'Room Open' : 'Room Closed'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-4 gap-4">
              <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Scheduled</p>
                  <p className="font-medium">{format(new Date(meeting.scheduled_at), 'PPP')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-accent/50 rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium">{format(new Date(meeting.scheduled_at), 'p')}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Present</p>
                  <p className="font-medium text-green-600">{presentCount}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
                <XCircle className="h-5 w-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Absent</p>
                  <p className="font-medium text-red-600">{absentCount}</p>
                </div>
              </div>
            </div>
            
            {meeting.meeting_url && meeting.room_open && (
              <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/20">
                <p className="text-sm text-muted-foreground mb-2">Meeting Link</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded text-sm truncate">
                    {meeting.meeting_url}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(meeting.meeting_url!, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Join
                  </Button>
                </div>
                {meeting.passcode && (
                  <p className="text-sm mt-2">
                    <strong>Passcode:</strong> {meeting.passcode}
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Attendance List */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendance ({attendance?.length || 0} students)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingAttendance ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : attendance?.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">
                No students invited yet. Open the room to create attendance records.
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined At</TableHead>
                    <TableHead>Notes</TableHead>
                    {isHost && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendance?.map(a => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{a.student?.profile?.full_name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground">{a.student?.profile?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={a.status === 'present' ? 'default' : 'destructive'}>
                          {a.status === 'present' ? (
                            <><CheckCircle className="h-3 w-3 mr-1" /> Present</>
                          ) : (
                            <><XCircle className="h-3 w-3 mr-1" /> Absent</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {a.joined_at 
                          ? format(new Date(a.joined_at), 'p') 
                          : '-'
                        }
                      </TableCell>
                      <TableCell>{a.notes || '-'}</TableCell>
                      {isHost && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEditAttendance(a)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Attendance Dialog */}
      <Dialog open={!!editingAttendance} onOpenChange={() => setEditingAttendance(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Attendance</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={editStatus} onValueChange={setEditStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="late">Late</SelectItem>
                  <SelectItem value="excused">Excused</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingAttendance(null)}>
              Cancel
            </Button>
            <Button onClick={handleSaveAttendance} disabled={updateAttendance.isPending}>
              {updateAttendance.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
