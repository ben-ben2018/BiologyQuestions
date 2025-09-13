'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionType, Source, Tag, CreateQuestionData } from '@/types/database';
import LatexEditor from '@/components/LatexEditor';

export default function CreateQuestionPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  
  const [formData, setFormData] = useState<CreateQuestionData>({
    type_id: 0,
    stem: '',
    answer: '',
    explanation: '',
    source_id: undefined,
    options: [],
    tag_ids: []
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
    
    if (!formData.type_id || !formData.stem.trim()) {
      alert('请填写必填项');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('题目创建成功');
        router.push('/questions');
      } else {
        alert('创建失败: ' + result.error);
      }
    } catch (error) {
      console.error('创建题目失败:', error);
      alert('创建失败');
    } finally {
      setLoading(false);
    }
  };

  // 添加选项
  const addOption = () => {
    const newOption = {
      opt_label: String.fromCharCode(65 + (formData.options?.length || 0)), // A, B, C, D...
      opt_content: '',
      is_correct: false,
      sort_order: (formData.options?.length || 0) + 1
    };
    
    setFormData(prev => ({
      ...prev,
      options: [...(prev.options || []), newOption]
    }));
  };

  // 更新选项
  const updateOption = (index: number, field: keyof typeof formData.options[0], value: any) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      ) || []
    }));
  };

  // 删除选项
  const removeOption = (index: number) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options?.filter((_, i) => i !== index) || []
    }));
  };

  // 处理标签选择
  const handleTagChange = (tagId: number, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      tag_ids: checked 
        ? [...(prev.tag_ids || []), tagId]
        : (prev.tag_ids || []).filter(id => id !== tagId)
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">创建题目</h1>
          <p className="text-gray-600 mt-2">填写题目信息，支持多种题型和标签分类</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">基本信息</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 题型 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  题型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.type_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, type_id: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value={0}>请选择题型</option>
                  {questionTypes.map(type => (
                    <option key={type.id} value={type.id}>{type.type_name}</option>
                  ))}
                </select>
              </div>

              {/* 来源 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">来源</label>
                <select
                  value={formData.source_id || ''}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    source_id: e.target.value ? parseInt(e.target.value) : undefined 
                  }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">请选择来源</option>
                  {sources.map(source => (
                    <option key={source.id} value={source.id}>{source.source_name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* 题干 */}
            <div className="mt-6">
              <LatexEditor
                value={formData.stem}
                onChange={(value) => setFormData(prev => ({ ...prev, stem: value }))}
                placeholder="请输入题目内容，支持LaTeX公式..."
                rows={4}
                label="题干"
                required
              />
            </div>

            {/* 答案 */}
            <div className="mt-6">
              <LatexEditor
                value={formData.answer || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, answer: value }))}
                placeholder="请输入答案，支持LaTeX公式..."
                rows={3}
                label="答案"
              />
            </div>

            {/* 解析 */}
            <div className="mt-6">
              <LatexEditor
                value={formData.explanation || ''}
                onChange={(value) => setFormData(prev => ({ ...prev, explanation: value }))}
                placeholder="请输入题目解析，支持LaTeX公式..."
                rows={4}
                label="解析"
              />
            </div>
          </div>

          {/* 选项 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">选项</h2>
              <button
                type="button"
                onClick={addOption}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                添加选项
              </button>
            </div>

            {formData.options && formData.options.length > 0 ? (
              <div className="space-y-4">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                    <div className="flex-shrink-0">
                      <span className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded">
                        {option.opt_label}
                      </span>
                    </div>
                    <div className="flex-1">
                      <LatexEditor
                        value={option.opt_content}
                        onChange={(value) => updateOption(index, 'opt_content', value)}
                        placeholder="请输入选项内容，支持LaTeX公式..."
                        rows={2}
                        className="mb-0"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={option.is_correct}
                          onChange={(e) => updateOption(index, 'is_correct', e.target.checked)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">正确答案</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">暂无选项，点击"添加选项"按钮添加</p>
            )}
          </div>

          {/* 标签 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">标签</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {tags.map(tag => (
                <label key={tag.id} className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.tag_ids?.includes(tag.id) || false}
                    onChange={(e) => handleTagChange(tag.id, e.target.checked)}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">{tag.tag_name}</span>
                </label>
              ))}
            </div>
            {tags.length === 0 && (
              <p className="text-gray-500 text-center py-4">暂无标签，请先创建标签</p>
            )}
          </div>

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
              {loading ? '创建中...' : '创建题目'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
