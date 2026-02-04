'use client';

import React, { useState, useCallback, useMemo, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import { clsx } from 'clsx';
import { ChevronDown, ChevronRight, Copy, Check, Code2 } from 'lucide-react';

// =============================================================================
// Types
// =============================================================================
interface MarkdownRendererProps {
  content: string | null | undefined;
  className?: string;
  showLineNumbers?: boolean;
  collapsibleJson?: boolean;
  enableCopy?: boolean;
}

interface CodeBlockProps {
  inline?: boolean;
  className?: string;
  children?: React.ReactNode;
  collapsibleJson?: boolean;
  enableCopy?: boolean;
}

interface JsonBlockProps {
  content: string;
  collapsibleJson: boolean;
  enableCopy: boolean;
}

interface CopyButtonProps {
  content: string;
}

// =============================================================================
// Copy Button Component (F1.3)
// =============================================================================
const CopyButton = memo(function CopyButton({ content }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [content]);

  return (
    <button
      onClick={handleCopy}
      className={clsx(
        'absolute top-2 right-2 p-1.5 rounded-md transition-all duration-200',
        'opacity-0 group-hover:opacity-100',
        'bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white',
        copied && 'bg-green-600 hover:bg-green-600'
      )}
      aria-label={copied ? 'Copied!' : 'Copy code'}
    >
      {copied ? (
        <Check className="w-4 h-4" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </button>
  );
});

// =============================================================================
// JSON Block Component (F1.2)
// =============================================================================
const JsonBlock = memo(function JsonBlock({
  content,
  collapsibleJson,
  enableCopy
}: JsonBlockProps) {
  const [isExpanded, setIsExpanded] = useState(!collapsibleJson);

  // Parse and format JSON for better display
  const formattedJson = useMemo(() => {
    try {
      const parsed = JSON.parse(content);
      return JSON.stringify(parsed, null, 2);
    } catch {
      return content;
    }
  }, [content]);

  const toggleExpand = useCallback(() => {
    setIsExpanded(prev => !prev);
  }, []);

  if (!collapsibleJson) {
    return (
      <div className="relative group">
        <pre className="bg-gray-900 text-gray-100 rounded-lg p-4 overflow-x-auto">
          <code className="language-json text-sm font-mono">{formattedJson}</code>
        </pre>
        {enableCopy && <CopyButton content={formattedJson} />}
      </div>
    );
  }

  return (
    <div className="my-4 border border-gray-700 rounded-lg overflow-hidden">
      <button
        onClick={toggleExpand}
        className={clsx(
          'w-full flex items-center gap-2 px-4 py-2',
          'bg-gray-800 hover:bg-gray-750 text-gray-300',
          'transition-colors duration-150'
        )}
        aria-expanded={isExpanded}
        aria-label={isExpanded ? 'Collapse JSON' : 'Expand JSON'}
      >
        {isExpanded ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
        <Code2 className="w-4 h-4" />
        <span className="text-sm font-medium">
          {isExpanded ? 'Hide JSON' : 'Show JSON'}
        </span>
      </button>

      {isExpanded && (
        <div className="relative group">
          <pre className="bg-gray-900 text-gray-100 p-4 overflow-x-auto m-0 rounded-none">
            <code className="language-json text-sm font-mono">{formattedJson}</code>
          </pre>
          {enableCopy && <CopyButton content={formattedJson} />}
        </div>
      )}
    </div>
  );
});

// =============================================================================
// Code Block Component (F1.3, F1.4)
// =============================================================================
const CodeBlock = memo(function CodeBlock({
  inline,
  className,
  children,
  collapsibleJson = true,
  enableCopy = true,
}: CodeBlockProps) {
  const content = String(children).replace(/\n$/, '');
  const match = /language-(\w+)/.exec(className || '');
  const language = match ? match[1] : '';

  // Handle inline code
  if (inline) {
    return (
      <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-sm font-mono text-pink-600 dark:text-pink-400">
        {children}
      </code>
    );
  }

  // Handle JSON blocks with collapsible feature
  if (language === 'json' && collapsibleJson) {
    return (
      <JsonBlock
        content={content}
        collapsibleJson={collapsibleJson}
        enableCopy={enableCopy}
      />
    );
  }

  // Handle regular code blocks with syntax highlighting
  return (
    <div className="relative group my-4">
      {language && (
        <div className="absolute top-0 left-0 px-3 py-1 text-xs font-medium text-gray-400 bg-gray-800 rounded-tl-lg rounded-br-lg">
          {language}
        </div>
      )}
      <pre className={clsx(
        'bg-gray-900 text-gray-100 rounded-lg overflow-x-auto',
        language ? 'pt-8 pb-4 px-4' : 'p-4',
        className
      )}>
        <code className={clsx('text-sm font-mono', className)}>
          {children}
        </code>
      </pre>
      {enableCopy && <CopyButton content={content} />}
    </div>
  );
});

// =============================================================================
// Empty State Component
// =============================================================================
const EmptyState = memo(function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4">
        <Code2 className="w-6 h-6 text-gray-400" />
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm">
        No content available
      </p>
    </div>
  );
});

// =============================================================================
// Error State Component
// =============================================================================
interface ErrorStateProps {
  content: string;
  error: string;
}

const ErrorState = memo(function ErrorState({ content, error }: ErrorStateProps) {
  return (
    <div className="space-y-4">
      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-yellow-800 dark:text-yellow-200 text-sm">
          <strong>Formatting Warning:</strong> Unable to render markdown formatting.
          Displaying raw content below.
        </p>
        <p className="text-yellow-600 dark:text-yellow-400 text-xs mt-1">
          Error: {error}
        </p>
      </div>
      <pre className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg overflow-x-auto text-sm font-mono whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
});

// =============================================================================
// Main Markdown Renderer Component (F1.1)
// =============================================================================
export function MarkdownRenderer({
  content,
  className,
  collapsibleJson = true,
  enableCopy = true,
}: MarkdownRendererProps) {
  const [renderError, setRenderError] = useState<string | null>(null);

  // Handle null/undefined/empty content (US-002)
  if (content === null || content === undefined || content.trim() === '') {
    return <EmptyState />;
  }

  // Create custom components with error boundary
  const components = useMemo(() => ({
    // Headings with proper hierarchy (US-001)
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4 first:mt-0" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mt-6 mb-3" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-100 mt-5 mb-2" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h4 className="text-lg font-medium text-gray-800 dark:text-gray-100 mt-4 mb-2" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h5 className="text-base font-medium text-gray-700 dark:text-gray-200 mt-3 mb-1" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
      <h6 className="text-sm font-medium text-gray-700 dark:text-gray-200 mt-3 mb-1" {...props}>
        {children}
      </h6>
    ),

    // Paragraphs with readable spacing
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => (
      <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-4 last:mb-0" {...props}>
        {children}
      </p>
    ),

    // Lists with proper indentation
    ul: ({ children, ...props }: React.HTMLAttributes<HTMLUListElement>) => (
      <ul className="list-disc list-inside space-y-1 mb-4 ml-4 text-gray-700 dark:text-gray-300" {...props}>
        {children}
      </ul>
    ),
    ol: ({ children, ...props }: React.HTMLAttributes<HTMLOListElement>) => (
      <ol className="list-decimal list-inside space-y-1 mb-4 ml-4 text-gray-700 dark:text-gray-300" {...props}>
        {children}
      </ol>
    ),
    li: ({ children, ...props }: React.HTMLAttributes<HTMLLIElement>) => (
      <li className="leading-relaxed" {...props}>
        {children}
      </li>
    ),

    // Code blocks with syntax highlighting (F1.3, F1.4)
    code: ({ inline, className, children, ...props }: CodeBlockProps & React.HTMLAttributes<HTMLElement>) => (
      <CodeBlock
        inline={inline}
        className={className}
        collapsibleJson={collapsibleJson}
        enableCopy={enableCopy}
        {...props}
      >
        {children}
      </CodeBlock>
    ),

    // Blockquotes
    blockquote: ({ children, ...props }: React.HTMLAttributes<HTMLQuoteElement>) => (
      <blockquote
        className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 dark:bg-blue-900/20 italic text-gray-700 dark:text-gray-300"
        {...props}
      >
        {children}
      </blockquote>
    ),

    // Links
    a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 dark:text-blue-400 hover:underline"
        {...props}
      >
        {children}
      </a>
    ),

    // Tables (GFM)
    table: ({ children, ...props }: React.HTMLAttributes<HTMLTableElement>) => (
      <div className="overflow-x-auto my-4">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700" {...props}>
          {children}
        </table>
      </div>
    ),
    thead: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <thead className="bg-gray-50 dark:bg-gray-800" {...props}>
        {children}
      </thead>
    ),
    tbody: ({ children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
      <tbody className="divide-y divide-gray-200 dark:divide-gray-700" {...props}>
        {children}
      </tbody>
    ),
    tr: ({ children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
      <tr className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors" {...props}>
        {children}
      </tr>
    ),
    th: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider" {...props}>
        {children}
      </th>
    ),
    td: ({ children, ...props }: React.HTMLAttributes<HTMLTableCellElement>) => (
      <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300" {...props}>
        {children}
      </td>
    ),

    // Horizontal rule
    hr: (props: React.HTMLAttributes<HTMLHRElement>) => (
      <hr className="my-6 border-gray-200 dark:border-gray-700" {...props} />
    ),

    // Strong and emphasis
    strong: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <strong className="font-semibold text-gray-900 dark:text-white" {...props}>
        {children}
      </strong>
    ),
    em: ({ children, ...props }: React.HTMLAttributes<HTMLElement>) => (
      <em className="italic" {...props}>
        {children}
      </em>
    ),

    // Images
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
      <img
        src={src}
        alt={alt || ''}
        className="max-w-full h-auto rounded-lg my-4"
        loading="lazy"
        {...props}
      />
    ),
  }), [collapsibleJson, enableCopy]);

  // Render with error handling (US-003)
  try {
    return (
      <div className={clsx(
        'markdown-content prose prose-slate dark:prose-invert max-w-none',
        className
      )}>
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          rehypePlugins={[rehypeHighlight]}
          components={components}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parsing error';

    // Log error for debugging
    console.error('Markdown rendering error:', error);

    // Return error state with raw content
    return <ErrorState content={content} error={errorMessage} />;
  }
}

// =============================================================================
// Export default for convenience
// =============================================================================
export default MarkdownRenderer;
