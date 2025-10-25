#!/usr/bin/env node

/**
 * Script de remplacement des couleurs orange par blue dans StudyMarket
 * 
 * Remplace toutes les classes Tailwind orange par blue (couleur de la charte)
 */

const fs = require('fs');
const path = require('path');

// Mapping des couleurs orange vers blue
const COLOR_REPLACEMENTS = [
  // Backgrounds
  { from: /bg-orange-50\b/g, to: 'bg-blue-50' },
  { from: /bg-orange-100\b/g, to: 'bg-blue-100' },
  { from: /bg-orange-200\b/g, to: 'bg-blue-200' },
  { from: /bg-orange-300\b/g, to: 'bg-blue-300' },
  { from: /bg-orange-400\b/g, to: 'bg-blue-400' },
  { from: /bg-orange-500\b/g, to: 'bg-blue-500' },
  { from: /bg-orange-600\b/g, to: 'bg-blue-600' },
  { from: /bg-orange-700\b/g, to: 'bg-blue-700' },
  { from: /bg-orange-800\b/g, to: 'bg-blue-800' },
  { from: /bg-orange-900\b/g, to: 'bg-blue-900' },
  
  // Text colors
  { from: /text-orange-50\b/g, to: 'text-blue-50' },
  { from: /text-orange-100\b/g, to: 'text-blue-100' },
  { from: /text-orange-200\b/g, to: 'text-blue-200' },
  { from: /text-orange-300\b/g, to: 'text-blue-300' },
  { from: /text-orange-400\b/g, to: 'text-blue-400' },
  { from: /text-orange-500\b/g, to: 'text-blue-500' },
  { from: /text-orange-600\b/g, to: 'text-blue-600' },
  { from: /text-orange-700\b/g, to: 'text-blue-700' },
  { from: /text-orange-800\b/g, to: 'text-blue-800' },
  { from: /text-orange-900\b/g, to: 'text-blue-900' },
  
  // Borders
  { from: /border-orange-50\b/g, to: 'border-blue-50' },
  { from: /border-orange-100\b/g, to: 'border-blue-100' },
  { from: /border-orange-200\b/g, to: 'border-blue-200' },
  { from: /border-orange-300\b/g, to: 'border-blue-300' },
  { from: /border-orange-400\b/g, to: 'border-blue-400' },
  { from: /border-orange-500\b/g, to: 'border-blue-500' },
  { from: /border-orange-600\b/g, to: 'border-blue-600' },
  { from: /border-orange-700\b/g, to: 'border-blue-700' },
  { from: /border-orange-800\b/g, to: 'border-blue-800' },
  { from: /border-orange-900\b/g, to: 'border-blue-900' },
  
  // Hover states
  { from: /hover:bg-orange-50\b/g, to: 'hover:bg-blue-50' },
  { from: /hover:bg-orange-100\b/g, to: 'hover:bg-blue-100' },
  { from: /hover:bg-orange-200\b/g, to: 'hover:bg-blue-200' },
  { from: /hover:bg-orange-300\b/g, to: 'hover:bg-blue-300' },
  { from: /hover:bg-orange-600\b/g, to: 'hover:bg-blue-600' },
  { from: /hover:bg-orange-700\b/g, to: 'hover:bg-blue-700' },
  
  { from: /hover:text-orange-50\b/g, to: 'hover:text-blue-50' },
  { from: /hover:text-orange-100\b/g, to: 'hover:text-blue-100' },
  { from: /hover:text-orange-600\b/g, to: 'hover:text-blue-600' },
  { from: /hover:text-orange-700\b/g, to: 'hover:text-blue-700' },
  { from: /hover:text-orange-800\b/g, to: 'hover:text-blue-800' },
  
  { from: /hover:border-orange-300\b/g, to: 'hover:border-blue-300' },
  { from: /hover:border-orange-600\b/g, to: 'hover:border-blue-600' },
];

// Exceptions - fichiers à ne pas modifier
const EXCEPTIONS = [
  // Ajoutez ici les fichiers qui doivent garder orange (ex: logos, images de brand)
];

function replaceOrangeWithBlue(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip les fichiers d'exception
  if (EXCEPTIONS.includes(fileName)) {
    return { modified: false, skipped: true };
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  let replacementCount = 0;
  
  COLOR_REPLACEMENTS.forEach(({ from, to }) => {
    const matches = content.match(from);
    if (matches) {
      content = content.replace(from, to);
      modified = true;
      replacementCount += matches.length;
    }
  });
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  
  return { modified, skipped: false, count: replacementCount };
}

function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules et autres dossiers
      if (!['node_modules', '.git', 'dist', 'build', 'public'].includes(file)) {
        walkDirectory(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts') || file.endsWith('.css') || file.endsWith('.jsx') || file.endsWith('.js')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function main() {
  console.log('🎨 Remplacement des couleurs orange par blue dans StudyMarket...\n');
  
  const srcDir = path.join(__dirname, 'src');
  const files = walkDirectory(srcDir);
  
  let totalReplacements = 0;
  let filesModified = 0;
  let filesSkipped = 0;
  
  const modifiedFiles = [];
  
  files.forEach(file => {
    const { modified, skipped, count } = replaceOrangeWithBlue(file);
    
    if (skipped) {
      filesSkipped++;
      return;
    }
    
    if (modified) {
      filesModified++;
      totalReplacements += count;
      modifiedFiles.push({
        file: path.relative(srcDir, file),
        count
      });
    }
  });
  
  // Afficher les résultats
  if (totalReplacements === 0) {
    console.log('✅ Aucune couleur orange trouvée - déjà tout en blue!\n');
  } else {
    console.log(`✅ ${totalReplacements} remplacement(s) effectué(s) dans ${filesModified} fichier(s)\n`);
    
    console.log('📝 Fichiers modifiés:');
    modifiedFiles.forEach(({ file, count }) => {
      console.log(`   - ${file} (${count} remplacement${count > 1 ? 's' : ''})`);
    });
  }
  
  console.log(`\n📊 Statistiques:`);
  console.log(`   - Fichiers vérifiés: ${files.length}`);
  console.log(`   - Fichiers modifiés: ${filesModified}`);
  console.log(`   - Total de remplacements: ${totalReplacements}`);
  console.log(`   - Fichiers ignorés: ${filesSkipped}`);
  
  console.log(`\n✨ Toutes les couleurs orange ont été remplacées par blue (couleur de la charte)!`);
}

main();

