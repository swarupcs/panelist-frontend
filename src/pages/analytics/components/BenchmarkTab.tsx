import { usePeerBenchmark } from '@/hooks/useAnalytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { LoadingScreen, ErrorState } from '@/components/common';
import { formatCategory } from '@/utils/formatters';
import { cn } from '@/lib/cn';

export function BenchmarkTab() {
  const { data: benchmark, isLoading, isError, refetch } = usePeerBenchmark();

  if (isLoading) return <LoadingScreen message="Loading benchmark data..." />;
  if (isError || !benchmark) return <ErrorState message="Failed to load benchmark" onRetry={refetch} />;

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* 1. Insight Cards */}
      {benchmark.insightCards && benchmark.insightCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {benchmark.insightCards.map((card, i) => (
            <Card key={i} className={cn(
              "border-l-4",
              card.type === 'positive' ? 'border-l-green-500 bg-green-500/5' :
              card.type === 'challenge' ? 'border-l-orange-500 bg-orange-500/5' :
              'border-l-blue-500 bg-blue-500/5'
            )}>
              <CardContent className="p-4 flex gap-3 items-start">
                <span className="text-2xl">{card.emoji}</span>
                <div>
                  <h4 className="font-semibold text-sm">{card.title}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{card.description}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2. Category Percentiles */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Category Percentiles</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {benchmark.categoryPercentiles.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No category data yet.</p>
            ) : (
              benchmark.categoryPercentiles.map(cat => (
                <div key={cat.category} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{formatCategory(cat.category)}</span>
                    <span className="font-semibold text-primary">Top {100 - cat.percentile}%</span>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-secondary overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all duration-1000",
                        cat.percentile >= 70 ? 'bg-green-500' :
                        cat.percentile >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${cat.percentile}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>You: {cat.userScore.toFixed(1)}</span>
                    <span>Avg: {cat.globalAverage.toFixed(1)}</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 3. Score Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Global Score Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-48 flex items-end gap-1 relative">
              {benchmark.scoreDistribution.map(bucket => {
                const maxCount = Math.max(...benchmark.scoreDistribution.map(b => b.count), 1);
                const heightPct = (bucket.count / maxCount) * 100;
                return (
                  <div key={bucket.bucket} className="flex-1 flex flex-col items-center gap-1 group relative">
                    {bucket.isUserBucket && (
                      <div className="absolute -top-6 text-xs font-bold text-primary whitespace-nowrap bg-background px-1.5 py-0.5 rounded shadow-sm border border-primary/20">
                        You
                      </div>
                    )}
                    <div 
                      className={cn(
                        "w-full rounded-t-sm transition-all",
                        bucket.isUserBucket ? 'bg-primary' : 'bg-secondary group-hover:bg-primary/40'
                      )}
                      style={{ height: `${heightPct}%`, minHeight: bucket.count > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[10px] text-muted-foreground rotate-45 md:rotate-0 mt-2">{bucket.bucket}</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* 4. Difficulty Comparison */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Difficulty Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            {benchmark.difficultyComparison.length === 0 ? (
               <p className="text-sm text-muted-foreground text-center py-4">No difficulty data yet.</p>
            ) : (
              benchmark.difficultyComparison.map(diff => (
                <div key={diff.difficulty} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium capitalize">{diff.difficulty.toLowerCase()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-xs text-muted-foreground text-right">You</span>
                    <div className="relative h-3 flex-1 rounded-full bg-secondary overflow-hidden">
                      <div className="absolute left-0 top-0 h-full bg-primary" style={{ width: `${diff.userPercent}%` }} />
                    </div>
                    <span className="w-12 text-xs font-medium">{diff.userPercent.toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-12 text-xs text-muted-foreground text-right">Peers</span>
                    <div className="relative h-3 flex-1 rounded-full bg-secondary overflow-hidden">
                      <div className="absolute left-0 top-0 h-full bg-muted-foreground/40" style={{ width: `${diff.peerPercent}%` }} />
                    </div>
                    <span className="w-12 text-xs font-medium text-muted-foreground">{diff.peerPercent.toFixed(0)}%</span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* 5. Role & Activity Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity & Role Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            {benchmark.rolePercentile ? (
              <div className="bg-secondary/20 p-4 rounded-xl border border-border">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-sm">Role Ranking</h4>
                  <Badge variant="outline">{benchmark.rolePercentile.role}</Badge>
                </div>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">#{benchmark.rolePercentile.userRank}</span>
                  <span className="text-sm text-muted-foreground">of {benchmark.rolePercentile.totalInRole}</span>
                </div>
                <p className="text-xs text-primary mt-1">Top {100 - benchmark.rolePercentile.percentile}% of {benchmark.rolePercentile.role} candidates</p>
              </div>
            ) : (
              <div className="bg-secondary/20 p-4 rounded-xl border border-border flex items-center justify-center">
                <p className="text-sm text-muted-foreground">Complete a role-specific interview to see your rank.</p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Practice Frequency</h4>
              <div className="flex items-center justify-between">
                <div className="text-center bg-card border rounded-lg p-3 flex-1 mr-2">
                  <div className="text-xl font-bold">{benchmark.activityComparison.userSessionsPerMonth.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Sessions/mo</div>
                </div>
                <div className="text-center bg-secondary/30 rounded-lg p-3 flex-1 ml-2">
                  <div className="text-xl font-bold text-muted-foreground">{benchmark.activityComparison.peerMedianSessionsPerMonth.toFixed(1)}</div>
                  <div className="text-xs text-muted-foreground">Peer Median</div>
                </div>
              </div>
            </div>

          </CardContent>
        </Card>

      </div>
    </div>
  );
}
