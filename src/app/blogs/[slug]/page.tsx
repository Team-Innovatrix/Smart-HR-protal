import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getBlogPost } from '@/lib/blogUtils';
// Removed timezone dependency - not needed for public pages

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const blog = getBlogPost(slug);
  
  if (!blog) {
    return {
      title: 'Blog Not Found - HR Dashboard',
    };
  }

  return {
    title: `${blog.title} - HR Dashboard`,
    description: blog.subtitle,
  };
}

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const blog = getBlogPost(slug);
  
  if (!blog) {
    notFound();
  }

  // Helper function to process inline markdown formatting
  function processInlineFormatting(text: string): string {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  }

  // Main function to process markdown content
  function processMarkdown(content: string): string {
    const lines = content.split('\n');
    let html = '';
    let inTable = false;
    let tableRows: string[] = [];
    let inList = false;
    let listItems: string[] = [];
    let inReferences = false;
    let references: string[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      // Check if we're entering the references section
      if (line === '---' && i < lines.length - 1) {
        const nextLine = lines[i + 1];
        if (nextLine && nextLine.startsWith('[') && nextLine.includes(']:')) {
          inReferences = true;
          html += '<hr>';
          html += '<div class="references-section mt-16">';
          html += '<h3><span class="mr-3">📚</span>References & Sources</h3>';
          continue;
        }
      }
      
      // Also check if we're starting references directly (without separator)
              if (!inReferences && line.startsWith('[') && line.includes(']:')) {
          inReferences = true;
          html += '<div class="references-section mt-16">';
          html += '<h3><span class="mr-3">📚</span>References & Sources</h3>';
        }
      
      // Handle references section
      if (inReferences) {
        if (line === '') {
          continue;
        }
        
        // Check if this is a reference line [1]: url "title"
        const refMatch = line.match(/^\[(\d+)\]:\s*(.+?)(?:\s+"(.+?)")?$/);
        if (refMatch) {
          const [, number, url, title] = refMatch;
          const displayTitle = title || url;
          const cleanUrl = url.trim();
          
          references.push(`
            <div class="reference-item">
              <span class="reference-number">[${number}]</span>
              <a href="${cleanUrl}" target="_blank" rel="noopener noreferrer">
                ${displayTitle}
              </a>
            </div>
          `);
        } else {
          // If it's not a reference line, stop processing references
          inReferences = false;
          // Close the references section
          if (references.length > 0) {
            html += references.join('');
            html += '</div>';
            references = [];
          }
          // Process this line normally
          i--; // Go back one line to process it normally
        }
        continue;
      }
      
      // Skip empty lines
      if (line === '') {
        // Close any open lists or tables
        if (inList && listItems.length > 0) {
          html += `<ul>${listItems.join('')}</ul>`;
          listItems = [];
          inList = false;
        }
        if (inTable && tableRows.length > 0) {
          html += `<table>${tableRows.join('')}</table>`;
          tableRows = [];
          inTable = false;
        }
        continue;
      }
      
      // Handle headers
      if (line.startsWith('# ')) {
        const content = line.substring(2);
        html += `<h1>${processInlineFormatting(content)}</h1>`;
        continue;
      }
      if (line.startsWith('## ')) {
        const content = line.substring(3);
        html += `<h2>${processInlineFormatting(content)}</h2>`;
        continue;
      }
      if (line.startsWith('### ')) {
        const content = line.substring(4);
        html += `<h3>${processInlineFormatting(content)}</h3>`;
        continue;
      }
      if (line.startsWith('#### ')) {
        const content = line.substring(5);
        html += `<h4>${processInlineFormatting(content)}</h4>`;
        continue;
      }
      if (line.startsWith('##### ')) {
        const content = line.substring(6);
        html += `<h5>${processInlineFormatting(content)}</h5>`;
        continue;
      }
      if (line.startsWith('###### ')) {
        const content = line.substring(7);
        html += `<h6>${processInlineFormatting(content)}</h6>`;
        continue;
      }
      
      // Handle horizontal rules
      if (line === '---') {
        html += '<hr>';
        continue;
      }
      
      // Handle tables
      if (line.includes('|')) {
        if (!inTable) {
          inTable = true;
          tableRows = [];
        }
        
        // Skip separator lines (lines with only |, -, and spaces)
        if (line.match(/^[\s|:-]+$/)) {
          continue;
        }
        
        const cells = line.split('|').filter(cell => cell.trim() !== '');
        const rowHtml = cells.map(cell => 
          `<td>${processInlineFormatting(cell.trim())}</td>`
        ).join('');
        
        // First row is header
        if (tableRows.length === 0) {
          tableRows.push(`<thead><tr>${rowHtml.replace(/<td/g, '<th').replace(/<\/td>/g, '</th>')}</tr></thead><tbody>`);
        } else {
          tableRows.push(`<tr>${rowHtml}</tr>`);
        }
        continue;
      }
      
              // Close table if we were in one
        if (inTable) {
          html += `<table>${tableRows.join('')}</tbody></table>`;
          tableRows = [];
          inTable = false;
        }
      
      // Handle lists
      if (line.match(/^\s*[-*]\s/)) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        const content = line.replace(/^\s*[-*]\s/, '');
        listItems.push(`<li>${processInlineFormatting(content)}</li>`);
        continue;
      }
      
      // Handle numbered lists
      if (line.match(/^\s*\d+\.\s/)) {
        if (!inList) {
          inList = true;
          listItems = [];
        }
        const content = line.replace(/^\s*\d+\.\s/, '');
        listItems.push(`<li>${processInlineFormatting(content)}</li>`);
        continue;
      }
      
      // Close list if we were in one
      if (inList) {
        html += `<ul>${listItems.join('')}</ul>`;
        listItems = [];
        inList = false;
      }
      
      // Handle code blocks
      if (line.startsWith('```')) {
        // Skip code block markers
        continue;
      }
      
      // Handle paragraphs
      html += `<p>${processInlineFormatting(line)}</p>`;
    }
    
    // Close any remaining open structures
    if (inList && listItems.length > 0) {
      html += `<ul>${listItems.join('')}</ul>`;
    }
    if (inTable && tableRows.length > 0) {
      html += `<table>${tableRows.join('')}</tbody></table>`;
    }
    
    // Close references section and add references
    if (inReferences && references.length > 0) {
      html += references.join('');
      html += '</div>';
    }
    
    return html;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        {/* Back to Blogs */}
        <div className="mb-8">
          <Link
            href="/blogs"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Blogs
          </Link>
        </div>

        {/* Blog Header */}
        <header className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {blog.category}
            </span>
            <span className="text-sm text-gray-500">{blog.readTime}</span>
          </div>
          
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
            {blog.title}
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            {blog.subtitle}
          </p>
          
          <time className="text-gray-500">
            {new Date(blog.date).toLocaleDateString('en-US', { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </time>
        </header>

        {/* Blog Content */}
        <article className="max-w-none">
          <div 
            className="markdown-content"
            dangerouslySetInnerHTML={{ 
              __html: processMarkdown(blog.content)
            }}
          />
        </article>

        {/* Footer */}
        <footer className="mt-16 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <Link
              href="/blogs"
              className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <svg className="mr-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Blogs
            </Link>
            
            <div className="text-sm text-gray-500">
              Share this article
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
}
