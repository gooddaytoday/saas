// Mock window.gtag globally
const mockGtag = jest.fn();
(global as any).gtag = mockGtag;

// Mock environment variable
const mockMeasurementId = 'GA-TEST-ID';
process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID = mockMeasurementId;

import { pageview, event } from '../gtag';

describe('gtag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('pageview', () => {
    test('calls gtag with config command and page_location for given url', () => {
      // Arrange
      const testUrl = '/test-page';

      // Act
      pageview(testUrl);

      // Assert
      expect(mockGtag).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledWith('config', mockMeasurementId, {
        page_location: testUrl,
      });
    });

    test('handles root path url correctly', () => {
      // Arrange
      const rootUrl = '/';

      // Act
      pageview(rootUrl);

      // Assert
      expect(mockGtag).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledWith('config', mockMeasurementId, {
        page_location: rootUrl,
      });
    });

    test('handles full url with domain correctly', () => {
      // Arrange
      const fullUrl = 'https://example.com/test-page';

      // Act
      pageview(fullUrl);

      // Assert
      expect(mockGtag).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledWith('config', mockMeasurementId, {
        page_location: fullUrl,
      });
    });

    test('handles url with query parameters correctly', () => {
      // Arrange
      const urlWithQuery = '/test-page?param1=value1&param2=value2';

      // Act
      pageview(urlWithQuery);

      // Assert
      expect(mockGtag).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledWith('config', mockMeasurementId, {
        page_location: urlWithQuery,
      });
    });

    test('handles empty string url correctly', () => {
      // Arrange
      const emptyUrl = '';

      // Act
      pageview(emptyUrl);

      // Assert
      expect(mockGtag).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledWith('config', mockMeasurementId, {
        page_location: emptyUrl,
      });
    });
  });

  describe('event', () => {
    test('calls gtag with event command and all parameters', () => {
      // Arrange
      const eventParams = {
        action: 'click',
        category: 'button',
        label: 'submit-button',
      };

      // Act
      event(eventParams);

      // Assert
      expect(mockGtag).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledWith('event', eventParams.action, {
        event_category: eventParams.category,
        event_label: eventParams.label,
      });
    });

    test('handles minimal event parameters (only action)', () => {
      // Arrange
      const eventParams = {
        action: 'page_view',
        category: undefined,
        label: undefined,
      };

      // Act
      event(eventParams);

      // Assert
      expect(mockGtag).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledWith('event', 'page_view', {
        event_category: undefined,
        event_label: undefined,
      });
    });

    test('handles event with empty strings', () => {
      // Arrange
      const eventParams = {
        action: '',
        category: '',
        label: '',
      };

      // Act
      event(eventParams);

      // Assert
      expect(mockGtag).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledWith('event', '', {
        event_category: '',
        event_label: '',
      });
    });

    test('handles event with special characters', () => {
      // Arrange
      const eventParams = {
        action: 'user_action_123',
        category: 'navigation-menu',
        label: 'home-link',
      };

      // Act
      event(eventParams);

      // Assert
      expect(mockGtag).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledWith('event', 'user_action_123', {
        event_category: 'navigation-menu',
        event_label: 'home-link',
      });
    });

    test('handles event with numeric values', () => {
      // Arrange
      const eventParams = {
        action: 'scroll',
        category: 'engagement',
        label: '50%',
      };

      // Act
      event(eventParams);

      // Assert
      expect(mockGtag).toHaveBeenCalledTimes(1);
      expect(mockGtag).toHaveBeenCalledWith('event', 'scroll', {
        event_category: 'engagement',
        event_label: '50%',
      });
    });
  });
});
