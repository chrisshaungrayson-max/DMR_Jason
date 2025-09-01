#!/usr/bin/env node

/**
 * Text Component Migration Script
 * Migrates React Native Text components to Gluestack UI Text/Heading components
 */

const fs = require('fs');
const path = require('path');

const filesToMigrate = [
  'app/(tabs)/settings.tsx',
  'app/auth.tsx',
  'app/components/ConfirmationDialog.tsx',
  'app/components/CustomDatePicker.tsx',
  'app/components/DevPanel.tsx',
  'app/components/EmptyState.tsx',
  'app/components/GoalCard.tsx',
  'app/components/IdealComparisonCard.tsx',
  'app/components/RadarChart.tsx',
  'app/components/StreakHeatmap.tsx',
  'app/components/TrendLineChart.tsx',
  'app/daily-summary.tsx',
  'app/phone-verification.tsx',
  'app/results-popover.tsx',
  'app/results.tsx'
];

const migrateFile = (filePath) => {
  console.log(`Migrating ${filePath}...`);
  
  if (!fs.existsSync(filePath)) {
    console.log(`File not found: ${filePath}`);
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Replace import statement
  content = content.replace(
    /import\s*{\s*([^}]*),?\s*Text\s*,?\s*([^}]*)\s*}\s*from\s*['"]react-native['"];?/g,
    (match, before, after) => {
      const imports = [before, after].filter(Boolean).join(', ').replace(/,\s*,/g, ',').trim();
      const cleanImports = imports.replace(/^,\s*|,\s*$/g, '');
      return `import { ${cleanImports} } from 'react-native';\nimport { Text, Heading } from '@gluestack-ui/themed';`;
    }
  );
  
  // Common Text component patterns to migrate
  const textMigrations = [
    // Section titles -> Heading
    {
      pattern: /<Text\s+style={\[?styles\.sectionTitle[^\]]*\]?}[^>]*>/g,
      replacement: '<Heading size="lg" color="$textLight0" $dark-color="$textDark0" mb="$3">'
    },
    // Modal titles -> Heading
    {
      pattern: /<Text\s+style={\[?styles\.modalTitle[^\]]*\]?}[^>]*>/g,
      replacement: '<Heading size="lg" color="$textLight0" $dark-color="$textDark0">'
    },
    // Field labels -> Text with semibold
    {
      pattern: /<Text\s+style={\[?styles\.fieldLabel[^\]]*\]?}[^>]*>/g,
      replacement: '<Text color="$textLight0" $dark-color="$textDark0" fontSize="$sm" fontWeight="$semibold">'
    },
    // Button text -> Text with white color
    {
      pattern: /<Text\s+style={\[?styles\.(button|btn)Text[^\]]*\]?}[^>]*>/g,
      replacement: '<Text color="$white" fontSize="$md" fontWeight="$semibold">'
    },
    // Error text -> Text with error color
    {
      pattern: /<Text\s+style={\[?styles\.error[^\]]*\]?}[^>]*>/g,
      replacement: '<Text color="$error500" fontSize="$sm">'
    },
    // Subtitle/secondary text -> Text with muted color
    {
      pattern: /<Text\s+style={\[?styles\.(subtitle|secondary|muted)[^\]]*\]?}[^>]*>/g,
      replacement: '<Text color="$textLight400" $dark-color="$textDark400" fontSize="$sm">'
    },
    // Generic Text with theme color -> Gluestack Text
    {
      pattern: /<Text\s+style={\[?[^,\]]*{\s*color:\s*theme\.text[^}]*}[^\]]*\]?}[^>]*>/g,
      replacement: '<Text color="$textLight0" $dark-color="$textDark0">'
    }
  ];
  
  // Apply migrations
  textMigrations.forEach(({ pattern, replacement }) => {
    content = content.replace(pattern, replacement);
  });
  
  // Write back to file
  fs.writeFileSync(filePath, content, 'utf8');
  console.log(`✓ Migrated ${filePath}`);
};

// Run migrations
console.log('Starting Text component migration...\n');

filesToMigrate.forEach(file => {
  const fullPath = path.join(__dirname, file);
  migrateFile(fullPath);
});

console.log('\n✅ Text component migration completed!');
console.log('\nNote: Manual review and testing recommended for complex components.');
