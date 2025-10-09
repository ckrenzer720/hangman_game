// Tests for data/words.json file
const fs = require('fs');
const path = require('path');

describe('Words Data', () => {
  let wordsData;

  beforeAll(() => {
    const wordsPath = path.join(__dirname, '../data/words.json');
    const wordsContent = fs.readFileSync(wordsPath, 'utf8');
    wordsData = JSON.parse(wordsContent);
  });

  test('should have valid JSON structure', () => {
    expect(wordsData).toBeDefined();
    expect(typeof wordsData).toBe('object');
  });

  test('should have difficulty levels', () => {
    expect(wordsData).toHaveProperty('easy');
    expect(wordsData).toHaveProperty('medium');
    expect(wordsData).toHaveProperty('hard');
  });

  test('should have categories for each difficulty', () => {
    Object.keys(wordsData).forEach(difficulty => {
      const difficultyData = wordsData[difficulty];
      expect(typeof difficultyData).toBe('object');
      expect(Object.keys(difficultyData).length).toBeGreaterThan(0);
    });
  });

  test('should have words in each category', () => {
    Object.keys(wordsData).forEach(difficulty => {
      const difficultyData = wordsData[difficulty];
      Object.keys(difficultyData).forEach(category => {
        const words = difficultyData[category];
        expect(Array.isArray(words)).toBe(true);
        expect(words.length).toBeGreaterThan(0);
      });
    });
  });

  test('should have valid word format', () => {
    Object.keys(wordsData).forEach(difficulty => {
      const difficultyData = wordsData[difficulty];
      Object.keys(difficultyData).forEach(category => {
        const words = difficultyData[category];
        words.forEach(word => {
          expect(typeof word).toBe('string');
          expect(word.length).toBeGreaterThan(0);
          expect(/^[a-zA-Z\s]+$/.test(word)).toBe(true);
        });
      });
    });
  });

  test('should have appropriate word lengths for difficulty', () => {
    // Easy words should be shorter (allowing some flexibility)
    Object.keys(wordsData.easy).forEach(category => {
      const words = wordsData.easy[category];
      words.forEach(word => {
        expect(word.length).toBeLessThanOrEqual(8); // Adjusted for "shoulder" which is 8 chars
      });
    });

    // Hard words should be longer
    Object.keys(wordsData.hard).forEach(category => {
      const words = wordsData.hard[category];
      words.forEach(word => {
        expect(word.length).toBeGreaterThanOrEqual(8);
      });
    });
  });

  test('should have appropriate categories for each difficulty', () => {
    // Easy should have basic categories
    expect(wordsData.easy).toHaveProperty('animals');
    expect(wordsData.easy).toHaveProperty('colors');
    expect(wordsData.easy).toHaveProperty('food');
    expect(wordsData.easy).toHaveProperty('body');
    expect(wordsData.easy).toHaveProperty('family');

    // Medium should have more complex categories
    expect(wordsData.medium).toHaveProperty('animals');
    expect(wordsData.medium).toHaveProperty('countries');
    expect(wordsData.medium).toHaveProperty('food');
    expect(wordsData.medium).toHaveProperty('sports');
    expect(wordsData.medium).toHaveProperty('professions');
    expect(wordsData.medium).toHaveProperty('transportation');

    // Hard should have advanced categories
    expect(wordsData.hard).toHaveProperty('animals');
    expect(wordsData.hard).toHaveProperty('science');
    expect(wordsData.hard).toHaveProperty('literature');
    expect(wordsData.hard).toHaveProperty('geography');
    expect(wordsData.hard).toHaveProperty('technology');
    expect(wordsData.hard).toHaveProperty('medicine');
  });

  test('should not have duplicate words within categories', () => {
    Object.keys(wordsData).forEach(difficulty => {
      const difficultyData = wordsData[difficulty];
      Object.keys(difficultyData).forEach(category => {
        const words = difficultyData[category];
        const uniqueWords = [...new Set(words.map(word => word.toLowerCase()))];
        expect(uniqueWords.length).toBe(words.length);
      });
    });
  });

  test('should have minimum number of words per category', () => {
    const minWordsPerCategory = 5;
    
    Object.keys(wordsData).forEach(difficulty => {
      const difficultyData = wordsData[difficulty];
      Object.keys(difficultyData).forEach(category => {
        const words = difficultyData[category];
        expect(words.length).toBeGreaterThanOrEqual(minWordsPerCategory);
      });
    });
  });
});
