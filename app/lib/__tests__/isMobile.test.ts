import { isMobile } from '../isMobile';

// Mock navigator globally
const mockNavigator = {
  userAgent: '',
};

Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  configurable: true,
  writable: true,
});

describe('isMobile', () => {
  beforeEach(() => {
    // Reset navigator userAgent before each test
    mockNavigator.userAgent = '';
  });

  describe('Mobile User Agent strings', () => {
    const mobileUserAgents = [
      // Android
      'Mozilla/5.0 (Linux; Android 10; SM-G973F) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.120 Mobile Safari/537.36',
      // iPhone
      'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      // BlackBerry
      'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.1.0.346 Mobile Safari/534.11+',
      // Windows Phone
      'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)',
      // Opera Mobile
      'Opera/9.80 (Android 2.3.3; Linux; Opera Mobi/ADR-1111101157; U; es-ES) Presto/2.9.201 Version/11.50',
    ];

    test.each(mobileUserAgents)('should detect a mobile device for UA: %s', (ua) => {
      const result = isMobile({ ua });
      expect(result).toBe(true);
    });
  });

  describe('Desktop User Agent strings', () => {
    const desktopUserAgents = [
      // Chrome Desktop
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      // Firefox Desktop
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
      // Safari Desktop
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15',
      // Edge Desktop
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36 Edg/91.0.864.59',
      // iPad (treated as desktop by this regex)
      'Mozilla/5.0 (iPad; CPU OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
    ];

    test.each(desktopUserAgents)('should detect a desktop device for UA: %s', (ua) => {
      const result = isMobile({ ua });
      expect(result).toBe(false);
    });
  });

  describe('Function parameters', () => {
    test('uses navigator.userAgent when ua is not provided', () => {
      const testUserAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      mockNavigator.userAgent = testUserAgent;

      const result = isMobile({});
      expect(result).toBe(true);
    });

    test('uses ua from req.headers when available', () => {
      const testUserAgent =
        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1';
      const mockReq = {
        headers: {
          'user-agent': testUserAgent,
        },
      };

      const result = isMobile({ req: mockReq });
      expect(result).toBe(true);
    });

    test('returns false for undefined/null user agent', () => {
      mockNavigator.userAgent = '';

      const result = isMobile({});
      expect(result).toBe(false);
    });

    test('returns false for empty string user agent', () => {
      const result = isMobile({ ua: '' });
      expect(result).toBe(false);
    });

    test('returns false for non-string user agent', () => {
      const result = isMobile({ ua: 123 as any });
      expect(result).toBe(false);
    });

    test('works without parameters', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

      const result = isMobile({});
      expect(result).toBe(false);
    });
  });

  describe('Parameter precedence', () => {
    test('ua parameter takes precedence over navigator.userAgent', () => {
      // Set mobile UA in navigator
      mockNavigator.userAgent = 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)';

      // Pass desktop UA in parameters
      const result = isMobile({
        ua: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      });

      expect(result).toBe(false);
    });

    test('req.headers user-agent is used when ua is not provided', () => {
      mockNavigator.userAgent = '';

      const mockReq = {
        headers: {
          'user-agent':
            'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
        },
      };

      const result = isMobile({ req: mockReq });
      expect(result).toBe(true);
    });
  });
});
