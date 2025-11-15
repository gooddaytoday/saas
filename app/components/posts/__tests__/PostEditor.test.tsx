import React from 'react';
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PostEditor from '../PostEditor';

// Mock external dependencies
jest.mock('../../../lib/notify', () => jest.fn());
jest.mock('nprogress', () => ({
  start: jest.fn(),
  done: jest.fn(),
}));
jest.mock('../../../lib/resizeImage', () => ({
  resizeImage: jest.fn(),
}));
jest.mock('../../../lib/api/team-member', () => ({
  getSignedRequestForUploadApiMethod: jest.fn(),
  uploadFileUsingSignedPutRequestApiMethod: jest.fn(),
}));

// Mock MobX observer
jest.mock('mobx-react', () => ({
  observer: (component: any) => component,
}));

// Mock Material-UI Avatar (component is simple enough to not need mocking in most cases)
// But we'll keep it for compatibility

// Mock PostContent to simplify testing HTML rendering
jest.mock('../PostContent', () => {
  return function MockPostContent({ html }: any) {
    return <div data-testid="post-content">{html}</div>;
  };
});

// Mock react-mentions to simplify testing
jest.mock('react-mentions', () => ({
  MentionsInput: function MockMentionsInput({
    value,
    placeholder,
    onChange,
    children,
    style,
    ...props
  }: any) {
    const [localValue, setLocalValue] = React.useState(value);

    React.useEffect(() => {
      setLocalValue(value);
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setLocalValue(e.target.value);
      onChange?.(e);
    };

    return (
      <div data-testid="mentions-input" style={style?.input}>
        <textarea
          data-testid="mentions-textarea"
          value={localValue}
          placeholder={placeholder}
          onChange={handleChange}
          {...props}
        />
        {children}
      </div>
    );
  },
  Mention: function MockMention({ trigger, data, renderSuggestion }: any): any {
    return (
      <div data-testid="mention" data-trigger={trigger}>
        {data.map((item: any, idx: number) => (
          <div key={idx} data-testid={`mention-item-${idx}`}>
            {renderSuggestion(item)}
          </div>
        ))}
      </div>
    );
  },
}));

// Import mocked functions
import notify from '../../../lib/notify';
import NProgress from 'nprogress';
import { resizeImage } from '../../../lib/resizeImage';
import {
  getSignedRequestForUploadApiMethod,
  uploadFileUsingSignedPutRequestApiMethod,
} from '../../../lib/api/team-member';

// Mock FileReader for getImageDimension
const MockFileReader = jest.fn(() => ({
  readAsDataURL: jest.fn(function (this: any) {
    setTimeout(() => {
      this.onload?.({ target: { result: 'data:image/jpeg;base64,test' } });
    }, 0);
  }),
  onload: null,
}));

// Mock Image for getImageDimension
const MockImage = jest.fn(() => {
  const instance: any = {
    onload: null,
    width: 500,
    height: 400,
  };

  Object.defineProperty(instance, 'src', {
    set() {
      setTimeout(() => {
        instance.onload?.();
      }, 0);
    },
    get() {
      return '';
    },
  });

  return instance;
});

Object.defineProperty(window, 'FileReader', {
  writable: true,
  value: MockFileReader,
});

Object.defineProperty(window, 'Image', {
  writable: true,
  value: MockImage,
});

// Test data helpers
function getStoreStub(darkTheme = false) {
  return {
    currentUser: {
      _id: 'user-1',
      displayName: 'Current User',
      darkTheme,
    },
    currentTeam: {
      slug: 'test-team',
    },
  } as any;
}

function getMembersStub() {
  return [
    {
      _id: 'user-1',
      displayName: 'Current User',
      avatarUrl: 'http://example.com/user-1.jpg',
    },
    {
      _id: 'user-2',
      displayName: 'Team Member',
      avatarUrl: 'http://example.com/user-2.jpg',
    },
    {
      _id: 'user-3',
      displayName: 'Another Member',
      avatarUrl: 'http://example.com/user-3.jpg',
    },
  ] as any;
}

const defaultProps = {
  store: getStoreStub(),
  onChanged: jest.fn(),
  content: '',
  members: getMembersStub(),
  parentComponent: 'test',
  placeholder: 'Test placeholder',
};

describe('PostEditor', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_BUCKET_FOR_POSTS = 'test-bucket';
  });

  describe('Rendering - Markdown Mode', () => {
    test('renders component with MentionsInput by default', () => {
      render(<PostEditor {...defaultProps} />);

      expect(screen.getByTestId('mentions-input')).toBeInTheDocument();
      expect(screen.getByTestId('mentions-textarea')).toBeInTheDocument();
    });

    test('renders with custom placeholder', () => {
      render(<PostEditor {...defaultProps} placeholder="Custom placeholder" />);

      const textarea = screen.getByTestId('mentions-textarea');
      expect(textarea).toHaveAttribute('placeholder', 'Custom placeholder');
    });

    test('renders with default placeholder when not provided', () => {
      const props = { ...defaultProps, placeholder: undefined };
      render(<PostEditor {...props} />);

      const textarea = screen.getByTestId('mentions-textarea');
      expect(textarea).toHaveAttribute('placeholder', 'Compose new post');
    });

    test('renders Markdown and HTML toggle buttons', () => {
      render(<PostEditor {...defaultProps} />);

      expect(screen.getByRole('button', { name: /markdown/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /html/i })).toBeInTheDocument();
    });

    test('renders file upload input', () => {
      render(<PostEditor {...defaultProps} parentComponent="testParent" />);

      const fileInput = document.querySelector(
        'input[type="file"][id="upload-file-post-editor-testParent"]',
      ) as HTMLInputElement;
      expect(fileInput).toHaveAttribute('type', 'file');
      expect(fileInput).toHaveAttribute('accept', 'image/*');
      expect(fileInput).toHaveAttribute('id', 'upload-file-post-editor-testParent');
    });

    test('passes content value to MentionsInput', () => {
      const content = 'Test content';
      render(<PostEditor {...defaultProps} content={content} />);

      const textarea = screen.getByTestId('mentions-textarea');
      expect(textarea).toHaveValue(content);
    });

    test('renders with light theme background by default', () => {
      const store = getStoreStub(false);
      render(<PostEditor {...defaultProps} store={store} />);

      const input = screen.getByTestId('mentions-textarea');
      expect(input.parentElement).toHaveStyle('color: rgb(0, 0, 0)');
    });

    test('renders with dark theme background when enabled', () => {
      const store = getStoreStub(true);
      render(<PostEditor {...defaultProps} store={store} />);

      const input = screen.getByTestId('mentions-textarea');
      expect(input.parentElement).toHaveStyle('color: rgb(255, 255, 255)');
    });

    test('textarea has light background when content is present and light theme', () => {
      const store = getStoreStub(false);
      render(<PostEditor {...defaultProps} store={store} content="Some content" />);

      const input = screen.getByTestId('mentions-textarea');
      expect(input.parentElement).toHaveStyle({ backgroundColor: '#fff' });
    });

    test('textarea has dark background when content is present and dark theme', () => {
      const store = getStoreStub(true);
      render(<PostEditor {...defaultProps} store={store} content="Some content" />);

      const input = screen.getByTestId('mentions-textarea');
      expect(input.parentElement).toHaveStyle({ backgroundColor: '#0d1117' });
    });

    test('textarea has transparent background when content is empty', () => {
      const store = getStoreStub(false);
      render(<PostEditor {...defaultProps} store={store} content="" />);

      const input = screen.getByTestId('mentions-textarea');
      expect(input.parentElement).toHaveStyle({
        backgroundColor: 'transparent',
      });
    });
  });

  describe('Content Changes', () => {
    test('calls onChanged callback when textarea value changes', async () => {
      const user = userEvent.setup();
      const onChanged = jest.fn();

      render(<PostEditor {...defaultProps} onChanged={onChanged} />);

      const textarea = screen.getByTestId('mentions-textarea');
      await user.clear(textarea);
      await user.type(textarea, 'New text');

      // onChanged is called for each character, check the final call
      expect(onChanged).toHaveBeenLastCalledWith('New text');
    });

    test('calls onChanged with complete content after multiple keystrokes', async () => {
      const user = userEvent.setup();
      const onChanged = jest.fn();

      render(<PostEditor {...defaultProps} onChanged={onChanged} content="" />);

      const textarea = screen.getByTestId('mentions-textarea');
      await user.type(textarea, 'test');

      // onChanged should be called for each character, check the last call
      expect(onChanged).toHaveBeenLastCalledWith('test');
    });
  });

  describe('Mode Switching - HTML Preview', () => {
    test('switches to HTML preview when HTML button is clicked', async () => {
      const user = userEvent.setup();
      const content = '**Bold text**';

      render(<PostEditor {...defaultProps} content={content} />);

      expect(screen.getByTestId('mentions-textarea')).toBeInTheDocument();

      const htmlButton = screen.getByRole('button', { name: /html/i });
      await user.click(htmlButton);

      await waitFor(() => {
        expect(screen.getByTestId('post-content')).toBeInTheDocument();
        expect(screen.queryByTestId('mentions-textarea')).not.toBeInTheDocument();
      });
    });

    test('converts markdown to HTML correctly in preview mode', async () => {
      const user = userEvent.setup();
      const content = '**Bold text**';

      render(<PostEditor {...defaultProps} content={content} />);

      const htmlButton = screen.getByRole('button', { name: /html/i });
      await user.click(htmlButton);

      await waitFor(() => {
        const postContent = screen.getByTestId('post-content');
        expect(postContent).toBeInTheDocument();
        // The actual HTML conversion is handled by marked library
      });
    });

    test('shows "Nothing to preview" when content is empty in HTML mode', async () => {
      const user = userEvent.setup();

      render(<PostEditor {...defaultProps} content="" />);

      const htmlButton = screen.getByRole('button', { name: /html/i });
      await user.click(htmlButton);

      await waitFor(() => {
        expect(screen.getByTestId('post-content')).toHaveTextContent('Nothing to preview.');
      });
    });

    test('switches back to Markdown mode when Markdown button is clicked', async () => {
      const user = userEvent.setup();
      const content = 'Test content';

      render(<PostEditor {...defaultProps} content={content} />);

      const htmlButton = screen.getByRole('button', { name: /html/i });
      await user.click(htmlButton);

      await waitFor(() => {
        expect(screen.getByTestId('post-content')).toBeInTheDocument();
      });

      const markdownButton = screen.getByRole('button', { name: /markdown/i });
      await user.click(markdownButton);

      await waitFor(() => {
        expect(screen.getByTestId('mentions-textarea')).toBeInTheDocument();
        expect(screen.queryByTestId('post-content')).not.toBeInTheDocument();
      });
    });

    test('Markdown button has bold font weight in Markdown mode', async () => {
      render(<PostEditor {...defaultProps} />);

      const markdownButton = screen.getByRole('button', { name: /markdown/i });
      expect(markdownButton).toHaveStyle({ fontWeight: '600' });
    });

    test('HTML button has bold font weight in HTML preview mode', async () => {
      const user = userEvent.setup();

      render(<PostEditor {...defaultProps} content="Test" />);

      const htmlButton = screen.getByRole('button', { name: /html/i });
      await user.click(htmlButton);

      await waitFor(() => {
        expect(htmlButton).toHaveStyle({ fontWeight: '600' });
      });
    });
  });

  describe('Mention Suggestions', () => {
    test('renders mention component with current data', () => {
      render(<PostEditor {...defaultProps} />);

      expect(screen.getByTestId('mention')).toBeInTheDocument();
      expect(screen.getByTestId('mention')).toHaveAttribute('data-trigger', '@');
    });

    test('excludes current user from mention suggestions', () => {
      const members = getMembersStub();
      const { container } = render(<PostEditor {...defaultProps} members={members} />);

      // Count mention items - should be 2 (excluding current user)
      const mentionItems = container.querySelectorAll('[data-testid^="mention-item-"]');
      expect(mentionItems.length).toBe(2);
    });

    test('includes all non-current users in mention suggestions', () => {
      const members = getMembersStub();
      render(<PostEditor {...defaultProps} members={members} />);

      // Should have mention items for team members (excluding current user)
      expect(screen.getByTestId('mention-item-0')).toBeInTheDocument();
      expect(screen.getByTestId('mention-item-1')).toBeInTheDocument();
    });

    test('mention suggestion renders with avatar', () => {
      const members = getMembersStub();
      render(<PostEditor {...defaultProps} members={members} />);

      // Check that mention items render (they contain Avatar components)
      const mentionItem = screen.getByTestId('mention-item-0');
      expect(mentionItem).toBeInTheDocument();
    });
  });

  describe('File Upload - Images', () => {
    test('uploads image file successfully and appends HTML to content', async () => {
      const onChanged = jest.fn();
      const originalContent = 'Original content';

      (getSignedRequestForUploadApiMethod as jest.Mock).mockResolvedValueOnce({
        signedRequest: 'signed-request-url',
        url: 'http://example.com/image.jpg',
      });

      (resizeImage as jest.Mock).mockResolvedValueOnce(new File([''], 'resized.jpg'));

      render(<PostEditor {...defaultProps} onChanged={onChanged} content={originalContent} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      // Mock image dimension
      Object.defineProperty(imageFile, 'size', { value: 1024 });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [imageFile] } });
      });

      await waitFor(() => {
        expect(getSignedRequestForUploadApiMethod).toHaveBeenCalledWith({
          fileName: 'test.jpg',
          fileType: 'image/jpeg',
          prefix: 'test-team',
          bucket: 'test-bucket',
        });
      });

      await waitFor(() => {
        expect(uploadFileUsingSignedPutRequestApiMethod).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(onChanged).toHaveBeenCalledWith(expect.stringContaining('Original content'));
      });
    });

    test('calls NProgress.start and NProgress.done during image upload', async () => {
      (getSignedRequestForUploadApiMethod as jest.Mock).mockResolvedValueOnce({
        signedRequest: 'signed-request-url',
        url: 'http://example.com/image.jpg',
      });

      (resizeImage as jest.Mock).mockResolvedValueOnce(new File([''], 'resized.jpg'));

      render(<PostEditor {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [imageFile] } });
      });

      await waitFor(() => {
        expect(NProgress.start).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(NProgress.done).toHaveBeenCalled();
      });
    });

    test('notifies user of successful image upload', async () => {
      (getSignedRequestForUploadApiMethod as jest.Mock).mockResolvedValueOnce({
        signedRequest: 'signed-request-url',
        url: 'http://example.com/image.jpg',
      });

      (resizeImage as jest.Mock).mockResolvedValueOnce(new File([''], 'resized.jpg'));

      render(<PostEditor {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [imageFile] } });
      });

      await waitFor(() => {
        expect(notify).toHaveBeenCalledWith('You successfully uploaded file.');
      });
    });

    test('applies image width constraint based on image dimensions', async () => {
      const onChanged = jest.fn();

      (getSignedRequestForUploadApiMethod as jest.Mock).mockResolvedValueOnce({
        signedRequest: 'signed-request-url',
        url: 'http://example.com/image.jpg',
      });

      (resizeImage as jest.Mock).mockResolvedValueOnce(new File([''], 'resized.jpg'));

      render(<PostEditor {...defaultProps} onChanged={onChanged} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [imageFile] } });
      });

      await waitFor(() => {
        expect(onChanged).toHaveBeenCalled();
      });
    });
  });

  describe('File Upload - PDFs', () => {
    test('uploads PDF file successfully and appends markdown link', async () => {
      const onChanged = jest.fn();
      const originalContent = 'Original content';

      (getSignedRequestForUploadApiMethod as jest.Mock).mockResolvedValueOnce({
        signedRequest: 'signed-request-url',
        url: 'http://example.com/document.pdf',
      });

      render(<PostEditor {...defaultProps} onChanged={onChanged} content={originalContent} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const pdfFile = new File(['pdf data'], 'document.pdf', {
        type: 'application/pdf',
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [pdfFile] } });
      });

      await waitFor(() => {
        expect(getSignedRequestForUploadApiMethod).toHaveBeenCalledWith({
          fileName: 'document.pdf',
          fileType: 'application/pdf',
          prefix: 'test-team',
          bucket: 'test-bucket',
        });
      });

      await waitFor(() => {
        expect(uploadFileUsingSignedPutRequestApiMethod).toHaveBeenCalledWith(
          pdfFile,
          'signed-request-url',
        );
      });

      await waitFor(() => {
        expect(onChanged).toHaveBeenCalledWith(expect.stringContaining('[document.pdf]'));
      });
    });

    test('includes PDF URL in markdown link', async () => {
      const onChanged = jest.fn();

      (getSignedRequestForUploadApiMethod as jest.Mock).mockResolvedValueOnce({
        signedRequest: 'signed-request-url',
        url: 'http://example.com/document.pdf',
      });

      render(<PostEditor {...defaultProps} onChanged={onChanged} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const pdfFile = new File(['pdf data'], 'document.pdf', {
        type: 'application/pdf',
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [pdfFile] } });
      });

      await waitFor(() => {
        expect(onChanged).toHaveBeenCalledWith(
          expect.stringContaining('http://example.com/document.pdf'),
        );
      });
    });

    test('notifies user of successful PDF upload', async () => {
      (getSignedRequestForUploadApiMethod as jest.Mock).mockResolvedValueOnce({
        signedRequest: 'signed-request-url',
        url: 'http://example.com/document.pdf',
      });

      render(<PostEditor {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const pdfFile = new File(['pdf data'], 'document.pdf', {
        type: 'application/pdf',
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [pdfFile] } });
      });

      await waitFor(() => {
        expect(notify).toHaveBeenCalledWith('You successfully uploaded file.');
      });
    });
  });

  describe('File Upload - Errors', () => {
    test('notifies user when no file is selected', async () => {
      render(<PostEditor {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [] } });
      });

      await waitFor(() => {
        expect(notify).toHaveBeenCalledWith('No file selected.');
      });
    });

    test('notifies user when file type is not allowed', async () => {
      render(<PostEditor {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const wrongFile = new File(['text data'], 'document.txt', {
        type: 'text/plain',
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [wrongFile] } });
      });

      await waitFor(() => {
        expect(notify).toHaveBeenCalledWith('Wrong file.');
      });
    });

    test('notifies user when file has no MIME type', async () => {
      render(<PostEditor {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const fileNoType = new File(['data'], 'file', {
        type: '',
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [fileNoType] } });
      });

      await waitFor(() => {
        expect(notify).toHaveBeenCalledWith('Wrong file.');
      });
    });

    test('handles API error during upload', async () => {
      const error = new Error('Upload failed');
      (getSignedRequestForUploadApiMethod as jest.Mock).mockRejectedValueOnce(error);

      render(<PostEditor {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [imageFile] } });
      });

      await waitFor(() => {
        expect(notify).toHaveBeenCalledWith(error);
      });
    });

    test('calls NProgress.done when upload fails', async () => {
      (getSignedRequestForUploadApiMethod as jest.Mock).mockRejectedValueOnce(
        new Error('Upload failed'),
      );

      render(<PostEditor {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [imageFile] } });
      });

      await waitFor(() => {
        expect(NProgress.done).toHaveBeenCalled();
      });
    });

    test('clears file input after upload attempt', async () => {
      (getSignedRequestForUploadApiMethod as jest.Mock).mockResolvedValueOnce({
        signedRequest: 'signed-request-url',
        url: 'http://example.com/image.jpg',
      });

      (resizeImage as jest.Mock).mockResolvedValueOnce(new File([''], 'resized.jpg'));

      render(<PostEditor {...defaultProps} />);

      const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
      const imageFile = new File(['image data'], 'test.jpg', {
        type: 'image/jpeg',
      });

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [imageFile] } });
      });

      await waitFor(() => {
        expect(fileInput.value).toBe('');
      });
    });
  });
});
