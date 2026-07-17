const fs = require('fs');
const path = require('path');

let content = fs.readFileSync(path.join(__dirname, 'src/pages/learning/LearningPage.tsx'), 'utf8');

// 1. Add ViewMode state and imports
if (!content.includes('SkillTree')) {
  // Add import
  content = content.replace("import { PageHeader, EmptyState } from '@/components/common';", 
  "import { PageHeader, EmptyState } from '@/components/common';\nimport { SkillTree } from './components/SkillTree';");
  
  // Add LayoutTemplate, List icon
  content = content.replace("import {\n  BookOpen,", "import {\n  BookOpen,\n  LayoutTemplate,\n  List,");
}

if (!content.includes("viewMode")) {
  // Add state to LearningPage
  const learningPageTopSearch = `export default function LearningPage() {
  const { data: pathData, isLoading: pathLoading } = useLearningPath();`;
  const learningPageTopReplace = `export default function LearningPage() {
  const { data: pathData, isLoading: pathLoading } = useLearningPath();
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');`;
  
  content = content.replace(learningPageTopSearch, learningPageTopReplace);
}

// 2. Add toggle switch near the header of the Learning Path tab
// Search for `activeTab === 'path' &&` block
const activeTabBlockSearch = `{/* ── Learning Path tab ── */}
      {activeTab === 'path' && (
        <div className='space-y-6'>
          {pathLoading ? (`;

const activeTabBlockReplace = `{/* ── Learning Path tab ── */}
      {activeTab === 'path' && (
        <div className='space-y-6'>
          {/* View Toggle */}
          {!pathLoading && path && !showGenerator && (
            <div className='flex justify-end mb-2'>
              <div className='flex bg-secondary/50 p-1 rounded-lg'>
                <button
                  type='button'
                  onClick={() => setViewMode('list')}
                  className={\`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors \${
                    viewMode === 'list'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }\`}
                >
                  <List className='size-3.5' /> List
                </button>
                <button
                  type='button'
                  onClick={() => setViewMode('tree')}
                  className={\`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors \${
                    viewMode === 'tree'
                      ? 'bg-background text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
                  }\`}
                >
                  <LayoutTemplate className='size-3.5' /> Tree
                </button>
              </div>
            </div>
          )}
          {pathLoading ? (`;

if (content.includes(activeTabBlockSearch)) {
  content = content.replace(activeTabBlockSearch, activeTabBlockReplace);
}

// 3. Render either SkillTree or the Card List
const cardListSearch = `{/* Phases */}
              {path.phases.map((phase) => {`;
              
const cardListReplace = `{/* Phases */}
              {viewMode === 'tree' ? (
                <SkillTree path={path} />
              ) : (
                <div className='space-y-4'>
                  {path.phases.map((phase) => {`;

if (content.includes(cardListSearch)) {
  content = content.replace(cardListSearch, cardListReplace);
}

// Fix the closing bracket for the list view
// After mapping over phases, there's `})}`. We need to close the `</div>` for the list mode
const cardListEndSearch = `              })}

              {/* Regenerate and Delete */}`;
              
const cardListEndReplace = `              })}
                </div>
              )}

              {/* Regenerate and Delete */}`;

if (content.includes(cardListEndSearch)) {
  content = content.replace(cardListEndSearch, cardListEndReplace);
}

fs.writeFileSync(path.join(__dirname, 'src/pages/learning/LearningPage.tsx'), content, 'utf8');
console.log('Successfully patched LearningPage with SkillTree viewMode toggle!');
