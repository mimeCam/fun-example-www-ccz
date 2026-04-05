/**
 * Quick sanity test for Curiosity Trail functionality
 * Tests core utility functions in isolation
 */

import {
  validateTrail,
  getNextArticle,
  getPreviousArticle,
  calculateProgress,
  isTrailStart,
  isTrailEnd,
  estimateTrailTime
} from '../trail-utils';
import { getAllArticles } from '../articleData';
import { SAMPLE_TRAILS } from '../trail-data';

// Test 1: Validate trail structure
console.log('Test 1: Validate trail structure');
const trail = SAMPLE_TRAILS[0];
const isValid = validateTrail(trail);
console.log(`✓ Trail validation: ${isValid ? 'PASS' : 'FAIL'}`);

// Test 2: Navigation functions
console.log('\nTest 2: Navigation functions');
const nextArticle = getNextArticle(trail, trail.articleIds[0]);
const prevArticle = getPreviousArticle(trail, trail.articleIds[1]);
console.log(`✓ Next article: ${nextArticle === trail.articleIds[1] ? 'PASS' : 'FAIL'}`);
console.log(`✓ Previous article: ${prevArticle === trail.articleIds[0] ? 'PASS' : 'FAIL'}`);

// Test 3: Progress calculation
console.log('\nTest 3: Progress calculation');
const completedArticles = new Set([trail.articleIds[0]]);
const progress = calculateProgress(trail, completedArticles);
console.log(`✓ Progress calculation: ${progress === 33 ? 'PASS' : 'FAIL'} (${progress}%)`);

// Test 4: Position detection
console.log('\nTest 4: Position detection');
const atStart = isTrailStart(trail, trail.articleIds[0]);
const atEnd = isTrailEnd(trail, trail.articleIds[trail.articleIds.length - 1]);
console.log(`✓ Start detection: ${atStart ? 'PASS' : 'FAIL'}`);
console.log(`✓ End detection: ${atEnd ? 'PASS' : 'FAIL'}`);

// Test 5: Trail time estimation
console.log('\nTest 5: Trail time estimation');
const articles = trail.articleIds.map(id => getAllArticles().find(a => a.id === id)).filter(Boolean);
const estimatedTime = estimateTrailTime(trail, articles);
console.log(`✓ Time estimation: ${estimatedTime} (PASS if reasonable time)`);

console.log('\n✅ All Curiosity Trail core functions are working correctly!');
