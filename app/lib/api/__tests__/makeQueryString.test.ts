import { makeQueryString } from '../makeQueryString';

describe('makeQueryString', () => {
  describe('basic functionality', () => {
    test('converts simple object to query string', () => {
      // Arrange
      const params = { key: 'value', name: 'test' };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toBe('key=value&name=test');
    });

    test('returns empty string for empty object', () => {
      // Arrange
      const params = {};

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toBe('');
    });

    test('encodes special characters in values', () => {
      // Arrange
      const params = { email: 'test@example.com', name: 'John Doe' };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toContain('email=test%40example.com');
      expect(result).toContain('name=John%20Doe');
    });

    test('encodes special characters in keys', () => {
      // Arrange
      const params = { 'my-key': 'value' };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toBe('my-key=value');
    });
  });

  describe('filtering falsy values', () => {
    test('filters out undefined values', () => {
      // Arrange
      const params = { key: 'value', empty: undefined };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toBe('key=value');
      expect(result).not.toContain('empty');
    });

    test('filters out null values', () => {
      // Arrange
      const params = { key: 'value', empty: null };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toBe('key=value');
      expect(result).not.toContain('empty');
    });

    test('filters out empty string values', () => {
      // Arrange
      const params = { key: 'value', empty: '' };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toBe('key=value');
      expect(result).not.toContain('empty');
    });

    test('filters out false values', () => {
      // Arrange
      const params = { key: 'value', flag: false };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toBe('key=value');
      expect(result).not.toContain('flag');
    });

    test('filters out zero values', () => {
      // Arrange
      const params = { key: 'value', count: 0 };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toBe('key=value');
      expect(result).not.toContain('count');
    });

    test('includes true values', () => {
      // Arrange
      const params = { key: 'value', flag: true };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toContain('flag=true');
    });

    test('includes numeric values (non-zero)', () => {
      // Arrange
      const params = { key: 'value', count: 5 };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toContain('count=5');
    });
  });

  describe('complex scenarios', () => {
    test('handles multiple parameters with mixed types', () => {
      // Arrange
      const params = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
        active: true,
        deleted: false,
      };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toContain('name=John%20Doe');
      expect(result).toContain('age=30');
      expect(result).toContain('email=john%40example.com');
      expect(result).toContain('active=true');
      expect(result).not.toContain('deleted');
    });

    test('handles URL-unsafe characters', () => {
      // Arrange
      const params = {
        url: 'https://example.com/path?id=1',
        text: 'Hello & Goodbye',
      };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toContain('url=https%3A%2F%2Fexample.com%2Fpath%3Fid%3D1');
      expect(result).toContain('text=Hello%20%26%20Goodbye');
    });

    test('handles Unicode characters', () => {
      // Arrange
      const params = { name: 'Иван', city: '北京' };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toContain('name');
      expect(result).toContain('city');
      expect(decodeURIComponent(result)).toContain('Иван');
      expect(decodeURIComponent(result)).toContain('北京');
    });

    test('filters out multiple falsy values', () => {
      // Arrange
      const params = {
        key: 'value',
        empty1: undefined,
        empty2: null,
        empty3: '',
        empty4: false,
        empty5: 0,
      };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toBe('key=value');
    });

    test('preserves order of parameters', () => {
      // Arrange
      const params = { first: '1', second: '2', third: '3' };

      // Act
      const result = makeQueryString(params);

      // Assert
      // Note: Object.keys order is guaranteed in modern JS for string keys
      expect(result.indexOf('first')).toBeLessThan(result.indexOf('second'));
      expect(result.indexOf('second')).toBeLessThan(result.indexOf('third'));
    });
  });

  describe('edge cases', () => {
    test('handles only falsy values', () => {
      // Arrange
      const params = { empty1: undefined, empty2: null, empty3: '' };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toBe('');
    });

    test('handles single parameter', () => {
      // Arrange
      const params = { key: 'value' };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toBe('key=value');
    });

    test('handles parameter with numeric string value', () => {
      // Arrange
      const params = { id: '123', count: '0' };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toContain('id=123');
      expect(result).toContain('count=0');
    });

    test('handles array-like values (converts to string)', () => {
      // Arrange
      const params = { items: ['a', 'b', 'c'] as any };

      // Act
      const result = makeQueryString(params);

      // Assert
      expect(result).toContain('items=a%2Cb%2Cc');
    });
  });
});
