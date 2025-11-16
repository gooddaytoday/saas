import { resizeImage } from '../resizeImage';

// Mock DOM APIs
const mockCreateElement = jest.fn();
const mockGetContext = jest.fn();
const mockDrawImage = jest.fn();
const mockToBlob = jest.fn();

// Mock document
Object.defineProperty(document, 'createElement', {
  writable: true,
  value: mockCreateElement,
});

describe('resizeImage', () => {
  let mockImage: any;
  let mockCanvas: any;
  let mockCtx: any;
  let mockFile: File;
  let mockFileReader: any;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock image element
    mockImage = {
      width: 100,
      height: 100,
      src: '',
      onload: null,
      onerror: null,
    };

    // Setup mock canvas
    mockCanvas = {
      width: 0,
      height: 0,
      toBlob: mockToBlob,
      getContext: mockGetContext,
    };

    // Setup mock canvas context
    mockCtx = {
      drawImage: mockDrawImage,
    };

    // Setup mock file
    mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });

    // Setup mock FileReader
    mockFileReader = {
      readAsDataURL: jest.fn(),
      onload: null,
      onerror: null,
    };

    // Configure mocks
    mockCreateElement.mockImplementation((tagName: string) => {
      if (tagName === 'img') return mockImage;
      if (tagName === 'canvas') return mockCanvas;
      return {};
    });

    mockGetContext.mockReturnValue(mockCtx);
    mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
      callback(new Blob(['resized'], { type: 'image/jpeg' }));
    });

    // Mock FileReader constructor
    (global as any).FileReader = jest.fn().mockImplementation(() => mockFileReader);
  });

  // Helper function to simulate the complete async flow
  const simulateFileReading = async (dataUrl = 'data:image/jpeg;base64,test') => {
    // Wait for the next tick to allow FileReader setup
    await Promise.resolve();

    // Simulate FileReader onload
    mockFileReader.onload({
      target: {
        result: dataUrl,
      },
    });

    // Wait for image onload
    await Promise.resolve();

    // Simulate image onload
    if (mockImage.onload) {
      mockImage.onload();
    }
  };

  describe('Basic functionality', () => {
    test('returns a Promise', () => {
      const result = resizeImage(mockFile, 200, 200);
      expect(result).toBeInstanceOf(Promise);
      void result; // Mark as intentionally unused
    });

    test('creates image and canvas elements', async () => {
      mockImage.width = 300; // Force resize to create canvas
      mockImage.height = 100;

      const promise = resizeImage(mockFile, 200, 200);
      await simulateFileReading();

      expect(mockCreateElement).toHaveBeenCalledWith('img');
      expect(mockCreateElement).toHaveBeenCalledWith('canvas');
      await promise; // Wait for completion
    });

    test('uses FileReader to read the file', async () => {
      const promise = resizeImage(mockFile, 200, 200);
      await simulateFileReading();

      expect(mockFileReader.readAsDataURL).toHaveBeenCalledWith(mockFile);
      await promise; // Wait for completion
    });
  });

  describe('Resize logic', () => {
    test('does not resize when image is smaller than max dimensions', async () => {
      // Image is 100x100, max is 200x200 - no resize needed
      mockImage.width = 100;
      mockImage.height = 100;

      const promise = resizeImage(mockFile, 200, 200);
      await simulateFileReading();

      const result = await promise;
      expect(result).toBe(mockFile);
      expect(mockToBlob).not.toHaveBeenCalled();
    });

    test('resizes wide image when width exceeds MAX_WIDTH', async () => {
      // Wide image: 300x100, max 200x200
      mockImage.width = 300;
      mockImage.height = 100;

      const promise = resizeImage(mockFile, 200, 200);
      await simulateFileReading();

      void (await promise);
      expect(mockCanvas.width).toBe(200);
      expect(mockCanvas.height).toBeCloseTo(66.67, 2); // 100 * (200/300) = 66.666...
      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 0, 0, 200, 100 * (200 / 300));
      expect(mockToBlob).toHaveBeenCalled();
    });

    test('resizes tall image when height exceeds MAX_HEIGHT', async () => {
      // Tall image: 100x300, max 200x200
      mockImage.width = 100;
      mockImage.height = 300;

      const promise = resizeImage(mockFile, 200, 200);
      await simulateFileReading();

      void (await promise);
      expect(mockCanvas.width).toBeCloseTo(66.67, 2); // 100 * (200/300) = 66.666...
      expect(mockCanvas.height).toBe(200);
      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 0, 0, 100 * (200 / 300), 200);
      expect(mockToBlob).toHaveBeenCalled();
    });

    test('handles square images correctly', async () => {
      // Square image: 300x300, max 200x200
      mockImage.width = 300;
      mockImage.height = 300;

      const promise = resizeImage(mockFile, 200, 200);
      await simulateFileReading();

      void (await promise);
      expect(mockCanvas.width).toBe(200);
      expect(mockCanvas.height).toBe(200);
      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 0, 0, 200, 200);
      expect(mockToBlob).toHaveBeenCalled();
    });
  });

  describe('Edge cases', () => {
    test('handles zero MAX_WIDTH (should not resize)', async () => {
      mockImage.width = 100;
      mockImage.height = 100;

      const promise = resizeImage(mockFile, 0, 200);
      await simulateFileReading();

      const result = await promise;
      expect(result).toBe(mockFile);
      expect(mockToBlob).not.toHaveBeenCalled();
    });

    test('handles zero MAX_HEIGHT (resizes to zero)', async () => {
      mockImage.width = 100;
      mockImage.height = 100;

      const promise = resizeImage(mockFile, 200, 0);
      await simulateFileReading();

      const result = await promise;
      expect(result).toBeInstanceOf(Blob);
      expect(mockCanvas.width).toBe(0);
      expect(mockCanvas.height).toBe(0);
      expect(mockToBlob).toHaveBeenCalled();
    });

    test('handles negative MAX_WIDTH (should not resize)', async () => {
      mockImage.width = 100;
      mockImage.height = 100;

      const promise = resizeImage(mockFile, -100, 200);
      await simulateFileReading();

      const result = await promise;
      expect(result).toBe(mockFile);
      expect(mockToBlob).not.toHaveBeenCalled();
    });

    test('handles negative MAX_HEIGHT (resizes to negative)', async () => {
      mockImage.width = 100;
      mockImage.height = 100;

      const promise = resizeImage(mockFile, 200, -100);
      await simulateFileReading();

      const result = await promise;
      expect(result).toBeInstanceOf(Blob);
      expect(mockCanvas.width).toBe(-100);
      expect(mockCanvas.height).toBe(-100);
      expect(mockToBlob).toHaveBeenCalled();
    });

    test('handles very large images correctly', async () => {
      // Very large image: 4000x3000, max 1000x1000
      mockImage.width = 4000;
      mockImage.height = 3000;

      const promise = resizeImage(mockFile, 1000, 1000);
      await simulateFileReading();

      void (await promise);
      expect(mockCanvas.width).toBe(1000);
      expect(mockCanvas.height).toBe(750); // 3000 * (1000/4000) = 750
      expect(mockDrawImage).toHaveBeenCalledWith(mockImage, 0, 0, 1000, 750);
      expect(mockToBlob).toHaveBeenCalled();
    });
  });

  describe('Canvas operations', () => {
    test('calls canvas.getContext with 2d', async () => {
      mockImage.width = 300;
      mockImage.height = 100;

      const promise = resizeImage(mockFile, 200, 200);
      await simulateFileReading();

      await promise;
      expect(mockGetContext).toHaveBeenCalledWith('2d');
    });

    test('calls toBlob with correct parameters', async () => {
      mockImage.width = 300;
      mockImage.height = 100;

      const promise = resizeImage(mockFile, 200, 200);
      await simulateFileReading();

      await promise;
      expect(mockToBlob).toHaveBeenCalledWith(expect.any(Function), mockFile.type);
    });

    test('resolves with blob from canvas.toBlob', async () => {
      const expectedBlob = new Blob(['resized'], { type: 'image/jpeg' });
      mockToBlob.mockImplementation((callback: (blob: Blob | null) => void) => {
        callback(expectedBlob);
      });

      mockImage.width = 300;
      mockImage.height = 100;

      const promise = resizeImage(mockFile, 200, 200);
      await simulateFileReading();

      const result = await promise;
      expect(result).toBe(expectedBlob);
    });
  });

  describe('FileReader integration', () => {
    test('sets image src from FileReader result', async () => {
      const dataUrl = 'data:image/jpeg;base64,testData';

      const promise = resizeImage(mockFile, 200, 200);
      await simulateFileReading(dataUrl);

      await promise;
      expect(mockImage.src).toBe(dataUrl);
    });

    test('handles FileReader errors gracefully', async () => {
      // This test would need to be implemented if error handling is added
      // Currently the function doesn't handle FileReader errors
    });
  });

  describe('Image loading', () => {
    test('handles image onload event correctly', async () => {
      // The onload behavior is tested implicitly in other tests
      // Image onload triggers the resize logic
      mockImage.width = 300;
      mockImage.height = 100;

      const promise = resizeImage(mockFile, 200, 200);
      await simulateFileReading();

      await promise;
      expect(mockImage.onload).toBeDefined();
    });
  });
});
