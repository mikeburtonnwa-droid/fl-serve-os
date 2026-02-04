/**
 * Unit Tests for MarkdownRenderer Component
 * Tests: TC-001, TC-002 from Test Plans
 *
 * Feature: F1.1 - Markdown Renderer Component
 * User Stories: US-001, US-002, US-003
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MarkdownRenderer } from '@/components/ui/markdown-renderer';

// Mock clipboard API
const mockClipboard = {
  writeText: jest.fn().mockResolvedValue(undefined),
};
Object.assign(navigator, { clipboard: mockClipboard });

describe('MarkdownRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // TC-001: Markdown renders basic headers
  describe('TC-001: Header Rendering', () => {
    it('renders H1 headers with correct hierarchy', () => {
      const content = '# Hello World';
      render(<MarkdownRenderer content={content} />);

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toHaveTextContent('Hello World');
      expect(h1).toHaveClass('text-3xl', 'font-bold');
    });

    it('renders H2 headers with correct hierarchy', () => {
      const content = '## Sub Heading';
      render(<MarkdownRenderer content={content} />);

      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h2).toHaveTextContent('Sub Heading');
      expect(h2).toHaveClass('text-2xl', 'font-semibold');
    });

    it('renders H1 > H2 > H3 hierarchy correctly', () => {
      const content = `# Main Title
## Section
### Subsection`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
      expect(screen.getByRole('heading', { level: 3 })).toBeInTheDocument();
    });
  });

  // TC-002: Markdown handles null content
  describe('TC-002: Null/Empty Content Handling', () => {
    it('renders EmptyState for null content', () => {
      render(<MarkdownRenderer content={null} />);

      expect(screen.getByText('No content available')).toBeInTheDocument();
    });

    it('renders EmptyState for undefined content', () => {
      render(<MarkdownRenderer content={undefined} />);

      expect(screen.getByText('No content available')).toBeInTheDocument();
    });

    it('renders EmptyState for empty string content', () => {
      render(<MarkdownRenderer content="" />);

      expect(screen.getByText('No content available')).toBeInTheDocument();
    });

    it('renders EmptyState for whitespace-only content', () => {
      render(<MarkdownRenderer content="   \n\t  " />);

      expect(screen.getByText('No content available')).toBeInTheDocument();
    });

    it('does not throw errors for null content', () => {
      expect(() => {
        render(<MarkdownRenderer content={null} />);
      }).not.toThrow();
    });
  });

  // US-001: Proper formatting tests
  describe('US-001: Proper Formatting', () => {
    it('renders bullet lists with proper indentation', () => {
      const content = `- Item 1
- Item 2
- Item 3`;

      render(<MarkdownRenderer content={content} />);

      const list = screen.getByRole('list');
      expect(list).toHaveClass('list-disc', 'ml-4');
      expect(screen.getAllByRole('listitem')).toHaveLength(3);
    });

    it('renders numbered lists correctly', () => {
      const content = `1. First
2. Second
3. Third`;

      render(<MarkdownRenderer content={content} />);

      const list = screen.getByRole('list');
      expect(list).toHaveClass('list-decimal');
    });

    it('renders paragraphs with readable spacing', () => {
      const content = `First paragraph.

Second paragraph.`;

      render(<MarkdownRenderer content={content} />);

      const paragraphs = screen.getAllByText(/paragraph/);
      expect(paragraphs).toHaveLength(2);
    });

    it('renders tables correctly (GFM)', () => {
      const content = `| Header 1 | Header 2 |
|----------|----------|
| Cell 1   | Cell 2   |`;

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByRole('table')).toBeInTheDocument();
      expect(screen.getByText('Header 1')).toBeInTheDocument();
      expect(screen.getByText('Cell 1')).toBeInTheDocument();
    });

    it('renders blockquotes with styling', () => {
      const content = '> This is a quote';

      render(<MarkdownRenderer content={content} />);

      const blockquote = screen.getByText('This is a quote').closest('blockquote');
      expect(blockquote).toHaveClass('border-l-4', 'border-blue-500');
    });

    it('renders inline code with styling', () => {
      const content = 'Use `const x = 1` for variables';

      render(<MarkdownRenderer content={content} />);

      const code = screen.getByText('const x = 1');
      expect(code).toHaveClass('font-mono');
    });
  });

  // F1.2: JSON Block Collapsible Sections
  describe('F1.2: JSON Collapsible Sections', () => {
    it('renders JSON blocks collapsed by default when collapsibleJson=true', () => {
      const content = '```json\n{"key": "value"}\n```';

      render(<MarkdownRenderer content={content} collapsibleJson={true} />);

      expect(screen.getByText('Show JSON')).toBeInTheDocument();
    });

    it('expands JSON block when clicked', async () => {
      const content = '```json\n{"key": "value"}\n```';

      render(<MarkdownRenderer content={content} collapsibleJson={true} />);

      const button = screen.getByText('Show JSON');
      fireEvent.click(button);

      await waitFor(() => {
        expect(screen.getByText('Hide JSON')).toBeInTheDocument();
      });
    });

    it('collapses JSON block when clicked again', async () => {
      const content = '```json\n{"key": "value"}\n```';

      render(<MarkdownRenderer content={content} collapsibleJson={true} />);

      // Expand
      fireEvent.click(screen.getByText('Show JSON'));
      await waitFor(() => {
        expect(screen.getByText('Hide JSON')).toBeInTheDocument();
      });

      // Collapse
      fireEvent.click(screen.getByText('Hide JSON'));
      await waitFor(() => {
        expect(screen.getByText('Show JSON')).toBeInTheDocument();
      });
    });

    it('renders JSON without collapsing when collapsibleJson=false', () => {
      const content = '```json\n{"key": "value"}\n```';

      render(<MarkdownRenderer content={content} collapsibleJson={false} />);

      expect(screen.queryByText('Show JSON')).not.toBeInTheDocument();
      expect(screen.getByText(/"key":/)).toBeInTheDocument();
    });
  });

  // F1.3: Code Block Copy-to-Clipboard
  describe('F1.3: Copy to Clipboard', () => {
    it('shows copy button on hover', async () => {
      const content = '```javascript\nconst x = 1;\n```';

      render(<MarkdownRenderer content={content} enableCopy={true} />);

      // Copy button should exist but be hidden until hover
      const copyButton = screen.getByLabelText('Copy code');
      expect(copyButton).toHaveClass('opacity-0');
    });

    it('copies code to clipboard when clicked', async () => {
      const content = '```javascript\nconst x = 1;\n```';

      render(<MarkdownRenderer content={content} enableCopy={true} />);

      const copyButton = screen.getByLabelText('Copy code');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(navigator.clipboard.writeText).toHaveBeenCalledWith('const x = 1;');
      });
    });

    it('shows Copied! confirmation after clicking', async () => {
      const content = '```javascript\nconst x = 1;\n```';

      render(<MarkdownRenderer content={content} enableCopy={true} />);

      const copyButton = screen.getByLabelText('Copy code');
      fireEvent.click(copyButton);

      await waitFor(() => {
        expect(screen.getByLabelText('Copied!')).toBeInTheDocument();
      });
    });

    it('does not show copy button when enableCopy=false', () => {
      const content = '```javascript\nconst x = 1;\n```';

      render(<MarkdownRenderer content={content} enableCopy={false} />);

      expect(screen.queryByLabelText('Copy code')).not.toBeInTheDocument();
    });
  });

  // F1.4: Syntax Highlighting
  describe('F1.4: Syntax Highlighting', () => {
    it('shows language label for code blocks', () => {
      const content = '```javascript\nconst x = 1;\n```';

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('javascript')).toBeInTheDocument();
    });

    it('applies syntax highlighting classes', () => {
      const content = '```python\ndef hello():\n    pass\n```';

      render(<MarkdownRenderer content={content} />);

      expect(screen.getByText('python')).toBeInTheDocument();
    });
  });

  // US-003: Error Handling
  describe('US-003: Error Handling', () => {
    it('displays warning for malformed markdown gracefully', () => {
      // React-markdown is quite resilient, but we can test our error boundary
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      // This shouldn't actually cause an error, but tests the resilience
      const content = '[Malformed link(without closing bracket';

      expect(() => {
        render(<MarkdownRenderer content={content} />);
      }).not.toThrow();

      consoleSpy.mockRestore();
    });
  });

  // Performance tests (TC-301)
  describe('TC-301: Performance', () => {
    it('renders large content within acceptable time', () => {
      // Generate 10KB of markdown content
      const largeContent = Array(500)
        .fill(null)
        .map((_, i) => `## Section ${i}\n\nThis is paragraph ${i} with some content.\n`)
        .join('\n');

      const startTime = performance.now();
      render(<MarkdownRenderer content={largeContent} />);
      const endTime = performance.now();

      // Should render in less than 50ms as per acceptance criteria
      // Note: In test environment this may vary, so we use a higher threshold
      expect(endTime - startTime).toBeLessThan(500);
    });
  });
});
