import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { usePublicGroups, useMyGroups, useCreateGroup, useJoinGroup } from '@/hooks/useStudyGroups';
import { useAuthStore } from '@/store/authStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Search, Plus, Lock, Globe, Filter, UserPlus, Loader2, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function StudyGroupListPage() {
  const { isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState<'discover' | 'my-groups'>('discover');
  const [searchInput, setSearchInput] = useState('');
  const [topicFilter, setTopicFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: publicGroupsData, isLoading: publicLoading } = usePublicGroups({
    search: searchInput,
    topic: topicFilter,
    page: 1,
    limit: 20
  });

  const { data: myGroups, isLoading: myLoading } = useMyGroups();

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Users className="size-8 text-primary" />
            Study Groups
          </h1>
          <p className="text-muted-foreground mt-1">
            Join or create groups to prepare for interviews collaboratively.
          </p>
        </div>
        {isAuthenticated && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-semibold rounded-lg shadow hover:opacity-90 transition-opacity"
          >
            <Plus className="size-5" /> Create Group
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-border mb-8">
        <button
          onClick={() => setActiveTab('discover')}
          className={`pb-4 text-sm font-semibold transition-colors relative ${
            activeTab === 'discover' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Discover
          {activeTab === 'discover' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
          )}
        </button>
        {isAuthenticated && (
          <button
            onClick={() => setActiveTab('my-groups')}
            className={`pb-4 text-sm font-semibold transition-colors relative ${
              activeTab === 'my-groups' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            My Groups
            <span className="ml-2 bg-secondary text-muted-foreground px-2 py-0.5 rounded-full text-xs">
              {myGroups?.length || 0}
            </span>
            {activeTab === 'my-groups' && (
              <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-t-full" />
            )}
          </button>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === 'discover' ? (
        <DiscoverTab 
          data={publicGroupsData} 
          isLoading={publicLoading}
          searchInput={searchInput}
          setSearchInput={setSearchInput}
          topicFilter={topicFilter}
          setTopicFilter={setTopicFilter}
        />
      ) : (
        <MyGroupsTab groups={myGroups} isLoading={myLoading} />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <CreateGroupModal onClose={() => setShowCreateModal(false)} />
      )}
    </div>
  );
}

function DiscoverTab({ data, isLoading, searchInput, setSearchInput, topicFilter, setTopicFilter }: any) {
  const joinGroup = useJoinGroup();
  const navigate = useNavigate();

  const handleJoinPublic = (groupId: string) => {
    joinGroup.mutate({ id: groupId }, {
      onSuccess: () => navigate(`/groups/${groupId}`)
    });
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search groups..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <div className="relative w-full sm:w-48">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <select
            value={topicFilter}
            onChange={(e) => setTopicFilter(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-card border border-border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 appearance-none"
          >
            <option value="">All Topics</option>
            <option value="DSA">DSA</option>
            <option value="SYSTEM_DESIGN">System Design</option>
            <option value="BEHAVIORAL">Behavioral</option>
            <option value="FRONTEND">Frontend</option>
          </select>
        </div>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-card border border-border rounded-xl p-6 flex flex-col h-[180px]">
              <div className="flex justify-between items-start mb-4">
                <Skeleton className="h-6 w-2/3" />
                <Skeleton className="size-5 rounded-full" />
              </div>
              <div className="space-y-2 mb-4 flex-1">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />
              </div>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            </div>
          ))}
        </div>
      ) : data?.groups.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <Users className="size-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">No public groups found</h3>
          <p className="text-sm text-muted-foreground mt-1">Try a different search term or create one yourself!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data?.groups.map((group: any) => (
            <div key={group.id} className="bg-card border border-border rounded-xl p-6 flex flex-col hover:border-primary/40 transition-colors">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-bold text-foreground line-clamp-1">{group.name}</h3>
                <Globe className="size-5 text-emerald-500 shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                {group.description || 'No description provided.'}
              </p>
              <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Users className="size-4" /> {group._count.members} Members
                </div>
                <button
                  onClick={() => handleJoinPublic(group.id)}
                  disabled={joinGroup.isPending}
                  className="flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  Join <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MyGroupsTab({ groups, isLoading }: any) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-card border border-border rounded-xl p-6 flex flex-col h-[180px]">
            <div className="flex justify-between items-start mb-4">
              <Skeleton className="h-6 w-2/3" />
              <Skeleton className="size-5 rounded-full" />
            </div>
            <div className="space-y-2 mb-4 flex-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/5" />
            </div>
            <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-16" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!groups || groups.length === 0) {
    return (
      <div className="text-center py-20 bg-card border border-border rounded-xl">
        <Users className="size-10 text-muted-foreground/30 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-foreground">You haven't joined any groups yet</h3>
        <p className="text-sm text-muted-foreground mt-1">Discover public groups or create a new one to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {groups.map((group: any) => (
        <Link key={group.id} to={`/groups/${group.id}`} className="bg-card border border-border rounded-xl p-6 flex flex-col hover:border-primary/40 transition-colors group">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-lg font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{group.name}</h3>
            {group.isPrivate ? <Lock className="size-5 text-amber-500 shrink-0" /> : <Globe className="size-5 text-emerald-500 shrink-0" />}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
            {group.description || 'No description provided.'}
          </p>
          <div className="flex items-center justify-between mt-auto pt-4 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Users className="size-4" /> {group._count.members} Members
            </div>
            <span className="text-xs font-medium px-2 py-1 bg-secondary rounded text-muted-foreground">
              {group.myRole}
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const createGroup = useCreateGroup();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [topic, setTopic] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [joinCode, setJoinCode] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createGroup.mutate(
      { name, description, topic, isPrivate, joinCode: isPrivate ? joinCode : undefined },
      {
        onSuccess: (group) => {
          onClose();
          navigate(`/groups/${group.id}`);
        }
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="bg-card border border-border w-full max-w-md rounded-xl shadow-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex justify-between items-center">
          <h2 className="text-xl font-bold text-foreground">Create Study Group</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Group Name</label>
            <input required type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" placeholder="e.g. System Design Prep 2026" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={3} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" placeholder="What is this group about?" />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Topic</label>
            <select value={topic} onChange={e => setTopic(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none">
              <option value="">General</option>
              <option value="DSA">DSA</option>
              <option value="SYSTEM_DESIGN">System Design</option>
              <option value="BEHAVIORAL">Behavioral</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={isPrivate} onChange={e => setIsPrivate(e.target.checked)} className="rounded text-primary focus:ring-primary/50" />
            <span className="text-sm font-medium text-foreground">Private Group</span>
          </label>

          {isPrivate && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">Join Code</label>
              <input required={isPrivate} type="text" value={joinCode} onChange={e => setJoinCode(e.target.value)} className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm focus:ring-2 focus:ring-primary/50 outline-none" placeholder="Secret code to share with friends" />
              <p className="text-xs text-muted-foreground mt-1">Users will need this code to join your group.</p>
            </div>
          )}

          <div className="pt-4 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground">Cancel</button>
            <button type="submit" disabled={createGroup.isPending || !name.trim()} className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2">
              {createGroup.isPending && <Loader2 className="size-4 animate-spin" />}
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
