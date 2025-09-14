'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionWithDetails, MaterialWithDetails } from '@/types/database';
import LatexRenderer from '@/components/LatexRenderer';
import { exportPaperToWord } from '@/lib/wordExport';

export default function PaperPreviewPage() {
  const router = useRouter();
  const [selectedQuestions, setSelectedQuestions] = useState<QuestionWithDetails[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<MaterialWithDetails[]>([]);
  const [paperTitle, setPaperTitle] = useState('生物竞赛试卷');
  const [paperSubtitle, setPaperSubtitle] = useState('');

  useEffect(() => {
    // 从localStorage获取选中的题目和材料题
    const questionsStored = localStorage.getItem('selectedQuestions');
    const materialsStored = localStorage.getItem('selectedMaterials');
    
    if (questionsStored) {
      try {
        const questions = JSON.parse(questionsStored);
        setSelectedQuestions(questions);
      } catch (error) {
        console.error('解析题目数据失败:', error);
      }
    }
    
    if (materialsStored) {
      try {
        const materials = JSON.parse(materialsStored);
        setSelectedMaterials(materials);
      } catch (error) {
        console.error('解析材料题数据失败:', error);
      }
    }
    
    if (!questionsStored && !materialsStored) {
      alert('没有找到选中的题目，请重新选择');
      router.push('/papers');
    }
  }, [router]);

  // 继续编辑
  const continueEditing = () => {
    router.push('/papers');
  };

  // 查看答案
  const viewAnswers = () => {
    router.push('/papers/answers');
  };

  // 导出Word
  const exportToWord = async () => {
    try {
      const buffer = await exportPaperToWord(selectedQuestions, selectedMaterials, paperTitle, paperSubtitle);
      
      // 创建Blob并下载
      const blob = new Blob([buffer], { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${paperTitle || '生物竞赛试卷'}.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      alert('试卷导出成功！');
    } catch (error) {
      console.error('导出失败:', error);
      alert('导出失败，请重试');
    }
  };

  // 打印试卷
  const printPaper = () => {
    window.print();
  };

  if (selectedQuestions.length === 0 && selectedMaterials.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题和操作按钮 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">试卷预览</h1>
            <p className="text-gray-600 mt-2">
              共 {selectedQuestions.length} 道题目
              {selectedMaterials.length > 0 && `，${selectedMaterials.length} 道材料题`}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={continueEditing}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              继续编辑
            </button>
            <button
              onClick={viewAnswers}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              查看答案
            </button>
            <button
              onClick={exportToWord}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              导出Word
            </button>
            <button
              onClick={printPaper}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              打印试卷
            </button>
          </div>
        </div>

        {/* 试卷设置 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">试卷设置</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">试卷标题</label>
              <input
                type="text"
                value={paperTitle}
                onChange={(e) => setPaperTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">副标题</label>
              <input
                type="text"
                value={paperSubtitle}
                onChange={(e) => setPaperSubtitle(e.target.value)}
                placeholder="如：2024年生物竞赛模拟试卷"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* 试卷内容 */}
        <div className="bg-white rounded-lg shadow-md p-8 print:p-12">
          {/* 试卷头部 */}
          <div className="text-center mb-12 print:mb-16">
            <h1 className="text-3xl font-bold text-gray-900 mb-4 print:text-4xl">
              {paperTitle}
            </h1>
            {paperSubtitle && (
              <p className="text-xl text-gray-600 print:text-2xl">
                {paperSubtitle}
              </p>
            )}
            <div className="mt-8 text-sm text-gray-500 print:text-base">
              <p>姓名：_______________ 班级：_______________ 学号：_______________</p>
              <p className="mt-2">考试时间：120分钟 总分：{(selectedQuestions.length + selectedMaterials.reduce((sum, m) => sum + (m.questions?.length || 0), 0)) * 10}分</p>
            </div>
          </div>

          {/* 题目列表 */}
          <div className="space-y-8 print:space-y-12">
            {/* 普通题目 */}
            {selectedQuestions.map((question, index) => (
              <div key={question.id} className="border-l-4 border-blue-500 pl-6 print:border-l-8 print:pl-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 text-sm font-medium rounded-full print:w-10 print:h-10 print:text-base">
                      {index + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded print:text-base">
                        {question.type_name}
                      </span>
                      <span className="text-sm text-gray-500 print:text-base">
                        ({10}分)
                      </span>
                    </div>
                    
                    <div className="text-lg font-medium text-gray-900 mb-4 print:text-xl print:leading-relaxed">
                      <LatexRenderer content={question.stem} />
                    </div>
                    
                    {question.options && question.options.length > 0 && (
                      <div className="space-y-2 print:space-y-3">
                        {question.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-start gap-3 print:gap-4">
                            <span className="font-medium text-gray-700 print:text-lg">
                              {option.opt_label}.
                            </span>
                            <span className="text-gray-700 print:text-lg">
                              <LatexRenderer content={option.opt_content} />
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* 答题区域 */}
                    <div className="mt-6 print:mt-8">
                      <div className="border-b border-gray-300 pb-2 print:pb-4">
                        <span className="text-sm font-medium text-gray-700 print:text-base">答案：</span>
                        <div className="mt-2 h-8 print:h-12 border-b border-dashed border-gray-400"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {/* 材料题 */}
            {selectedMaterials.map((material, materialIndex) => (
              <div key={`material-${material.id}`} className="border-l-4 border-orange-500 pl-6 print:border-l-8 print:pl-8">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0">
                    <span className="inline-flex items-center justify-center w-8 h-8 bg-orange-100 text-orange-800 text-sm font-medium rounded-full print:w-10 print:h-10 print:text-base">
                      {selectedQuestions.length + materialIndex + 1}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-3">
                      <span className="bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded print:text-base">
                        材料题
                      </span>
                      <span className="text-sm text-gray-500 print:text-base">
                        ({material.questions?.length || 0} 道小题)
                      </span>
                    </div>
                    
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 print:text-xl print:leading-relaxed">
                      {material.title || '材料题'}
                    </h3>
                    
                    <div 
                      className="text-gray-700 mb-6 print:text-lg print:leading-relaxed"
                      dangerouslySetInnerHTML={{ __html: material.content }}
                    />
                    
                    {/* 材料题的小题 */}
                    {material.questions && material.questions.length > 0 && (
                      <div className="space-y-6 print:space-y-8">
                        {material.questions.map((question, questionIndex) => (
                          <div key={question.id} className="ml-4 border-l-2 border-gray-300 pl-4 print:pl-6">
                            <div className="flex items-center gap-4 mb-3">
                              <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded print:text-base">
                                {question.type_name}
                              </span>
                              <span className="text-sm text-gray-500 print:text-base">
                                ({10}分)
                              </span>
                            </div>
                            
                            <div className="text-lg font-medium text-gray-900 mb-4 print:text-xl print:leading-relaxed">
                              <LatexRenderer content={question.stem} />
                            </div>
                            
                            {question.options && question.options.length > 0 && (
                              <div className="space-y-2 print:space-y-3">
                                {question.options.map((option, optIndex) => (
                                  <div key={optIndex} className="flex items-start gap-3 print:gap-4">
                                    <span className="font-medium print:text-lg">
                                      {option.opt_label}.
                                    </span>
                                    <span className="print:text-lg">
                                      <LatexRenderer content={option.opt_content} />
                                    </span>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {/* 答题区域 */}
                            <div className="mt-6 print:mt-8">
                              <div className="border-b border-gray-300 pb-2 print:pb-4">
                                <span className="text-sm font-medium text-gray-700 print:text-base">答案：</span>
                                <div className="mt-2 h-8 print:h-12 border-b border-dashed border-gray-400"></div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* 试卷尾部 */}
          <div className="mt-16 text-center print:mt-20">
            <p className="text-sm text-gray-500 print:text-base">
              —————— 试卷结束 ——————
            </p>
          </div>
        </div>
      </div>

      {/* 打印样式 */}
      <style jsx global>{`
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          .print\\:hidden {
            display: none !important;
          }
          .print\\:text-4xl {
            font-size: 2.25rem !important;
            line-height: 2.5rem !important;
          }
          .print\\:text-2xl {
            font-size: 1.5rem !important;
            line-height: 2rem !important;
          }
          .print\\:text-xl {
            font-size: 1.25rem !important;
            line-height: 1.75rem !important;
          }
          .print\\:text-lg {
            font-size: 1.125rem !important;
            line-height: 1.75rem !important;
          }
          .print\\:text-base {
            font-size: 1rem !important;
            line-height: 1.5rem !important;
          }
          .print\\:mb-16 {
            margin-bottom: 4rem !important;
          }
          .print\\:mb-8 {
            margin-bottom: 2rem !important;
          }
          .print\\:mt-8 {
            margin-top: 2rem !important;
          }
          .print\\:mt-20 {
            margin-top: 5rem !important;
          }
          .print\\:space-y-12 > * + * {
            margin-top: 3rem !important;
          }
          .print\\:space-y-3 > * + * {
            margin-top: 0.75rem !important;
          }
          .print\\:gap-4 {
            gap: 1rem !important;
          }
          .print\\:w-10 {
            width: 2.5rem !important;
          }
          .print\\:h-10 {
            height: 2.5rem !important;
          }
          .print\\:border-l-8 {
            border-left-width: 8px !important;
          }
          .print\\:pl-8 {
            padding-left: 2rem !important;
          }
          .print\\:pb-4 {
            padding-bottom: 1rem !important;
          }
          .print\\:h-12 {
            height: 3rem !important;
          }
        }
      `}</style>
    </div>
  );
}
