import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import PostContent from '../PostContent';

describe('PostContent', () => {
  describe('Rendering', () => {
    test('renders without errors with valid HTML content', () => {
      // Arrange
      const htmlContent = '<p>Test content</p>';

      // Act
      const { container } = render(<PostContent html={htmlContent} />);

      // Assert
      expect(screen.getByText('Test content')).toBeInTheDocument();
      // Verify the main container div exists
      const postContentDiv = container.firstChild as HTMLElement;
      expect(postContentDiv).toBeInTheDocument();
      expect(postContentDiv.tagName).toBe('DIV');
    });

    test('renders with empty HTML string', () => {
      // Arrange
      const htmlContent = '';

      // Act
      const { container } = render(<PostContent html={htmlContent} />);

      // Assert
      const postContentDiv = container.firstChild as HTMLElement;
      expect(postContentDiv).toBeInTheDocument();
      // Empty HTML should result in no visible text content
      expect(postContentDiv.textContent).toBe('');
    });

    test('renders with simple HTML elements', () => {
      // Arrange
      const htmlContent = '<h1>Title</h1><p>Paragraph content</p>';

      // Act
      render(<PostContent html={htmlContent} />);

      // Assert
      expect(screen.getByText('Title')).toBeInTheDocument();
      expect(screen.getByText('Paragraph content')).toBeInTheDocument();
    });

    test('renders with nested HTML structure', () => {
      // Arrange
      const htmlContent = '<div><span>Nested</span> <strong>content</strong></div>';

      // Act
      render(<PostContent html={htmlContent} />);

      // Assert
      expect(screen.getByText('Nested')).toBeInTheDocument();
      expect(screen.getByText('content')).toBeInTheDocument();
    });

    test('renders with HTML entities', () => {
      // Arrange
      const htmlContent = '<p>Content &amp; more content</p>';

      // Act
      render(<PostContent html={htmlContent} />);

      // Assert
      expect(screen.getByText('Content & more content')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    test('applies correct inline styles', () => {
      // Arrange
      const htmlContent = '<p>Styled content</p>';

      // Act
      const { container } = render(<PostContent html={htmlContent} />);

      // Assert
      const postContentDiv = container.firstChild as HTMLElement;
      expect(postContentDiv).toHaveStyle({
        fontSize: '15px',
        lineHeight: '2em',
        fontFamily: 'Roboto, sans-serif',
        wordBreak: 'break-all',
      });
    });

    test('renders as a div element', () => {
      // Arrange
      const htmlContent = '<p>Content</p>';

      // Act
      const { container } = render(<PostContent html={htmlContent} />);

      // Assert
      const postContentDiv = container.firstChild as HTMLElement;
      expect(postContentDiv.tagName).toBe('DIV');
    });
  });

  describe('HTML Content Handling', () => {
    test('handles HTML with links', () => {
      // Arrange
      const htmlContent = '<p>Check this <a href="https://example.com">link</a></p>';

      // Act
      render(<PostContent html={htmlContent} />);

      // Assert
      expect(screen.getByText(/Check this/)).toBeInTheDocument();
      expect(screen.getByText('link')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'link' })).toBeInTheDocument();
    });

    test('handles HTML with lists', () => {
      // Arrange
      const htmlContent = '<ul><li>Item 1</li><li>Item 2</li></ul>';

      // Act
      render(<PostContent html={htmlContent} />);

      // Assert
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    test('handles HTML with formatting', () => {
      // Arrange
      const htmlContent = '<p><em>Italic</em> and <strong>bold</strong> text</p>';

      // Act
      render(<PostContent html={htmlContent} />);

      // Assert
      expect(screen.getByText('Italic')).toBeInTheDocument();
      expect(screen.getByText('bold')).toBeInTheDocument();
      // Check for partial text matches due to HTML structure
      expect(screen.getByText(/and/)).toBeInTheDocument();
      expect(screen.getByText(/text/)).toBeInTheDocument();
    });

    test('handles complex HTML structure', () => {
      // Arrange
      const htmlContent = `
        <div class="content">
          <h2>Article Title</h2>
          <p>This is a paragraph with <a href="#link">a link</a>.</p>
          <blockquote>Quote text</blockquote>
        </div>
      `;

      // Act
      render(<PostContent html={htmlContent} />);

      // Assert
      expect(screen.getByText('Article Title')).toBeInTheDocument();
      expect(screen.getByText('a link')).toBeInTheDocument();
      expect(screen.getByText('Quote text')).toBeInTheDocument();
      // Check for partial text matches due to HTML structure
      expect(screen.getByText(/This is a paragraph/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    test('handles HTML with script tags (renders as text)', () => {
      // Arrange
      const htmlContent = '<p>Text with <script>alert("test")</script> script</p>';

      // Act
      render(<PostContent html={htmlContent} />);

      // Assert
      expect(screen.getByText('Text with script')).toBeInTheDocument();
      // Note: dangerouslySetInnerHTML will render script tags but they won't execute in tests
    });

    test('handles HTML with special characters', () => {
      // Arrange
      const htmlContent = '<p>Special chars: © ® ™ €</p>';

      // Act
      render(<PostContent html={htmlContent} />);

      // Assert
      expect(screen.getByText('Special chars: © ® ™ €')).toBeInTheDocument();
    });

    test('handles minimal HTML structure', () => {
      // Arrange
      const htmlContent = '<span>test</span>';

      // Act
      render(<PostContent html={htmlContent} />);

      // Assert
      expect(screen.getByText('test')).toBeInTheDocument();
    });
  });
});
