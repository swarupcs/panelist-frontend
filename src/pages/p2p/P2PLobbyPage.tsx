import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWebRTC } from '@/hooks/useWebRTC';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, Search } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';

export default function P2PLobbyPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { status, joinQueue, leaveQueue, roomId } = useWebRTC();
  
  const [role, setRole] = useState('Frontend');
  const [difficulty, setDifficulty] = useState('MEDIUM');
  const [language, setLanguage] = useState('javascript');

  useEffect(() => {
    if (status === 'matched' && roomId) {
      toast.success('Match found! Joining room...');
      navigate(`/p2p/room/${roomId}`);
    }
  }, [status, roomId, navigate]);

  const handleJoin = () => {
    if (!user) {
      toast.error('You must be logged in to join a P2P session.');
      return;
    }
    joinQueue(role, difficulty, language);
  };

  const isSearching = status === 'searching';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in py-8">
      <PageHeader 
        title="Peer-to-Peer Mock Interviews" 
        description="Practice live with a real person. We'll match you with someone preparing for a similar role." 
      />

      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Find a Match</CardTitle>
            <CardDescription>Select your preferences to enter the queue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Target Role</label>
              <Select value={role} onValueChange={setRole} disabled={isSearching}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Frontend">Frontend Engineer</SelectItem>
                  <SelectItem value="Backend">Backend Engineer</SelectItem>
                  <SelectItem value="Fullstack">Fullstack Engineer</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Difficulty</label>
              <Select value={difficulty} onValueChange={setDifficulty} disabled={isSearching}>
                <SelectTrigger>
                  <SelectValue placeholder="Select difficulty" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="EASY">Easy</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HARD">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Preferred Language</label>
              <Select value={language} onValueChange={setLanguage} disabled={isSearching}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript / TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="cpp">C++</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
          <CardFooter>
            {isSearching ? (
              <Button variant="destructive" className="w-full" onClick={leaveQueue}>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Cancel Search
              </Button>
            ) : (
              <Button className="w-full" onClick={handleJoin}>
                <Search className="mr-2 h-4 w-4" />
                Find Match
              </Button>
            )}
          </CardFooter>
        </Card>

        <Card className="bg-primary/5 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              How it works
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-muted-foreground">
            <p><strong>1. Enter the queue:</strong> Select your role and difficulty. We'll match you with a peer looking for the same.</p>
            <p><strong>2. Join the room:</strong> Once matched, you'll enter a collaborative workspace with live video, audio, and a shared code editor.</p>
            <p><strong>3. Practice:</strong> Take turns being the interviewer and interviewee, or just collaborate on a difficult problem together.</p>
            <p><strong>4. Feedback:</strong> Give your peer constructive feedback at the end of the session to help them improve.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
