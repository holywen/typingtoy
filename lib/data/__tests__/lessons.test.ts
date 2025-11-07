import { lessonsData } from '../lessons';

describe('lessonsData', () => {
  it('should export lessons data array', () => {
    expect(Array.isArray(lessonsData)).toBe(true);
    expect(lessonsData.length).toBeGreaterThan(0);
  });

  it('each lesson should have required properties', () => {
    lessonsData.forEach(lesson => {
      expect(lesson).toHaveProperty('lessonNumber');
      expect(lesson).toHaveProperty('title');
      expect(lesson).toHaveProperty('difficulty');
      expect(lesson).toHaveProperty('exercises');
      expect(lesson).toHaveProperty('keyboardLayout');
      expect(lesson).toHaveProperty('language');
      expect(lesson).toHaveProperty('focusKeys');
      expect(lesson).toHaveProperty('estimatedTime');
    });
  });

  it('lesson numbers should be sequential', () => {
    lessonsData.forEach((lesson, index) => {
      expect(lesson.lessonNumber).toBe(index + 1);
    });
  });

  it('each lesson should have exercises', () => {
    lessonsData.forEach(lesson => {
      expect(Array.isArray(lesson.exercises)).toBe(true);
      expect(lesson.exercises.length).toBeGreaterThan(0);
    });
  });

  it('each exercise should have required properties', () => {
    lessonsData.forEach(lesson => {
      lesson.exercises.forEach(exercise => {
        expect(exercise).toHaveProperty('id');
        expect(exercise).toHaveProperty('title');
        expect(exercise).toHaveProperty('content');
        expect(exercise).toHaveProperty('type');
      });
    });
  });

  it('exercise IDs should be unique within a lesson', () => {
    lessonsData.forEach(lesson => {
      const ids = lesson.exercises.map(e => e.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  it('focusKeys should be an array', () => {
    lessonsData.forEach(lesson => {
      expect(Array.isArray(lesson.focusKeys)).toBe(true);
      // focusKeys can be empty for some lessons
    });
  });

  it('estimatedTime should be a positive number', () => {
    lessonsData.forEach(lesson => {
      expect(typeof lesson.estimatedTime).toBe('number');
      expect(lesson.estimatedTime).toBeGreaterThan(0);
    });
  });

  it('difficulty should be valid', () => {
    const validDifficulties = ['beginner', 'intermediate', 'advanced'];
    lessonsData.forEach(lesson => {
      expect(validDifficulties).toContain(lesson.difficulty);
    });
  });

  it('keyboard layout should be specified', () => {
    lessonsData.forEach(lesson => {
      expect(typeof lesson.keyboardLayout).toBe('string');
      expect(lesson.keyboardLayout.length).toBeGreaterThan(0);
    });
  });

  it('language should be specified', () => {
    lessonsData.forEach(lesson => {
      expect(typeof lesson.language).toBe('string');
      expect(lesson.language.length).toBeGreaterThan(0);
    });
  });
});
