'use client';

import { InlineMath, BlockMath } from 'react-katex';
import 'katex/dist/katex.min.css';

interface LatexRendererProps {
  content: string;
  className?: string;
}

export default function LatexRenderer({ content, className = "" }: LatexRendererProps) {
  if (!content) return null;

  try {
    // 处理行内公式 $...$
    let processedContent = content.replace(/\$([^$]+)\$/g, (match, formula) => {
      return `<span class="inline-math">${formula}</span>`;
    });
    
    // 处理块级公式 \[...\] 或 $$...$$
    processedContent = processedContent.replace(/\$\$([^$]+)\$\$/g, (match, formula) => {
      return `<div class="block-math">${formula}</div>`;
    });
    
    processedContent = processedContent.replace(/\\\[([\s\S]*?)\\\]/g, (match, formula) => {
      return `<div class="block-math">${formula}</div>`;
    });
    
    return (
      <div className={`latex-content ${className}`}>
        {processedContent.split(/(<span class="inline-math">[\s\S]*?<\/span>|<div class="block-math">[\s\S]*?<\/div>)/).map((part, index) => {
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
    console.error('LaTeX渲染错误:', error);
    return <span className="text-red-500">LaTeX渲染错误</span>;
  }
}
