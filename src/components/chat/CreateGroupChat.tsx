import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Search, Users, Loader2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatableUser {
  id: string;
  full_name: string | null;
  email: string;
  avatar_url: string | null;
  role: string;
}

interface CreateGroupChatProps {
  users: ChatableUser[] | undefined;
  isLoading: boolean;
  onCreateGroup: (name: string, participantIds: string[]) => Promise<void>;
  isCreating: boolean;
}

export function CreateGroupChat({ users, isLoading, onCreateGroup, isCreating }: CreateGroupChatProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  const filteredUsers = users?.filter(u => 
    u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleUser = (userId: string) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSubmit = async () => {
    if (selectedUsers.length < 1 || !groupName.trim()) return;
    await onCreateGroup(groupName.trim(), selectedUsers);
    setGroupName('');
    setSelectedUsers([]);
  };

  const selectedUserDetails = users?.filter(u => selectedUsers.includes(u.id)) || [];

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="groupName">Group Name</Label>
        <Input
          id="groupName"
          placeholder="e.g., Math Class Discussion"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />
      </div>

      {selectedUsers.length > 0 && (
        <div className="space-y-2">
          <Label>Selected ({selectedUsers.length})</Label>
          <div className="flex flex-wrap gap-2">
            {selectedUserDetails.map(user => (
              <Badge 
                key={user.id} 
                variant="secondary"
                className="flex items-center gap-1 pr-1"
              >
                {user.full_name || user.email}
                <button 
                  onClick={() => toggleUser(user.id)}
                  className="ml-1 hover:bg-muted rounded-full p-0.5"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Add Participants</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      <ScrollArea className="h-48 border rounded-lg">
        {isLoading ? (
          <div className="p-2 space-y-2">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : filteredUsers?.length === 0 ? (
          <p className="text-center text-muted-foreground py-4">No users found</p>
        ) : (
          <div className="p-2 space-y-1">
            {filteredUsers?.map(chatUser => (
              <label
                key={chatUser.id}
                className={cn(
                  "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                  selectedUsers.includes(chatUser.id) ? "bg-primary/10" : "hover:bg-accent"
                )}
              >
                <Checkbox
                  checked={selectedUsers.includes(chatUser.id)}
                  onCheckedChange={() => toggleUser(chatUser.id)}
                />
                <Avatar className="h-8 w-8">
                  <AvatarImage src={chatUser.avatar_url || ''} />
                  <AvatarFallback className="text-xs">{getInitials(chatUser.full_name)}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{chatUser.full_name || chatUser.email}</p>
                  <p className="text-xs text-muted-foreground capitalize">{chatUser.role}</p>
                </div>
              </label>
            ))}
          </div>
        )}
      </ScrollArea>

      <Button 
        onClick={handleSubmit} 
        disabled={selectedUsers.length < 1 || !groupName.trim() || isCreating}
        className="w-full"
      >
        {isCreating ? (
          <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Creating...</>
        ) : (
          <><Users className="h-4 w-4 mr-2" /> Create Group ({selectedUsers.length} members)</>
        )}
      </Button>
    </div>
  );
}
