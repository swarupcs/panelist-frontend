const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, 'src/pages/learning/LearningPage.tsx'), 'utf8');

const regex = /<div className='text-right'>\s*<p className='text-2xl font-bold text-primary tabular-nums'>\s*\{Math\.round\(\s*\(path\.currentPhase \/ path\.totalPhases\) \* 100,\s*\)\}\s*%\s*<\/p>\s*<p className='text-xs text-muted-foreground'>complete<\/p>\s*<\/div>\s*<\/div>/sm;

const replacement = `<div className='flex items-center gap-6 text-right'>
                      {path.readinessScore !== undefined && (
                        <div>
                          <div className='flex items-center justify-end gap-1'>
                            <p className={cn('text-2xl font-bold tabular-nums', 
                              path.readinessScore >= 80 ? 'text-green-500' :
                              path.readinessScore >= 60 ? 'text-yellow-500' :
                              'text-red-500'
                            )}>
                              {path.readinessScore}
                            </p>
                            <span className='text-sm text-muted-foreground'>/100</span>
                          </div>
                          <p className='text-xs text-muted-foreground'>Readiness Score</p>
                        </div>
                      )}
                      <div>
                        <p className='text-2xl font-bold text-primary tabular-nums'>
                          {Math.round(
                            (path.currentPhase / path.totalPhases) * 100,
                          )}
                          %
                        </p>
                        <p className='text-xs text-muted-foreground'>complete</p>
                      </div>
                    </div>
                  </div>`;

if (!regex.test(content)) {
  console.log('Regex did not match!');
} else {
  content = content.replace(regex, replacement);
  fs.writeFileSync(path.join(__dirname, 'src/pages/learning/LearningPage.tsx'), content, 'utf8');
  console.log('Successfully patched!');
}
