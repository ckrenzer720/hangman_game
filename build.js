#!/usr/bin/env node
/**
 * Build script for Hangman Game
 * Minifies JavaScript files and provides bundle analysis
 */

const fs = require('fs');
const path = require('path');

// Try to load terser, but don't fail if it's not installed
let minify;
try {
  minify = require('terser').minify;
} catch (error) {
  console.warn('⚠️  terser not found. Install it with: npm install --save-dev terser');
  console.warn('   Building without minification...\n');
  minify = null;
}

const SCRIPTS_DIR = path.join(__dirname, 'scripts');
const BUILD_DIR = path.join(__dirname, 'dist');
const ANALYZE = process.argv.includes('--analyze');

// Ensure build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

// Configuration for minification
const minifyOptions = {
  compress: {
    drop_console: false, // Keep console.log for debugging
    drop_debugger: true,
    pure_funcs: ['console.debug', 'console.trace'],
    passes: 2,
  },
  mangle: {
    reserved: ['GameUtils', 'HangmanGame', 'GameUI'], // Don't mangle public APIs
  },
  format: {
    comments: false,
  },
};

/**
 * Get all JavaScript files in a directory
 */
function getJSFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...getJSFiles(fullPath));
    } else if (item.endsWith('.js')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

/**
 * Minify a single file
 */
async function minifyFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(SCRIPTS_DIR, filePath);
  const outputPath = path.join(BUILD_DIR, relativePath);
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // If terser is not available, just copy the file
    if (!minify) {
      fs.writeFileSync(outputPath, content);
      return {
        success: true,
        file: relativePath,
        originalSize: content.length,
        minifiedSize: content.length,
        savings: 0,
      };
    }
    
    const result = await minify(content, minifyOptions);
    
    if (result.error) {
      console.error(`Error minifying ${relativePath}:`, result.error);
      // Copy original file if minification fails
      fs.writeFileSync(outputPath, content);
      return { success: false, originalSize: content.length, minifiedSize: content.length };
    }
    
    fs.writeFileSync(outputPath, result.code);
    
    const originalSize = content.length;
    const minifiedSize = result.code.length;
    const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
    
    return {
      success: true,
      file: relativePath,
      originalSize,
      minifiedSize,
      savings: parseFloat(savings),
    };
  } catch (error) {
    console.error(`Error processing ${relativePath}:`, error);
    // Copy original file on error
    fs.writeFileSync(outputPath, content);
    return { success: false, originalSize: content.length, minifiedSize: content.length };
  }
}

/**
 * Copy non-JS files to build directory
 */
function copyNonJSFiles() {
  const filesToCopy = [
    { src: 'index.html', dest: 'index.html' },
    { src: 'data/words.json', dest: 'data/words.json' },
  ];
  
  // Copy styles directory
  const stylesDir = path.join(__dirname, 'styles');
  if (fs.existsSync(stylesDir)) {
    const stylesBuildDir = path.join(BUILD_DIR, 'styles');
    if (!fs.existsSync(stylesBuildDir)) {
      fs.mkdirSync(stylesBuildDir, { recursive: true });
    }
    
    const styleFiles = fs.readdirSync(stylesDir);
    for (const file of styleFiles) {
      if (file.endsWith('.css')) {
        const src = path.join(stylesDir, file);
        const dest = path.join(stylesBuildDir, file);
        fs.copyFileSync(src, dest);
      }
    }
  }
  
  for (const { src, dest } of filesToCopy) {
    const srcPath = path.join(__dirname, src);
    const destPath = path.join(BUILD_DIR, dest);
    
    if (fs.existsSync(srcPath)) {
      const destDir = path.dirname(destPath);
      if (!fs.existsSync(destDir)) {
        fs.mkdirSync(destDir, { recursive: true });
      }
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

/**
 * Main build function
 */
async function build() {
  console.log('🔨 Starting build process...\n');
  
  const jsFiles = getJSFiles(SCRIPTS_DIR);
  console.log(`Found ${jsFiles.length} JavaScript files to process\n`);
  
  const results = [];
  let totalOriginal = 0;
  let totalMinified = 0;
  
  for (const file of jsFiles) {
    const result = await minifyFile(file);
    results.push(result);
    
    if (result.success) {
      totalOriginal += result.originalSize;
      totalMinified += result.minifiedSize;
      
      if (ANALYZE) {
        console.log(`${result.file}:`);
        console.log(`  Original: ${(result.originalSize / 1024).toFixed(2)} KB`);
        console.log(`  Minified: ${(result.minifiedSize / 1024).toFixed(2)} KB`);
        console.log(`  Savings: ${result.savings}%\n`);
      }
    }
  }
  
  // Copy non-JS files
  copyNonJSFiles();
  
  // Print summary
  const totalSavings = ((1 - totalMinified / totalOriginal) * 100).toFixed(2);
  console.log('✅ Build complete!\n');
  console.log('Summary:');
  console.log(`  Total files: ${jsFiles.length}`);
  console.log(`  Original size: ${(totalOriginal / 1024).toFixed(2)} KB`);
  console.log(`  Minified size: ${(totalMinified / 1024).toFixed(2)} KB`);
  console.log(`  Total savings: ${totalSavings}%`);
  console.log(`\n📦 Build output: ${BUILD_DIR}`);
  
  // Write build info
  const buildInfo = {
    timestamp: new Date().toISOString(),
    files: results.length,
    totalOriginalSize: totalOriginal,
    totalMinifiedSize: totalMinified,
    savings: parseFloat(totalSavings),
  };
  
  fs.writeFileSync(
    path.join(BUILD_DIR, 'build-info.json'),
    JSON.stringify(buildInfo, null, 2)
  );
}

// Run build
build().catch((error) => {
  console.error('❌ Build failed:', error);
  process.exit(1);
});

