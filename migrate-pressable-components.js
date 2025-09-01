const fs = require('fs');
const path = require('path');

// Files to migrate Pressable components to Gluestack Pressable
const filesToMigrate = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/profile.tsx', 
  'app/(tabs)/log-food.tsx',
  'app/(tabs)/history.tsx',
  'app/(tabs)/settings.tsx',
  'app/modal.tsx',
  'app/tdee-input.tsx',
  'app/results.tsx',
  'app/tdee-results.tsx',
  'app/daily-summary.tsx',
  'app/results-popover.tsx'
];

function migrateFile(filePath) {
  try {
    const fullPath = path.join(__dirname, filePath);
    
    if (!fs.existsSync(fullPath)) {
      console.log(`⚠️  File not found: ${filePath}`);
      return false;
    }

    let content = fs.readFileSync(fullPath, 'utf8');
    let modified = false;

    // Check if file already imports Gluestack Pressable
    const hasGluestackPressable = content.includes('import { Text, Heading, Box, VStack, HStack, Pressable }') ||
                                  content.includes('Pressable } from \'@gluestack-ui/themed\'');

    // Add Gluestack Pressable import if not present
    if (!hasGluestackPressable && content.includes('from \'react-native\'')) {
      // Remove Pressable from react-native import
      const rnImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]react-native['"];/;
      const rnMatch = content.match(rnImportRegex);
      
      if (rnMatch && rnMatch[1].includes('Pressable')) {
        const imports = rnMatch[1].split(',').map(imp => imp.trim()).filter(imp => imp !== 'Pressable');
        const newRnImport = `import { ${imports.join(', ')} } from 'react-native';`;
        content = content.replace(rnImportRegex, newRnImport);
        modified = true;
      }

      // Add Pressable to Gluestack import
      const gluestackImportRegex = /import\s*{\s*([^}]+)\s*}\s*from\s*['"]@gluestack-ui\/themed['"];/;
      const gluestackMatch = content.match(gluestackImportRegex);
      
      if (gluestackMatch) {
        const imports = gluestackMatch[1].split(',').map(imp => imp.trim());
        if (!imports.includes('Pressable')) {
          imports.push('Pressable');
          const newGluestackImport = `import { ${imports.join(', ')} } from '@gluestack-ui/themed';`;
          content = content.replace(gluestackImportRegex, newGluestackImport);
          modified = true;
        }
      }
    }

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✓ Migrated Pressable imports in ${filePath}`);
      return true;
    } else {
      console.log(`- No Pressable import changes needed in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('Starting Pressable component migration to Gluestack Pressable...\n');

  let totalMigrated = 0;
  
  filesToMigrate.forEach(filePath => {
    console.log(`Migrating ${filePath}...`);
    if (migrateFile(filePath)) {
      totalMigrated++;
    }
  });

  console.log(`\n✅ Pressable component migration completed!`);
  console.log(`📊 ${totalMigrated} files migrated`);
  console.log('\nNote: Pressable components now use Gluestack theming and styling.');
}

main();
