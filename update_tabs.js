const fs = require('fs');
const path = require('path');

const dir = './src/components/matches';

// 1. CreateTeamTab.tsx
let teamTab = fs.readFileSync(path.join(dir, 'CreateTeamTab.tsx'), 'utf8');
teamTab = teamTab.replace("alignItems: 'center',", "alignItems: 'flex-start',"); // brandingTopRow
teamTab = teamTab.replace("borderRadius: BorderRadius.full,", "borderRadius: BorderRadius.md,"); // sportChip
fs.writeFileSync(path.join(dir, 'CreateTeamTab.tsx'), teamTab);

// 2. CreatePlayerTab.tsx
let playerTab = fs.readFileSync(path.join(dir, 'CreatePlayerTab.tsx'), 'utf8');
playerTab = playerTab.replace("borderRadius: BorderRadius.full,", "borderRadius: BorderRadius.md,"); // sportChip
fs.writeFileSync(path.join(dir, 'CreatePlayerTab.tsx'), playerTab);

// 3. QuickMatchTab.tsx
let quickTab = fs.readFileSync(path.join(dir, 'QuickMatchTab.tsx'), 'utf8');
quickTab = quickTab.replace("borderRadius: BorderRadius.full,", "borderRadius: BorderRadius.md,"); // sportChip
quickTab = quickTab.replace("{ backgroundColor: sport.color + '1A', borderColor: sport.color + '40' },", "{ backgroundColor: theme.surfaceLow, borderColor: theme.outlineVariant + '44' },");
quickTab = quickTab.replace("color={isActive ? '#ffffff' : sport.color}", "color={isActive ? '#ffffff' : theme.textSecondary}");
quickTab = quickTab.replace("{ color: sport.color },", "{ color: theme.textSecondary },");
fs.writeFileSync(path.join(dir, 'QuickMatchTab.tsx'), quickTab);

console.log('Updated Team, Player, Quick match tabs.');
