#!/usr/bin/env node

/**
 * Script de vérification de l'alignement du texte dans StudyMarket
 * 
 * Ce script recherche les patterns problématiques d'alignement de texte
 * et suggère des corrections.
 */

const fs = require('fs');
const path = require('path');

const PATTERNS_TO_CHECK = [
  {
    pattern: /<h[1-6][^>]*className="[^"]*text-center/g,
    message: '⚠️  Titre avec text-center (devrait être text-left sauf HomePage)',
    severity: 'warning'
  },
  {
    pattern: /<CardTitle[^>]*className="[^"]*text-center/g,
    message: '⚠️  CardTitle avec text-center (devrait être text-left)',
    severity: 'warning'
  },
  {
    pattern: /flex items-center justify-between[^>]*>\s*<div[^>]*>\s*<p className="font-medium/g,
    message: '💡 Utiliser items-start au lieu de items-center pour les listes avec Switch',
    severity: 'suggestion'
  },
  {
    pattern: /<div className="[^"]*">\s*<Icon[^>]*\/>\s*<div>\s*<p/g,
    message: '💡 Ajouter text-left explicite dans les sections avec icône',
    severity: 'suggestion'
  }
];

const EXCEPTIONS = [
  'HomePage.tsx',  // Page marketing
  'AuthPage.tsx',  // Page d'authentification peut avoir du centrage
  'EmailVerificationHandler.tsx',  // Modal de vérification
  'PaymentSuccessPage.tsx'  // Page de succès peut être centrée
];

function checkFile(filePath) {
  const fileName = path.basename(filePath);
  
  // Skip les fichiers d'exception
  if (EXCEPTIONS.includes(fileName)) {
    return { issues: [], skipped: true };
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  const issues = [];
  
  PATTERNS_TO_CHECK.forEach(({ pattern, message, severity }) => {
    const matches = content.match(pattern);
    if (matches) {
      issues.push({
        file: filePath,
        pattern: pattern.toString(),
        message,
        severity,
        count: matches.length,
        lines: findLineNumbers(content, pattern)
      });
    }
  });
  
  return { issues, skipped: false };
}

function findLineNumbers(content, pattern) {
  const lines = content.split('\n');
  const lineNumbers = [];
  
  lines.forEach((line, index) => {
    if (pattern.test(line)) {
      lineNumbers.push(index + 1);
    }
  });
  
  return lineNumbers;
}

function walkDirectory(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      // Skip node_modules et autres dossiers
      if (!['node_modules', '.git', 'dist', 'build'].includes(file)) {
        walkDirectory(filePath, fileList);
      }
    } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
      fileList.push(filePath);
    }
  });
  
  return fileList;
}

function main() {
  console.log('🔍 Vérification de l\'alignement du texte dans StudyMarket...\n');
  
  const srcDir = path.join(__dirname, 'src');
  const files = walkDirectory(srcDir);
  
  let totalIssues = 0;
  let filesWithIssues = 0;
  let filesSkipped = 0;
  
  const issuesByFile = {};
  
  files.forEach(file => {
    const { issues, skipped } = checkFile(file);
    
    if (skipped) {
      filesSkipped++;
      return;
    }
    
    if (issues.length > 0) {
      filesWithIssues++;
      totalIssues += issues.reduce((sum, issue) => sum + issue.count, 0);
      issuesByFile[file] = issues;
    }
  });
  
  // Afficher les résultats
  if (totalIssues === 0) {
    console.log('✅ Aucun problème d\'alignement détecté!\n');
    console.log(`📊 Statistiques:`);
    console.log(`   - Fichiers vérifiés: ${files.length - filesSkipped}`);
    console.log(`   - Fichiers ignorés: ${filesSkipped}`);
  } else {
    console.log(`❌ ${totalIssues} problème(s) d'alignement détecté(s) dans ${filesWithIssues} fichier(s)\n`);
    
    Object.entries(issuesByFile).forEach(([file, issues]) => {
      console.log(`\n📄 ${path.relative(srcDir, file)}`);
      issues.forEach(issue => {
        console.log(`   ${issue.severity === 'warning' ? '⚠️ ' : '💡'} ${issue.message}`);
        console.log(`      ${issue.count} occurrence(s) aux lignes: ${issue.lines.join(', ')}`);
      });
    });
    
    console.log(`\n\n📊 Statistiques:`);
    console.log(`   - Fichiers vérifiés: ${files.length - filesSkipped}`);
    console.log(`   - Fichiers avec problèmes: ${filesWithIssues}`);
    console.log(`   - Total de problèmes: ${totalIssues}`);
    console.log(`   - Fichiers ignorés: ${filesSkipped} (${EXCEPTIONS.join(', ')})`);
    
    console.log(`\n\n📚 Consultez docs/GUIDE-ALIGNEMENT-TEXTE.md pour les bonnes pratiques`);
  }
}

main();

