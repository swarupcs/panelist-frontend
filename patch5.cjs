const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, 'src/pages/learning/LearningPage.tsx'), 'utf8');

// 1. Add CrashCourseModal import
if (!content.includes('CrashCourseModal')) {
  content = content.replace("import { TopicRowSkeleton } from './components/TopicRowSkeleton';", 
  "import { TopicRowSkeleton } from './components/TopicRowSkeleton';\nimport { CrashCourseModal } from './components/CrashCourseModal';");
}

if (!content.includes('BookOpen,')) {
  content = content.replace("import {\n  Play,", "import {\n  Play,\n  BookOpen,");
}

// 2. Replace the start of TopicRow body
const topicRowTopSearch = `}) {
  const completeTopic = useCompleteTopic();
  const navigate = useNavigate();
  const progress =`;
  
const topicRowTopReplace = `}) {
  const completeTopic = useCompleteTopic();
  const navigate = useNavigate();
  const [showCrashCourse, setShowCrashCourse] = useState(false);
  const progress =`;

content = content.replace(topicRowTopSearch, topicRowTopReplace);

// 3. Replace the Practice button with Study + Practice
const practiceBtnSearch = `<button
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
              
const practiceBtnReplace = `<button
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

content = content.replace(practiceBtnSearch, practiceBtnReplace);

// 4. Add the modal at the end of TopicRow
const endSearch = `          {!topic.isCompleted && !isLocked && (
            <div className='flex gap-1'>`;
            
// Wait, replacing the end of the file is safer using the exact final div structure of TopicRow:
const finalDivSearch = `      </div>
    </div>
  );
}`;

const finalDivReplace = `      </div>
      <CrashCourseModal 
        isOpen={showCrashCourse} 
        onClose={() => setShowCrashCourse(false)} 
        topicId={topic.id} 
        topicTitle={topic.title} 
      />
    </div>
  );
}`;

content = content.replace(finalDivSearch, finalDivReplace);

fs.writeFileSync(path.join(__dirname, 'src/pages/learning/LearningPage.tsx'), content, 'utf8');
console.log('Successfully patched LearningPage!');
