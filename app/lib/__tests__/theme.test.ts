import { themeDark, themeLight } from '../theme';

describe('theme', () => {
  describe('themeDark', () => {
    test('is exported and defined', () => {
      expect(themeDark).toBeDefined();
      expect(themeDark).not.toBeNull();
    });

    test('has correct palette mode', () => {
      expect(themeDark.palette.mode).toBe('dark');
    });

    test('has correct primary color', () => {
      expect(themeDark.palette.primary.main).toBe('#238636');
    });

    test('has correct secondary color', () => {
      expect(themeDark.palette.secondary.main).toBe('#b62324');
    });

    test('has correct dark background color', () => {
      expect(themeDark.palette.background.default).toBe('#0d1117');
    });

    test('has correct dark text color', () => {
      expect(themeDark.palette.text.primary).toBe('#c9d1d9');
    });

    test('has correct typography fontFamily', () => {
      expect(themeDark.typography.fontFamily).toBe("'IBM Plex Mono', monospace");
    });

    test('has correct button textTransform', () => {
      expect(themeDark.typography.button.textTransform).toBe('none');
    });
  });

  describe('themeLight', () => {
    test('is exported and defined', () => {
      expect(themeLight).toBeDefined();
      expect(themeLight).not.toBeNull();
    });

    test('has correct palette mode', () => {
      expect(themeLight.palette.mode).toBe('light');
    });

    test('has correct primary color', () => {
      expect(themeLight.palette.primary.main).toBe('#238636');
    });

    test('has correct secondary color', () => {
      expect(themeLight.palette.secondary.main).toBe('#b62324');
    });

    test('has correct light background color', () => {
      expect(themeLight.palette.background.default).toBe('#fff');
    });

    test('has correct light text color', () => {
      expect(themeLight.palette.text.primary).toBe('#222');
    });

    test('has correct typography fontFamily', () => {
      expect(themeLight.typography.fontFamily).toBe("'IBM Plex Mono', monospace");
    });

    test('has correct button textTransform', () => {
      expect(themeLight.typography.button.textTransform).toBe('none');
    });
  });

  describe('Theme consistency', () => {
    test('both themes have same primary color', () => {
      expect(themeDark.palette.primary.main).toBe(themeLight.palette.primary.main);
    });

    test('both themes have same secondary color', () => {
      expect(themeDark.palette.secondary.main).toBe(themeLight.palette.secondary.main);
    });

    test('both themes have same fontFamily', () => {
      expect(themeDark.typography.fontFamily).toBe(themeLight.typography.fontFamily);
    });

    test('both themes have same button textTransform', () => {
      expect(themeDark.typography.button.textTransform).toBe(themeLight.typography.button.textTransform);
    });
  });

  describe('Material-UI theme structure', () => {
    test('themeDark has required MUI theme properties', () => {
      expect(themeDark).toHaveProperty('palette');
      expect(themeDark).toHaveProperty('typography');
      expect(themeDark).toHaveProperty('mixins');
      expect(themeDark).toHaveProperty('shadows');
      expect(themeDark).toHaveProperty('transitions');
      expect(themeDark).toHaveProperty('zIndex');
      expect(themeDark).toHaveProperty('shape');
      expect(themeDark).toHaveProperty('breakpoints');
      expect(themeDark).toHaveProperty('spacing');
      expect(themeDark).toHaveProperty('components');
    });

    test('themeLight has required MUI theme properties', () => {
      expect(themeLight).toHaveProperty('palette');
      expect(themeLight).toHaveProperty('typography');
      expect(themeLight).toHaveProperty('mixins');
      expect(themeLight).toHaveProperty('shadows');
      expect(themeLight).toHaveProperty('transitions');
      expect(themeLight).toHaveProperty('zIndex');
      expect(themeLight).toHaveProperty('shape');
      expect(themeLight).toHaveProperty('breakpoints');
      expect(themeLight).toHaveProperty('spacing');
      expect(themeLight).toHaveProperty('components');
    });
  });
});
