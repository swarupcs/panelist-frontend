const fs = require('fs');
const path = require('path');

const pagePath = path.join(__dirname, 'src/pages/dashboard/DashboardPage.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// 1. Add useGamificationStats import
content = content.replace(
  "import { useAchievements } from '@/hooks/useGamification';",
  "import { useAchievements, useGamificationStats } from '@/hooks/useGamification';"
);

// 2. Add DailyQuestsWidget import after useLearning
content = content.replace(
  "import { useDueReviews } from '@/hooks/useLearning';",
  "import { useDueReviews } from '@/hooks/useLearning';\nimport { DailyQuestsWidget } from '@/components/dashboard/DailyQuestsWidget';"
);

// 3. Add gamStats hook after reviews
content = content.replace(
  "  const { data: reviews } = useDueReviews(5);",
  "  const { data: reviews } = useDueReviews(5);\n  const { data: gamStats } = useGamificationStats();"
);

// 4. Replace the stats row - replace "Completion Rate" tile with XP tile
const oldTile = `          <StatTile
            label='Completion Rate'
            value={formatPercent(stats.completionRate)}
            icon={Target}
          />`;
const newTile = `          {gamStats?.stats && (
            <StatTile
              label={\`Level \${gamStats.stats.level}\`}
              value={\`\${gamStats.stats.xp.toLocaleString()} XP\`}
              sub={gamStats.stats.xpToNextLevel > 0 ? \`\${gamStats.stats.xpToNextLevel} to next\` : 'Max Level!'}
              icon={Zap}
              color='text-primary'
            />
          )}`;
content = content.replace(oldTile, newTile);

// 5. Add DailyQuestsWidget before the History shortcut card
const historyAnchor = "          {/* History shortcut */}";
content = content.replace(
  historyAnchor,
  "          {/* Daily Quests */}\n          <DailyQuestsWidget />\n\n" + historyAnchor
);

fs.writeFileSync(pagePath, content, 'utf8');
console.log('DashboardPage patched successfully!');
