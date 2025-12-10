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

// Try to load cssnano for CSS minification
let cssnano;
try {
  cssnano = require('cssnano');
} catch (error) {
  console.warn('⚠️  cssnano not found. Install it with: npm install --save-dev cssnano postcss');
  console.warn('   Building CSS without minification...\n');
  cssnano = null;
}

const SCRIPTS_DIR = path.join(__dirname, 'scripts');
const BUILD_DIR = path.join(__dirname, 'dist');
const ANALYZE = process.argv.includes('--analyze');
const BUNDLE = process.argv.includes('--bundle') || !process.argv.includes('--no-bundle');

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
 * Minify a CSS file
 */
async function minifyCSS(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const relativePath = path.relative(path.join(__dirname, 'styles'), filePath);
  const outputPath = path.join(BUILD_DIR, 'styles', relativePath);
  
  // Ensure output directory exists
  const outputDir = path.dirname(outputPath);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  try {
    // If cssnano is not available, just copy the file
    if (!cssnano) {
      fs.writeFileSync(outputPath, content);
      return {
        success: true,
        file: relativePath,
        originalSize: content.length,
        minifiedSize: content.length,
        savings: 0,
      };
    }
    
    // Use PostCSS with cssnano for minification
    let postcss;
    try {
      postcss = require('postcss');
    } catch (error) {
      // PostCSS not available, just copy file
      fs.writeFileSync(outputPath, content);
      return {
        success: true,
        file: relativePath,
        originalSize: content.length,
        minifiedSize: content.length,
        savings: 0,
      };
    }
    
    const result = await postcss([cssnano({ preset: 'default' })]).process(content, {
      from: filePath,
      to: outputPath,
    });
    
    fs.writeFileSync(outputPath, result.css);
    
    const originalSize = content.length;
    const minifiedSize = result.css.length;
    const savings = ((1 - minifiedSize / originalSize) * 100).toFixed(2);
    
    return {
      success: true,
      file: relativePath,
      originalSize,
      minifiedSize,
      savings: parseFloat(savings),
    };
  } catch (error) {
    console.error(`Error minifying CSS ${relativePath}:`, error);
    // Copy original file if minification fails
    fs.writeFileSync(outputPath, content);
    return {
      success: false,
      file: relativePath,
      originalSize: content.length,
      minifiedSize: content.length,
      savings: 0,
    };
  }
}

/**
 * Copy non-JS files to build directory
 */
async function copyNonJSFiles() {
  const filesToCopy = [
    { src: 'index.html', dest: 'index.html' },
    { src: 'data/words.json', dest: 'data/words.json' },
  ];
  
  // Process styles directory with minification
  const stylesDir = path.join(__dirname, 'styles');
  const cssResults = [];
  let cssTotalOriginal = 0;
  let cssTotalMinified = 0;
  
  if (fs.existsSync(stylesDir)) {
    const stylesBuildDir = path.join(BUILD_DIR, 'styles');
    if (!fs.existsSync(stylesBuildDir)) {
      fs.mkdirSync(stylesBuildDir, { recursive: true });
    }
    
    const styleFiles = fs.readdirSync(stylesDir).filter(file => file.endsWith('.css'));
    console.log(`\nProcessing ${styleFiles.length} CSS files...\n`);
    
    for (const file of styleFiles) {
      const src = path.join(stylesDir, file);
      const result = await minifyCSS(src);
      cssResults.push(result);
      
      if (result.success) {
        cssTotalOriginal += result.originalSize;
        cssTotalMinified += result.minifiedSize;
        
        if (ANALYZE) {
          console.log(`CSS: ${result.file}:`);
          console.log(`  Original: ${(result.originalSize / 1024).toFixed(2)} KB`);
          console.log(`  Minified: ${(result.minifiedSize / 1024).toFixed(2)} KB`);
          console.log(`  Savings: ${result.savings}%\n`);
        }
      }
    }
  }
  
  // Copy other files
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
  
  return { cssResults, cssTotalOriginal, cssTotalMinified };
}

/**
 * Bundle critical JavaScript files together
 */
async function bundleCriticalScripts() {
  if (!BUNDLE) {
    console.log('⚠️  Bundling disabled (use --bundle to enable)\n');
    return null;
  }

  // Define critical scripts in load order
  const criticalScripts = [
    'scripts/utils.js',
    'scripts/dom-utils.js',
    'scripts/modal-manager.js',
    'scripts/error-middleware.js',
    'scripts/offline-manager.js',
    'scripts/progress-manager.js',
    'scripts/preferences-manager.js',
    'scripts/data-validator.js',
    'scripts/accessibility-manager.js',
    'scripts/keyboard-accessibility.js',
    'scripts/accessibility-enhancements.js',
    'scripts/audio-manager.js',
    'scripts/touch-accessibility.js',
    'scripts/feedback-manager.js',
    'scripts/theme-manager.js',
    'scripts/game.js',
    'scripts/ui.js',
  ];

  const bundlePath = path.join(BUILD_DIR, 'scripts', 'bundle.js');
  const bundleDir = path.dirname(bundlePath);
  if (!fs.existsSync(bundleDir)) {
    fs.mkdirSync(bundleDir, { recursive: true });
  }

  let bundleContent = '// ========================================\n';
  bundleContent += '// HANGMAN GAME - BUNDLED CRITICAL SCRIPTS\n';
  bundleContent += '// ========================================\n\n';

  let totalSize = 0;
  const bundledFiles = [];

  for (const script of criticalScripts) {
    const scriptPath = path.join(__dirname, script);
    if (fs.existsSync(scriptPath)) {
      const content = fs.readFileSync(scriptPath, 'utf8');
      bundleContent += `\n// ========================================\n`;
      bundleContent += `// ${script}\n`;
      bundleContent += `// ========================================\n\n`;
      bundleContent += content;
      bundleContent += '\n\n';
      totalSize += content.length;
      bundledFiles.push(script);
    }
  }

  // Minify the bundle
  let minifiedBundle = bundleContent;
  let bundleSavings = 0;
  
  if (minify) {
    try {
      const result = await minify(bundleContent, minifyOptions);
      if (!result.error) {
        minifiedBundle = result.code;
        bundleSavings = ((1 - minifiedBundle.length / bundleContent.length) * 100).toFixed(2);
      }
    } catch (error) {
      console.warn('⚠️  Failed to minify bundle, using unminified version');
    }
  }

  fs.writeFileSync(bundlePath, minifiedBundle);

  return {
    path: bundlePath,
    originalSize: bundleContent.length,
    minifiedSize: minifiedBundle.length,
    savings: parseFloat(bundleSavings),
    files: bundledFiles.length,
  };
}

/**
 * Main build function
 */
async function build() {
  console.log('🔨 Starting build process...\n');
  
  // Bundle critical scripts if enabled
  let bundleInfo = null;
  if (BUNDLE) {
    console.log('📦 Bundling critical scripts...\n');
    bundleInfo = await bundleCriticalScripts();
    if (bundleInfo) {
      console.log(`✅ Bundle created: ${(bundleInfo.minifiedSize / 1024).toFixed(2)} KB`);
      console.log(`   Files bundled: ${bundleInfo.files}`);
      console.log(`   Savings: ${bundleInfo.savings}%\n`);
    }
  }
  
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
  
  // Copy and minify non-JS files (including CSS)
  const { cssResults, cssTotalOriginal, cssTotalMinified } = await copyNonJSFiles();
  
  // Print summary
  const jsTotalSavings = totalOriginal > 0 ? ((1 - totalMinified / totalOriginal) * 100).toFixed(2) : 0;
  const cssTotalSavings = cssTotalOriginal > 0 ? ((1 - cssTotalMinified / cssTotalOriginal) * 100).toFixed(2) : 0;
  const totalOriginalSize = totalOriginal + cssTotalOriginal;
  const totalMinifiedSize = totalMinified + cssTotalMinified;
  const overallSavings = totalOriginalSize > 0 ? ((1 - totalMinifiedSize / totalOriginalSize) * 100).toFixed(2) : 0;
  
  console.log('✅ Build complete!\n');
  console.log('Summary:');
  if (bundleInfo) {
    console.log(`  JavaScript Bundle:`);
    console.log(`    Files bundled: ${bundleInfo.files}`);
    console.log(`    Bundle size: ${(bundleInfo.minifiedSize / 1024).toFixed(2)} KB`);
    console.log(`    Savings: ${bundleInfo.savings}%`);
    console.log(`    Estimated HTTP requests saved: ${bundleInfo.files - 1}`);
  }
  console.log(`  JavaScript files: ${jsFiles.length}`);
  console.log(`    Original: ${(totalOriginal / 1024).toFixed(2)} KB`);
  console.log(`    Minified: ${(totalMinified / 1024).toFixed(2)} KB`);
  console.log(`    Savings: ${jsTotalSavings}%`);
  console.log(`  CSS files: ${cssResults.length}`);
  console.log(`    Original: ${(cssTotalOriginal / 1024).toFixed(2)} KB`);
  console.log(`    Minified: ${(cssTotalMinified / 1024).toFixed(2)} KB`);
  console.log(`    Savings: ${cssTotalSavings}%`);
  console.log(`  Overall:`);
  console.log(`    Total original: ${(totalOriginalSize / 1024).toFixed(2)} KB`);
  console.log(`    Total minified: ${(totalMinifiedSize / 1024).toFixed(2)} KB`);
  console.log(`    Overall savings: ${overallSavings}%`);
  console.log(`\n📦 Build output: ${BUILD_DIR}`);
  
  // Write build info
  const buildInfo = {
    timestamp: new Date().toISOString(),
    bundle: bundleInfo ? {
      files: bundleInfo.files,
      originalSize: bundleInfo.originalSize,
      minifiedSize: bundleInfo.minifiedSize,
      savings: bundleInfo.savings,
    } : null,
    javascript: {
      files: results.length,
      originalSize: totalOriginal,
      minifiedSize: totalMinified,
      savings: parseFloat(jsTotalSavings),
    },
    css: {
      files: cssResults.length,
      originalSize: cssTotalOriginal,
      minifiedSize: cssTotalMinified,
      savings: parseFloat(cssTotalSavings),
    },
    overall: {
      originalSize: totalOriginalSize,
      minifiedSize: totalMinifiedSize,
      savings: parseFloat(overallSavings),
    },
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

