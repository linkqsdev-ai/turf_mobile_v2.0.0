const fs = require('fs');
const path = require('path');

const dir = './src/components/matches';
const files = ['CreateTeamTab.tsx', 'CreatePlayerTab.tsx', 'QuickMatchTab.tsx', 'BidMatchTab.tsx'];

files.forEach(file => {
  const filePath = path.join(dir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace active sport.color with theme.primary
  content = content.replace(/isActive && \{ backgroundColor: sport\.color, borderColor: sport\.color \}/g, 
                            "isActive && { backgroundColor: theme.primary, borderColor: theme.primary }");
  
  fs.writeFileSync(filePath, content);
});

console.log('Updated sport active colors to theme.primary.');
