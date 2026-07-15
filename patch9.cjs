const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/pages/learning/LearningPage.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Add import
const importSkillTree = "import { SkillTree } from './components/SkillTree';";
if (content.includes(importSkillTree) && !content.includes('PacingDashboard')) {
  content = content.replace(
    importSkillTree,
    importSkillTree + "\nimport { PacingDashboard } from './components/PacingDashboard';"
  );
}

// Add Component
const targetAnchor = "              </Card>";
if (content.includes(targetAnchor)) {
  // Find the exact anchor for the Path Switcher Header card close tag
  // We want to insert it before {/* Phases */}
  const insertionPoint = "              {/* View Toggle */}";
  
  if (content.includes(insertionPoint)) {
    content = content.replace(
      insertionPoint,
      "              <PacingDashboard path={path} />\n\n" + insertionPoint
    );
  }
}

fs.writeFileSync(pagePath, content, 'utf8');
console.log('LearningPage updated!');
