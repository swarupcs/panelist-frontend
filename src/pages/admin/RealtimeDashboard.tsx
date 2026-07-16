// src/pages/admin/RealtimeDashboard.tsx
import { useEffect, useState, useRef } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Activity, AlertTriangle, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/cn';

interface AdminMetrics {
  activeUsers: number;
  liveInterviews: number;
  errorRate: number;
  timestamp: string;
}

export function RealtimeDashboard() {
  const { tokens } = useAuthStore();
  const token = tokens?.accessToken;
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null);
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const ws = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!token) return;

    let isMounted = true;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      setStatus('connecting');
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      // In development, the API runs on port 3000 typically
      const wsUrl = import.meta.env.DEV 
        ? `ws://localhost:3000/admin-ws?token=${token}`
        : `${protocol}//${window.location.host}/admin-ws?token=${token}`;

      ws.current = new WebSocket(wsUrl);

      ws.current.onopen = () => {
        if (isMounted) setStatus('connected');
      };

      ws.current.onmessage = (event) => {
        if (!isMounted) return;
        try {
          const payload = JSON.parse(event.data);
          if (payload.type === 'METRICS_UPDATE') {
            setMetrics(payload.data);
          }
        } catch (err) {
          console.error('Failed to parse admin metrics', err);
        }
      };

      ws.current.onclose = () => {
        if (isMounted) {
          setStatus('disconnected');
          // Reconnect after 5 seconds
          reconnectTimer = setTimeout(connect, 5000);
        }
      };

      ws.current.onerror = () => {
        ws.current?.close();
      };
    };

    connect();

    return () => {
      isMounted = false;
      clearTimeout(reconnectTimer);
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [token]);

  // Determine error rate color
  const getErrorColor = (rate: number) => {
    if (rate < 1) return 'text-green-500';
    if (rate < 5) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex items-center justify-between'>
        <div>
          <h2 className='text-2xl font-bold tracking-tight'>Real-time Telemetry</h2>
          <p className='text-muted-foreground text-sm'>Live overview of system activity</p>
        </div>
        
        <div className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium border',
          status === 'connected' ? 'bg-green-500/10 text-green-500 border-green-500/20' :
          status === 'connecting' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20' :
          'bg-red-500/10 text-red-500 border-red-500/20'
        )}>
          {status === 'connected' ? <Wifi className='size-3.5' /> : <WifiOff className='size-3.5' />}
          {status === 'connected' ? 'Live' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
          
          {status === 'connected' && (
            <span className='relative flex h-2 w-2 ml-1'>
              <span className='animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75'></span>
              <span className='relative inline-flex rounded-full h-2 w-2 bg-green-500'></span>
            </span>
          )}
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        {/* Active Users */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Active Users (15m)</CardTitle>
            <Users className='size-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-foreground'>
              {metrics ? metrics.activeUsers : '--'}
            </div>
          </CardContent>
        </Card>

        {/* Live Interviews */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Live Interviews</CardTitle>
            <Activity className='size-4 text-primary' />
          </CardHeader>
          <CardContent>
            <div className='text-3xl font-bold text-primary'>
              {metrics ? metrics.liveInterviews : '--'}
            </div>
            <p className='text-xs text-muted-foreground mt-1'>
              Currently active sessions
            </p>
          </CardContent>
        </Card>

        {/* Error Rate Gauge */}
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Error Rate</CardTitle>
            <AlertTriangle className={cn('size-4', metrics ? getErrorColor(metrics.errorRate) : 'text-muted-foreground')} />
          </CardHeader>
          <CardContent>
            <div className='flex items-end gap-2'>
              <div className={cn('text-3xl font-bold', metrics ? getErrorColor(metrics.errorRate) : 'text-foreground')}>
                {metrics ? `${metrics.errorRate.toFixed(1)}%` : '--%'}
              </div>
            </div>
            {/* Simple Visual Gauge */}
            <div className='h-2 w-full bg-secondary rounded-full mt-3 overflow-hidden'>
              <div 
                className={cn('h-full transition-all duration-1000', 
                  metrics?.errorRate && metrics.errorRate < 1 ? 'bg-green-500' :
                  metrics?.errorRate && metrics.errorRate < 5 ? 'bg-yellow-500' : 'bg-red-500'
                )}
                style={{ width: `${Math.min(100, Math.max(2, (metrics?.errorRate || 0)))}%` }}
              />
            </div>
            <p className='text-[10px] text-muted-foreground mt-1.5 text-right'>Rolling Window</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
