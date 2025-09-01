const fs = require('fs');
const path = require('path');

// Files to migrate View components to Gluestack layout components
const filesToMigrate = [
  'app/(tabs)/index.tsx',
  'app/(tabs)/profile.tsx',
  'app/(tabs)/log-food.tsx',
  'app/(tabs)/history.tsx',
  'app/(tabs)/settings.tsx'
];

// Common View to Gluestack component mappings
const viewReplacements = [
  // Basic View replacements - prioritize semantic layout components
  {
    pattern: /<View style={\[?styles\.container[^\]]*\]?}>/g,
    replacement: '<Box flex={1} backgroundColor="$backgroundLight0" $dark-backgroundColor="$backgroundDark950">'
  },
  {
    pattern: /<View style={\[?styles\.header[^\]]*\]?}>/g,
    replacement: '<HStack alignItems="center" justifyContent="space-between" p="$4" backgroundColor="$backgroundLight50" $dark-backgroundColor="$backgroundDark900">'
  },
  {
    pattern: /<View style={\[?styles\.section[^\]]*\]?}>/g,
    replacement: '<VStack space="$3" p="$4">'
  },
  {
    pattern: /<View style={\[?styles\.row[^\]]*\]?}>/g,
    replacement: '<HStack space="$3" alignItems="center">'
  },
  {
    pattern: /<View style={\[?styles\.column[^\]]*\]?}>/g,
    replacement: '<VStack space="$2">'
  },
  {
    pattern: /<View style={\[?styles\.card[^\]]*\]?}>/g,
    replacement: '<Box backgroundColor="$backgroundLight0" $dark-backgroundColor="$backgroundDark950" borderRadius="$lg" p="$4" borderWidth={1} borderColor="$borderLight300" $dark-borderColor="$borderDark700">'
  },
  // Generic View replacements
  {
    pattern: /<View style={\{[^}]*flexDirection:\s*['"']row['"'][^}]*\}}/g,
    replacement: '<HStack space="$2" alignItems="center"'
  },
  {
    pattern: /<View style={\{[^}]*flexDirection:\s*['"']column['"'][^}]*\}}/g,
    replacement: '<VStack space="$2"'
  },
  {
    pattern: /<View(\s+[^>]*)>/g,
    replacement: '<Box$1>'
  },
  {
    pattern: /<\/View>/g,
    replacement: '</Box>'
  }
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

    // Apply View component replacements
    viewReplacements.forEach(({ pattern, replacement }) => {
      const originalContent = content;
      content = content.replace(pattern, replacement);
      if (content !== originalContent) {
        modified = true;
      }
    });

    if (modified) {
      fs.writeFileSync(fullPath, content, 'utf8');
      console.log(`✓ Migrated View components in ${filePath}`);
      return true;
    } else {
      console.log(`- No View components to migrate in ${filePath}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error migrating ${filePath}:`, error.message);
    return false;
  }
}

function main() {
  console.log('Starting View component migration to Gluestack layout components...\n');

  let totalMigrated = 0;
  
  filesToMigrate.forEach(filePath => {
    console.log(`Migrating ${filePath}...`);
    if (migrateFile(filePath)) {
      totalMigrated++;
    }
  });

  console.log(`\n✅ View component migration completed!`);
  console.log(`📊 ${totalMigrated} files migrated`);
  console.log('\nNote: Manual review recommended for complex layout structures.');
}

main();
