const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, 'src/pages/learning/LearningPage.tsx'), 'utf8');

// 1. Highlight remedial phase
const phaseRegex = /<Card\s+key=\{phase\.id\}\s+className=\{cn\(phase\.isCompleted && 'opacity-70'\)\}\s*>/m;
const phaseReplacement = `<Card
                    key={phase.id}
                    className={cn(
                      phase.isCompleted && 'opacity-70',
                      phase.isRemedial && 'border-orange-500/50 shadow-[0_0_15px_rgba(249,115,22,0.1)]'
                    )}
                  >`;
content = content.replace(phaseRegex, phaseReplacement);

const badgeRegex = /\{phase\.isCompleted \? \(\s*<CheckCircle2 className='size-4' \/>\s*\) : \(\s*phase\.phaseNumber\s*\)\}\s*<\/div>\s*<div>\s*<p className='font-semibold text-sm text-foreground'>\s*\{phase\.title\}\s*<\/p>/sm;
const badgeReplacement = `{phase.isCompleted ? (
                                <CheckCircle2 className='size-4' />
                              ) : phase.isRemedial ? (
                                <span className='text-[10px]'>R</span>
                              ) : (
                                phase.phaseNumber
                              )}
                            </div>
                            <div className='flex flex-wrap items-center gap-2'>
                              <p className='font-semibold text-sm text-foreground'>
                                {phase.title}
                              </p>
                              {phase.isRemedial && (
                                <Badge variant='outline' className='text-[9px] h-4 py-0 text-orange-400 border-orange-400/50 bg-orange-400/10'>
                                  Remedial
                                </Badge>
                              )}`;
content = content.replace(badgeRegex, badgeReplacement);


// 2. Highlight remedial TopicRow
const topicRegex = /function TopicRow\(\{\s*topic,\s*phaseCompleted,\s*\}\s*:\s*\{\s*topic:\s*LearningTopic;\s*phaseCompleted:\s*boolean;\s*\}\)\s*\{/sm;
const topicReplacement = `function TopicRow({
  topic,
  phaseCompleted,
}: {
  topic: LearningTopic;
  phaseCompleted: boolean;
}) {`;
content = content.replace(topicRegex, topicReplacement);

const topicCardRegex = /className=\{cn\(\s*'rounded-lg border p-3 space-y-2',\s*topic\.isCompleted\s*\?\s*'border-green-500\/20 bg-green-500\/5'\s*:\s*'border-border bg-secondary\/20',\s*isLocked && 'opacity-50',\s*\)\}/sm;
const topicCardReplacement = `className={cn(
        'rounded-lg border p-3 space-y-2',
        topic.isCompleted
          ? 'border-green-500/20 bg-green-500/5'
          : topic.isRemedial
          ? 'border-orange-500/30 bg-orange-500/5'
          : 'border-border bg-secondary/20',
        isLocked && 'opacity-50',
      )}`;
content = content.replace(topicCardRegex, topicCardReplacement);

fs.writeFileSync(path.join(__dirname, 'src/pages/learning/LearningPage.tsx'), content, 'utf8');
console.log('done patching UI');
