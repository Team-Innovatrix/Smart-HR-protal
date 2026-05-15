'use client';

import Link from 'next/link';
import { useState, useMemo } from 'react';
import { BlogPost } from '@/lib/blogUtils';

// Simple date formatter — no timezone context needed on public pages
function formatBlogDate(dateString: string): string {
  if (!dateString || dateString === 'Invalid Date') return ''
  try {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric', month: 'long', day: 'numeric'
    })
  } catch {
    return ''
  }
}

interface BlogFiltersProps {
  blogs: BlogPost[];
}

export default function BlogFilters({ blogs }: BlogFiltersProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Define available categories
  const categories = ['All', 'Business', 'Technology', 'Backend', 'Frontend', 'HR', 'AI'];
  
  // Filter blogs based on selected category
  const filteredBlogs = useMemo(() => {
    if (selectedCategory === 'All') {
      return blogs;
    }
    return blogs.filter(blog => blog.category === selectedCategory);
  }, [blogs, selectedCategory]);

  return (
    <>
      {/* Category Filter Tags */}
      <div className="flex flex-wrap justify-center gap-3 mb-12">
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
              selectedCategory === category
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200 hover:border-gray-300'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Blog Grid */}
      {filteredBlogs.length > 0 ? (
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {filteredBlogs.map((blog) => (
            <article
              key={blog.slug}
              className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100"
            >
              <div className="p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                    {blog.category}
                  </span>
                  <span className="text-sm text-gray-500">{blog.readTime}</span>
                </div>
                
                <h2 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                  {blog.title}
                </h2>
                
                <p className="text-gray-600 mb-6 line-clamp-3">
                  {blog.subtitle}
                </p>
                
                <div className="flex items-center justify-between">
                  <time className="text-sm text-gray-500">
                    {formatBlogDate(blog.date)}
                  </time>
                  
                  <Link
                    href={`/blogs/${blog.slug}`}
                    className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Read more
                    <svg className="ml-2 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {selectedCategory === 'All' ? 'No blogs found' : `No blogs in ${selectedCategory} category`}
            </h3>
            <p className="text-gray-500">
              {selectedCategory === 'All' 
                ? 'Check the docs/blogs folder for markdown files.'
                : 'Try selecting a different category or check back later.'
              }
            </p>
          </div>
        </div>
      )}
    </>
  );
}
