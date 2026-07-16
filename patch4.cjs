const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, 'src/pages/learning/LearningPage.tsx'), 'utf8');

// 1. Add CrashCourseModal import
if (!content.includes('CrashCourseModal')) {
  content = content.replace("import { TopicRowSkeleton } from './components/TopicRowSkeleton';", 
  "import { TopicRowSkeleton } from './components/TopicRowSkeleton';\nimport { CrashCourseModal } from './components/CrashCourseModal';");
}

// 2. Add state to TopicRow
if (!content.includes('showCrashCourse')) {
  const topicRowRegex = /function TopicRow\(\{\n  topic,\n  phaseCompleted,\n\}: \{\n  topic: LearningTopic;\n  phaseCompleted: boolean;\n\}\) \{\n  const completeTopic = useCompleteTopic\(\);\n  const navigate = useNavigate\(\);/sm;
  const topicRowReplacement = `function TopicRow({
  topic,
  phaseCompleted,
}: {
  topic: LearningTopic;
  phaseCompleted: boolean;
}) {
  const completeTopic = useCompleteTopic();
  const navigate = useNavigate();
  const [showCrashCourse, setShowCrashCourse] = useState(false);`;

  content = content.replace(topicRowRegex, topicRowReplacement);
}

// 3. Add Study button
if (!content.includes('Study Crash Course')) {
  const practiceButtonRegex = /<button\s*type='button'\s*onClick=\{\(\) =>\s*navigate\(\s*`\/interview\?type=dsa&topic=\$\{encodeURIComponent\(topic\.category\)\}`,\s*\)\s*\}\s*className='rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'\s*>\s*Practice\s*<\/button>/sm;

  const practiceButtonReplacement = `<button
                type='button'
                onClick={() => setShowCrashCourse(true)}
                className='flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs text-blue-400 hover:bg-blue-500/10 hover:text-blue-500 transition-colors'
              >
                <BookOpen className='size-3' /> Study
              </button>
              <button
                type='button'
                onClick={() =>
                  navigate(
                    \`/interview?type=dsa&topic=\${encodeURIComponent(topic.category)}\`,
                  )
                }
                className='rounded-md border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors'
              >
                Practice
              </button>`;

  content = content.replace(practiceButtonRegex, practiceButtonReplacement);
}

// 4. Add Modal to TopicRow return
if (!content.includes('<CrashCourseModal')) {
  // We look for the end of the TopicRow return div
  // The structure is:
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }
  
  const endRegex = /<\/div>\s*<\/div>\s*\);\s*\}/sm;
  const endReplacement = `</div>
      <CrashCourseModal 
        isOpen={showCrashCourse} 
        onClose={() => setShowCrashCourse(false)} 
        topicId={topic.id} 
        topicTitle={topic.title} 
      />
    </div>
  );
}`;
  content = content.replace(endRegex, endReplacement);
}

fs.writeFileSync(path.join(__dirname, 'src/pages/learning/LearningPage.tsx'), content, 'utf8');
console.log('Successfully patched TopicRow!');
