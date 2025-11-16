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
      // iPod
      'Mozilla/5.0 (iPod; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
      // BlackBerry
      'Mozilla/5.0 (BlackBerry; U; BlackBerry 9900; en) AppleWebKit/534.11+ (KHTML, like Gecko) Version/7.1.0.346 Mobile Safari/534.11+',
      // Windows Phone
      'Mozilla/5.0 (compatible; MSIE 10.0; Windows Phone 8.0; Trident/6.0; IEMobile/10.0; ARM; Touch)',
      // Opera Mobile
      'Opera/9.80 (Android 2.3.3; Linux; Opera Mobi/ADR-1111101157; U; es-ES) Presto/2.9.201 Version/11.50',
      // Additional patterns from regex
      // bb\d+ (BlackBerry with number)
      'BlackBerry9900/5.0.0.0',
      // meego
      'Mozilla/5.0 (MeeGo; NokiaN950-00/00) AppleWebKit/534.13 (KHTML, like Gecko) NokiaBrowser/8.5.0 Mobile Safari/534.13',
      // avantgo
      'Mozilla/5.0 (PDA; SL-C750/1.0,Embedix/Qtopia/1.3.0) NetFront/3.0',
      // bada
      'Mozilla/5.0 (SAMSUNG; S8000; U; Bada/1.0; en-us) AppleWebKit/533.1 (KHTML, like Gecko) Dolfin/2.0 Mobile WQVGA SMM-MMS/1.2.0 OPN-B',
      // blazer
      'Mozilla/5.0 (PalmOS; U; PalmOS Treo; en) AppleWebKit/125.1 (KHTML, like Gecko) HandWeb/1.0',
      // compal
      'Mozilla/5.0 (compatible; MSIE 6.0; Windows CE; IEMobile 6.12; PalmOS) Compal P160',
      // elaine
      'Elaine/3.0',
      // fennec
      'Mozilla/5.0 (X11; U; Linux armv7l; en-GB; rv:1.9.2a1pre) Gecko/20090322 Fennec/1.0b2pre',
      // hiptop
      'Mozilla/5.0 (compatible; AvantGo 3.2; hiptop)',
      // iris
      'Mozilla/5.0 (compatible; AvantGo 3.2; iris)',
      // kindle
      'Mozilla/5.0 (X11; U; Linux armv7l; en-GB; rv:1.9.2a1pre) Gecko/20090322 Fennec/1.0b2pre',
      // lge
      'Mozilla/5.0 (Linux; U; Android 2.2.1; en-us; LG-GW620 Build/FRG83) AppleWebKit/533.1 (KHTML, like Gecko) Version/4.0 Mobile Safari/533.1',
      // maemo
      'Mozilla/5.0 (X11; U; Linux armv7l; en-GB; rv:1.9.2a1pre) Gecko/20090322 Fennec/1.0b2pre',
      // midp
      'MIDP-2.0',
      // mmp
      'MMP/2.0',
      // netfront
      'Mozilla/5.0 (PDA; SL-C750/1.0,Embedix/Qtopia/1.3.0) NetFront/3.0',
      // palm
      'Mozilla/5.0 (PDA; SL-C750/1.0,Embedix/Qtopia/1.3.0) NetFront/3.0',
      // pixi
      'Mozilla/5.0 (webOS/1.4.0; U; en-US) AppleWebKit/532.2 (KHTML, like Gecko) Version/1.0 Safari/532.2 Pixi/1.1',
      // plucker
      'Plucker/Py-1.4 (compatible; Windows CE)',
      // pocket
      'Mozilla/5.0 (compatible; AvantGo 3.2; pocket)',
      // psp
      'PSP (PlayStation Portable); 2.00',
      // series40/60
      'Nokia3110/2.0 (05.01) Profile/MIDP-2.0 Configuration/CLDC-1.1',
      // symbian
      'Mozilla/5.0 (SymbianOS/9.2; U; Series60/3.1 NokiaN95/10.0.018; Profile/MIDP-2.0 Configuration/CLDC-1.1) AppleWebKit/413 (KHTML, like Gecko) Safari/413',
      // treo
      'Mozilla/5.0 (PDA; SL-C750/1.0,Embedix/Qtopia/1.3.0) NetFront/3.0',
      // vodafone
      'Vodafone/1.0/LG-G710/V10c Browser/Openwave/1.0 Profile/MIDP-2.0 Configuration/CLDC-1.1',
      // wap
      'Mozilla/4.0 (compatible; MSIE 6.0; Windows CE; IEMobile 6.12; PalmOS)',
      // windows ce/phone
      'Mozilla/4.0 (compatible; MSIE 6.0; Windows CE; IEMobile 6.12)',
      // xda
      'Mozilla/4.0 (compatible; MSIE 6.0; Windows CE; IEMobile 6.12; PalmOS) Xda Orbit',
      // xiino
      'Xiino/1.0',
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

    test('initializes opts to empty object when opts is undefined', () => {
      mockNavigator.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36';

      // Call without any parameters - opts will be undefined
      const result = (isMobile as any)();
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
