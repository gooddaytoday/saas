import {
  styleBigAvatar,
  styleRaisedButton,
  styleToolbar,
  styleTextField,
  styleForm,
} from '../sharedStyles';

describe('sharedStyles', () => {
  describe('styleBigAvatar', () => {
    test('is an object with correct properties', () => {
      expect(styleBigAvatar).toBeInstanceOf(Object);
      expect(styleBigAvatar).toHaveProperty('width');
      expect(styleBigAvatar).toHaveProperty('height');
      expect(styleBigAvatar).toHaveProperty('margin');
    });

    test('has correct width value', () => {
      expect(styleBigAvatar.width).toBe('80px');
    });

    test('has correct height value', () => {
      expect(styleBigAvatar.height).toBe('80px');
    });

    test('has correct margin value', () => {
      expect(styleBigAvatar.margin).toBe('0px auto 15px');
    });
  });

  describe('styleRaisedButton', () => {
    test('is an object with correct properties', () => {
      expect(styleRaisedButton).toBeInstanceOf(Object);
      expect(styleRaisedButton).toHaveProperty('margin');
    });

    test('has correct margin value', () => {
      expect(styleRaisedButton.margin).toBe('15px');
    });
  });

  describe('styleToolbar', () => {
    test('is an object with correct properties', () => {
      expect(styleToolbar).toBeInstanceOf(Object);
      expect(styleToolbar).toHaveProperty('background');
      expect(styleToolbar).toHaveProperty('height');
      expect(styleToolbar).toHaveProperty('paddingRight');
    });

    test('has correct background value', () => {
      expect(styleToolbar.background).toBe('#FFF');
    });

    test('has correct height value', () => {
      expect(styleToolbar.height).toBe('64px');
    });

    test('has correct paddingRight value', () => {
      expect(styleToolbar.paddingRight).toBe('20px');
    });
  });

  describe('styleTextField', () => {
    test('is an object with correct properties', () => {
      expect(styleTextField).toBeInstanceOf(Object);
      expect(styleTextField).toHaveProperty('color');
      expect(styleTextField).toHaveProperty('fontWeight');
    });

    test('has correct color value', () => {
      expect(styleTextField.color).toBe('#222');
    });

    test('has correct fontWeight value', () => {
      expect(styleTextField.fontWeight).toBe('300');
    });
  });

  describe('styleForm', () => {
    test('is an object with correct properties', () => {
      expect(styleForm).toBeInstanceOf(Object);
      expect(styleForm).toHaveProperty('margin');
      expect(styleForm).toHaveProperty('width');
    });

    test('has correct margin value', () => {
      expect(styleForm.margin).toBe('7% auto');
    });

    test('has correct width value', () => {
      expect(styleForm.width).toBe('360px');
    });
  });

  describe('Export verification', () => {
    test('all style objects are exported', () => {
      expect(styleBigAvatar).toBeDefined();
      expect(styleRaisedButton).toBeDefined();
      expect(styleToolbar).toBeDefined();
      expect(styleTextField).toBeDefined();
      expect(styleForm).toBeDefined();
    });

    test('all exports are objects', () => {
      expect(typeof styleBigAvatar).toBe('object');
      expect(typeof styleRaisedButton).toBe('object');
      expect(typeof styleToolbar).toBe('object');
      expect(typeof styleTextField).toBe('object');
      expect(typeof styleForm).toBe('object');
    });

    test('exports are not null or undefined', () => {
      expect(styleBigAvatar).not.toBeNull();
      expect(styleRaisedButton).not.toBeNull();
      expect(styleToolbar).not.toBeNull();
      expect(styleTextField).not.toBeNull();
      expect(styleForm).not.toBeNull();
    });
  });

  describe('Style object structure', () => {
    test('style objects are plain JavaScript objects', () => {
      expect(typeof styleBigAvatar).toBe('object');
      expect(Object.getPrototypeOf(styleBigAvatar)).toBe(Object.prototype);
    });

    test('style objects can be spread/cloned', () => {
      const cloned = { ...styleBigAvatar };
      expect(cloned).toEqual(styleBigAvatar);
      expect(cloned).not.toBe(styleBigAvatar); // Different reference
    });
  });
});
