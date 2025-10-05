import { BookOpen } from 'lucide-react';

const ArticleViewer = ({ content, title }) => {
  return (
    <div className="mb-6">
      <div className="prose max-w-none bg-white p-6 rounded-lg border">
        <div className="flex items-center mb-4">
          <BookOpen className="w-5 h-5 text-gray-600 mr-2" />
          <h3 className="text-lg font-semibold">Article Content</h3>
        </div>
        <div 
          className="text-gray-700 leading-relaxed"
          dangerouslySetInnerHTML={{ 
            __html: content || 'No content available' 
          }}
        />
      </div>
    </div>
  );
};

export default ArticleViewer;