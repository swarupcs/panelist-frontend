import type { LearningPath, LearningTopic } from '@/types';
import { SkillTreeNode } from './SkillTreeNode';
import { cn } from '@/lib/utils';
import { Trophy, CheckCircle2 } from 'lucide-react';
import React, { useState } from 'react';
import { CrashCourseModal } from './CrashCourseModal';

interface SkillTreeProps {
  path: LearningPath;
}

export function SkillTree({ path }: SkillTreeProps) {
  const [crashCourseTopic, setCrashCourseTopic] = useState<LearningTopic | null>(null);

  // Flatten the path into a single sequence of nodes: Phases and Topics
  const treeNodes: Array<{
    type: 'phase' | 'topic';
    data: any;
    id: string;
    isCompleted: boolean;
    isLocked: boolean;
  }> = [];

  let previousPhaseCompleted = true; // First phase is always unlocked

  path.phases.forEach((phase) => {
    const isPhaseLocked = !previousPhaseCompleted;
    
    // Add phase header/milestone
    treeNodes.push({
      type: 'phase',
      data: phase,
      id: `phase-${phase.id}`,
      isCompleted: phase.isCompleted,
      isLocked: isPhaseLocked,
    });

    // Add topics for this phase
    phase.topics.forEach((topic) => {
      treeNodes.push({
        type: 'topic',
        data: topic,
        id: `topic-${topic.id}`,
        isCompleted: topic.isCompleted,
        isLocked: isPhaseLocked && !topic.isCompleted,
      });
    });

    previousPhaseCompleted = phase.isCompleted;
  });

  // Calculate layout parameters
  const ITEM_HEIGHT = 140; // Vertical space per item
  const MAX_OFFSET = 100; // Max horizontal zig-zag in pixels

  return (
    <div className='relative w-full max-w-2xl mx-auto py-12 flex flex-col items-center'>
      
      {/* Background SVG for drawing connection lines */}
      <svg
        className='absolute top-0 left-0 w-full h-full pointer-events-none'
        style={{ zIndex: 0 }}
      >
        <g transform="translate(50%, 0)">
          {treeNodes.map((node, i) => {
            if (i === treeNodes.length - 1) return null;
            
            const nextNode = treeNodes[i + 1];
            
            // Calculate coordinates
            const currentX = Math.sin(i * 1.2) * MAX_OFFSET;
            const currentY = i * ITEM_HEIGHT + 60; // Offset by half item height
            
            const nextX = Math.sin((i + 1) * 1.2) * MAX_OFFSET;
            const nextY = (i + 1) * ITEM_HEIGHT + 60;

            const isCompletedPath = node.isCompleted && (nextNode.type === 'phase' ? nextNode.isCompleted : nextNode.isCompleted || !nextNode.isLocked);

            return (
              <path
                key={`path-${i}`}
                d={`M ${currentX} ${currentY} C ${currentX} ${currentY + 60}, ${nextX} ${nextY - 60}, ${nextX} ${nextY}`}
                fill="none"
                stroke={isCompletedPath ? 'rgb(34 197 94)' : 'rgba(255, 255, 255, 0.1)'} // Green if completed, muted otherwise
                strokeWidth={isCompletedPath ? 8 : 6}
                strokeLinecap="round"
                className="transition-colors duration-700"
              />
            );
          })}
        </g>
      </svg>

      {/* Render Nodes */}
      <div className='relative z-10 w-full flex flex-col items-center' style={{ gap: `${ITEM_HEIGHT - 80}px` }}>
        {treeNodes.map((node, i) => {
          const offsetX = Math.sin(i * 1.2) * MAX_OFFSET;

          if (node.type === 'phase') {
            const phase = node.data;
            return (
              <div
                key={node.id}
                className='relative flex flex-col items-center justify-center h-[80px]'
                style={{ transform: `translateX(${offsetX}px)` }}
              >
                <div className={cn(
                  'px-4 py-2 rounded-xl border-2 shadow-lg backdrop-blur-md flex items-center gap-3 transition-all',
                  phase.isCompleted ? 'bg-green-500/10 border-green-500/50 text-green-400' :
                  node.isLocked ? 'bg-secondary/50 border-muted text-muted-foreground' :
                  'bg-primary/10 border-primary/50 text-primary'
                )}>
                  {phase.isCompleted ? <CheckCircle2 className='size-5' /> : <Trophy className='size-5' />}
                  <div>
                    <p className='text-xs font-bold uppercase tracking-wider opacity-80'>
                      Phase {phase.phaseNumber}
                    </p>
                    <p className='text-sm font-semibold'>
                      {phase.title}
                    </p>
                  </div>
                </div>
              </div>
            );
          }

          // Render Topic Node
          return (
            <div
              key={node.id}
              className='relative flex flex-col items-center justify-center h-[80px]'
              style={{ transform: `translateX(${offsetX}px)` }}
            >
              <SkillTreeNode
                topic={node.data}
                isLocked={node.isLocked}
                onOpenCrashCourse={(t) => setCrashCourseTopic(t)}
              />
            </div>
          );
        })}
      </div>

      {/* Crash Course Modal */}
      <CrashCourseModal
        isOpen={!!crashCourseTopic}
        onClose={() => setCrashCourseTopic(null)}
        topicId={crashCourseTopic?.id || null}
        topicTitle={crashCourseTopic?.title || null}
      />
    </div>
  );
}
