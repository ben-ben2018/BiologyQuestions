'use client';

import { useState } from 'react';
import 'katex/dist/katex.min.css';
import { InlineMath, BlockMath } from 'react-katex';

interface LatexEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
  label?: string;
  required?: boolean;
}

export default function LatexEditor({
  value,
  onChange,
  placeholder = "请输入内容，支持LaTeX公式...",
  rows = 4,
  className = "",
  label,
  required = false
}: LatexEditorProps) {
  const [isPreview, setIsPreview] = useState(false);

  // 渲染LaTeX内容
  const renderLatexContent = (text: string) => {
    if (!text) return <span className="text-gray-400">{placeholder}</span>;
    
    try {
      // 处理行内公式 $...$
      let processedText = text.replace(/\$([^$]+)\$/g, (match, formula) => {
        return `<span class="inline-math">${formula}</span>`;
      });
      
      // 处理块级公式 \[...\] 或 $$...$$
      processedText = processedText.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
        return `<div class="block-math">${formula}</div>`;
      });
      
      processedText = processedText.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
        return `<div class="block-math">${formula}</div>`;
      });
      
      return (
        <div className="latex-preview">
          {processedText.split(/(<span class="inline-math">[\s\S]*?<\/span>|<div class="block-math">[\s\S]*?<\/div>)/).map((part, index) => {
            if (part.startsWith('<span class="inline-math">')) {
              const formula = part.replace(/<\/?span[^>]*>/g, '');
              return (
                <InlineMath key={index} math={formula} />
              );
            } else if (part.startsWith('<div class="block-math">')) {
              const formula = part.replace(/<\/?div[^>]*>/g, '');
              return (
                <BlockMath key={index} math={formula} />
              );
            } else {
              return <span key={index}>{part}</span>;
            }
          })}
        </div>
      );
    } catch (error) {
      return <span className="text-red-500">LaTeX渲染错误</span>;
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const togglePreview = () => {
    setIsPreview(!isPreview);
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      
      <div className="border border-gray-300 rounded-lg overflow-hidden">
        {/* 工具栏 */}
        <div className="bg-gray-50 px-3 py-2 border-b border-gray-300 flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={togglePreview}
              className={`px-3 py-1 text-sm rounded ${
                isPreview 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {isPreview ? '编辑' : '预览'}
            </button>
            <div className="text-xs text-gray-500">
              支持LaTeX公式：$x^2$ 或 $$x^2$$
            </div>
          </div>
        </div>
        
        {/* 编辑器内容 */}
        <div className="relative">
          {isPreview ? (
            <div className="p-3 min-h-[120px] bg-white">
              {renderLatexContent(value)}
            </div>
          ) : (
            <textarea
              value={value}
              onChange={handleTextareaChange}
              rows={rows}
              className="w-full px-3 py-2 border-0 focus:ring-0 focus:outline-none resize-none"
              placeholder={placeholder}
              required={required}
            />
          )}
        </div>
      </div>
      
      {/* LaTeX语法提示 */}
      <div className="text-xs text-gray-500">
        <div className="font-medium mb-1">LaTeX语法提示：</div>
        <div className="space-y-1">
          <div>• 行内公式：<code className="bg-gray-100 px-1 rounded">$x^2 + y^2 = z^2$</code></div>
          <div>• 块级公式：<code className="bg-gray-100 px-1 rounded">$$x^2 + y^2 = z^2$$</code></div>
          <div>• 化学公式：<code className="bg-gray-100 px-1 rounded">$H_2SO_4 + 2NaOH \rightarrow Na_2SO_4 + 2H_2O$</code></div>
          <div>• 分数：<code className="bg-gray-100 px-1 rounded">$\frac{'a'}{'b'}$</code></div>
          <div>• 根号：<code className="bg-gray-100 px-1 rounded">$\sqrt{'x'}$</code></div>
        </div>
      </div>
    </div>
  );
}
