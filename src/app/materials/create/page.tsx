'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionType, Source, Tag, MaterialQuestionData } from '@/types/database';
import MaterialQuestionEditor from '@/components/MaterialQuestionEditor';

export default function CreateMaterialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [formData, setFormData] = useState<MaterialQuestionData>({
    material_id: undefined,
    is_material_question: true,
    material_content: '',
    material_title: '',
    material_source_id: undefined,
    questions: []
  });

  // 获取基础数据
  const fetchBaseData = async () => {
    try {
      const [typesRes, sourcesRes, tagsRes] = await Promise.all([
        fetch('/api/question-types'),
        fetch('/api/sources'),
        fetch('/api/tags')
      ]);

      const [typesResult, sourcesResult, tagsResult] = await Promise.all([
        typesRes.json(),
        sourcesRes.json(),
        tagsRes.json()
      ]);

      if (typesResult.success) setQuestionTypes(typesResult.data);
      if (sourcesResult.success) setSources(sourcesResult.data);
      if (tagsResult.success) setTags(tagsResult.data);
    } catch (error) {
      console.error('获取基础数据失败:', error);
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  // 处理表单提交
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.material_content?.trim()) {
      alert('请填写材料内容');
      return;
    }
    
    if (!formData.questions || formData.questions.length === 0) {
      alert('请至少添加一道小题');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/materials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: formData.material_title,
          content: formData.material_content,
          source_id: formData.material_source_id,
          questions: formData.questions
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('材料题创建成功');
        router.push('/materials');
      } else {
        alert('创建失败: ' + result.error);
      }
    } catch (error) {
      console.error('创建材料题失败:', error);
      alert('创建失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">创建材料题</h1>
          <p className="text-gray-600 mt-2">填写材料内容和相关小题，支持多种题型和标签分类</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <MaterialQuestionEditor
            formData={formData}
            setFormData={setFormData}
            questionTypes={questionTypes}
            sources={sources}
            tags={tags}
            loading={loading}
          />

          {/* 提交按钮 */}
          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? '创建中...' : '创建材料题'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
