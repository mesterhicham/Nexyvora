import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { Search, UserPlus, UserMinus, Loader2, Check, Pencil } from 'lucide-react';
import { cn } from '@/lib/utils';

interface User {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role?: string;
}

interface Participant {
  id: string;
  user_id: string;
  profile?: {
    full_name: string | null;
    email: string;
    avatar_url: string | null;
  };
}

interface ManageGroupParticipantsProps {
  conversationId: string;
  conversationName: string | null;
  participants: Participant[];
  availableUsers: User[] | undefined;
  isLoading: boolean;
  currentUserId: string;
  onAddParticipant: (userId: string) => Promise<void>;
  onRemoveParticipant: (userId: string) => Promise<void>;
  onRename: (name: string) => Promise<void>;
  isUpdating: boolean;
  isRenaming: boolean;
}

export function ManageGroupParticipants({
  conversationId,
  conversationName,
  participants,
  availableUsers,
  isLoading,
  currentUserId,
  onAddParticipant,
  onRemoveParticipant,
  onRename,
  isUpdating,
  isRenaming,
}: ManageGroupParticipantsProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'current' | 'add'>('current');
  const [newName, setNewName] = useState(conversationName || '');
  const [isEditingName, setIsEditingName] = useState(false);

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleRename = async () => {
    if (newName.trim() && newName !== conversationName) {
      await onRename(newName.trim());
    }
    setIsEditingName(false);
  };

  const participantUserIds = participants.map(p => p.user_id);
  
  const usersToAdd = availableUsers?.filter(u => 
    !participantUserIds.includes(u.id) &&
    (u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredParticipants = participants.filter(p =>
    p.profile?.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.profile?.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Group Name Section */}
      <div className="space-y-2">
        <Label>Group Name</Label>
        <div className="flex gap-2">
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            disabled={!isEditingName}
            placeholder="Enter group name..."
            className={cn(!isEditingName && "bg-muted")}
          />
          {isEditingName ? (
            <Button
              size="icon"
              onClick={handleRename}
              disabled={isRenaming || !newName.trim()}
            >
              {isRenaming ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
          ) : (
            <Button
              size="icon"
              variant="outline"
              onClick={() => setIsEditingName(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <div className="flex gap-2">
        <Button
          variant={activeTab === 'current' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('current')}
          className="flex-1"
        >
          Current ({participants.length})
        </Button>
        <Button
          variant={activeTab === 'add' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveTab('add')}
          className="flex-1"
        >
          <UserPlus className="h-4 w-4 mr-1" />
          Add
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={activeTab === 'current' ? 'Search participants...' : 'Search users to add...'}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <ScrollArea className="h-64">
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : activeTab === 'current' ? (
          <div className="space-y-1">
            {filteredParticipants.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No participants found</p>
            ) : (
              filteredParticipants.map(participant => (
                <div
                  key={participant.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={participant.profile?.avatar_url || ''} />
                    <AvatarFallback>{getInitials(participant.profile?.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {participant.profile?.full_name || participant.profile?.email}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {participant.profile?.email}
                    </p>
                  </div>
                  {participant.user_id === currentUserId ? (
                    <Badge variant="secondary">You</Badge>
                  ) : (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                      onClick={() => onRemoveParticipant(participant.user_id)}
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <UserMinus className="h-4 w-4" />
                      )}
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="space-y-1">
            {usersToAdd?.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No users to add</p>
            ) : (
              usersToAdd?.map(user => (
                <div
                  key={user.id}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-accent transition-colors"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar_url || ''} />
                    <AvatarFallback>{getInitials(user.full_name)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{user.full_name || user.email}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                  </div>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-primary hover:text-primary hover:bg-primary/10"
                    onClick={() => onAddParticipant(user.id)}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              ))
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
