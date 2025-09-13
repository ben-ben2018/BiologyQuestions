'use client';

import { useState, useEffect } from 'react';
import { QuestionType, Source, Tag, MaterialQuestionData, CreateQuestionData } from '@/types/database';
import LatexEditor from '@/components/LatexEditor';

interface MaterialQuestionEditorProps {
  formData: MaterialQuestionData;
  setFormData: (data: MaterialQuestionData) => void;
  questionTypes: QuestionType[];
  sources: Source[];
  tags: Tag[];
  loading: boolean;
}

export default function MaterialQuestionEditor({
  formData,
  setFormData,
  questionTypes,
  sources,
  tags,
  loading
}: MaterialQuestionEditorProps) {
  // 添加小题
  const addQuestion = () => {
    const newQuestion: CreateQuestionData = {
      type_id: 0,
      stem: '',
      answer: '',
      explanation: '',
      source_id: undefined,
      options: [],
      tag_ids: []
    };
    
    setFormData(prev => ({
      ...prev,
      questions: [...(prev.questions || []), newQuestion]
    }));
  };

  // 更新小题
  const updateQuestion = (index: number, field: keyof CreateQuestionData, value: any) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions?.map((question, i) => 
        i === index ? { ...question, [field]: value } : question
      ) || []
    }));
  };

  // 删除小题
  const removeQuestion = (index: number) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions?.filter((_, i) => i !== index) || []
    }));
  };

  // 添加选项
  const addOption = (questionIndex: number) => {
    const question = formData.questions?.[questionIndex];
    if (!question) return;

    const newOption = {
      opt_label: String.fromCharCode(65 + (question.options?.length || 0)),
      opt_content: '',
      is_correct: false,
      sort_order: (question.options?.length || 0) + 1
    };
    
    updateQuestion(questionIndex, 'options', [...(question.options || []), newOption]);
  };

  // 更新选项
  const updateOption = (questionIndex: number, optionIndex: number, field: string, value: any) => {
    const question = formData.questions?.[questionIndex];
    if (!question) return;

    const newOptions = question.options?.map((option, i) => 
      i === optionIndex ? { ...option, [field]: value } : option
    ) || [];

    updateQuestion(questionIndex, 'options', newOptions);
  };

  // 删除选项
  const removeOption = (questionIndex: number, optionIndex: number) => {
    const question = formData.questions?.[questionIndex];
    if (!question) return;

    const newOptions = question.options?.filter((_, i) => i !== optionIndex) || [];
    updateQuestion(questionIndex, 'options', newOptions);
  };

  // 处理标签选择
  const handleTagChange = (questionIndex: number, tagId: number, checked: boolean) => {
    const question = formData.questions?.[questionIndex];
    if (!question) return;

    const newTagIds = checked 
      ? [...(question.tag_ids || []), tagId]
      : (question.tag_ids || []).filter(id => id !== tagId);

    updateQuestion(questionIndex, 'tag_ids', newTagIds);
  };

  return (
    <div className="space-y-6">
      {/* 材料内容 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">材料内容</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* 材料标题 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">材料标题</label>
            <input
              type="text"
              value={formData.material_title || ''}
              onChange={(e) => setFormData(prev => ({ ...prev, material_title: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="请输入材料标题（可选）"
            />
          </div>

          {/* 材料来源 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">材料来源</label>
            <select
              value={formData.material_source_id || ''}
              onChange={(e) => setFormData(prev => ({ 
                ...prev, 
                material_source_id: e.target.value ? parseInt(e.target.value) : undefined 
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

        {/* 材料内容 */}
        <div>
          <LatexEditor
            value={formData.material_content || ''}
            onChange={(value) => setFormData(prev => ({ ...prev, material_content: value }))}
            placeholder="请输入材料内容，支持LaTeX公式和HTML..."
            rows={6}
            label="材料内容"
            required
          />
        </div>
      </div>

      {/* 小题列表 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">小题列表</h2>
          <button
            type="button"
            onClick={addQuestion}
            disabled={loading}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            添加小题
          </button>
        </div>

        {formData.questions && formData.questions.length > 0 ? (
          <div className="space-y-6">
            {formData.questions.map((question, questionIndex) => (
              <div key={questionIndex} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    第 {questionIndex + 1} 题
                  </h3>
                  <button
                    type="button"
                    onClick={() => removeQuestion(questionIndex)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                  >
                    删除小题
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {/* 题型 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      题型 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={question.type_id}
                      onChange={(e) => updateQuestion(questionIndex, 'type_id', parseInt(e.target.value))}
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
                      value={question.source_id || ''}
                      onChange={(e) => updateQuestion(questionIndex, 'source_id', e.target.value ? parseInt(e.target.value) : undefined)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">请选择来源</option>
                      {sources.map(source => (
                        <option key={source.id} value={source.id}>{source.source_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 小题题干 */}
                <div className="mb-4">
                  <LatexEditor
                    value={question.stem}
                    onChange={(value) => updateQuestion(questionIndex, 'stem', value)}
                    placeholder="请输入小题题干，支持LaTeX公式..."
                    rows={3}
                    label="小题题干"
                    required
                  />
                </div>

                {/* 答案 */}
                <div className="mb-4">
                  <LatexEditor
                    value={question.answer || ''}
                    onChange={(value) => updateQuestion(questionIndex, 'answer', value)}
                    placeholder="请输入答案，支持LaTeX公式..."
                    rows={2}
                    label="答案"
                  />
                </div>

                {/* 解析 */}
                <div className="mb-4">
                  <LatexEditor
                    value={question.explanation || ''}
                    onChange={(value) => updateQuestion(questionIndex, 'explanation', value)}
                    placeholder="请输入题目解析，支持LaTeX公式..."
                    rows={3}
                    label="解析"
                  />
                </div>

                {/* 选项 */}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">选项</label>
                    <button
                      type="button"
                      onClick={() => addOption(questionIndex)}
                      disabled={loading}
                      className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                    >
                      添加选项
                    </button>
                  </div>

                  {question.options && question.options.length > 0 ? (
                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => (
                        <div key={optionIndex} className="flex items-center gap-2 p-2 border border-gray-200 rounded">
                          <span className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded min-w-[2rem] text-center">
                            {option.opt_label}
                          </span>
                          <div className="flex-1">
                            <LatexEditor
                              value={option.opt_content}
                              onChange={(value) => updateOption(questionIndex, optionIndex, 'opt_content', value)}
                              placeholder="请输入选项内容..."
                              rows={1}
                              className="mb-0"
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <label className="flex items-center">
                              <input
                                type="checkbox"
                                checked={option.is_correct}
                                onChange={(e) => updateOption(questionIndex, optionIndex, 'is_correct', e.target.checked)}
                                className="mr-1"
                              />
                              <span className="text-xs text-gray-700">正确</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => removeOption(questionIndex, optionIndex)}
                              disabled={loading}
                              className="text-red-600 hover:text-red-800 text-xs disabled:opacity-50"
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-sm">暂无选项，点击"添加选项"按钮添加</p>
                  )}
                </div>

                {/* 标签 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                    {tags.map(tag => (
                      <label key={tag.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={question.tag_ids?.includes(tag.id) || false}
                          onChange={(e) => handleTagChange(questionIndex, tag.id, e.target.checked)}
                          className="mr-1"
                        />
                        <span className="text-xs text-gray-700">{tag.tag_name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center py-8">暂无小题，点击"添加小题"按钮添加</p>
        )}
      </div>
    </div>
  );
}
