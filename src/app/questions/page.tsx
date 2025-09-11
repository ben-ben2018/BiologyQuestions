'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { QuestionWithDetails, QuestionType, Source, Tag, QuestionQueryParams } from '@/types/database';

export default function QuestionsPage() {
  const [questions, setQuestions] = useState<QuestionWithDetails[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useState<QuestionQueryParams>({
    page: 1,
    pageSize: 10,
    search: '',
    type_id: undefined,
    source_id: undefined,
    tag_ids: []
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  // 获取题目列表
  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchParams.page) params.append('page', searchParams.page.toString());
      if (searchParams.pageSize) params.append('pageSize', searchParams.pageSize.toString());
      if (searchParams.search) params.append('search', searchParams.search);
      if (searchParams.type_id) params.append('type_id', searchParams.type_id.toString());
      if (searchParams.source_id) params.append('source_id', searchParams.source_id.toString());
      if (searchParams.tag_ids && searchParams.tag_ids.length > 0) {
        params.append('tag_ids', searchParams.tag_ids.join(','));
      }

      const response = await fetch(`/api/questions?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setQuestions(result.data.questions);
        setPagination(result.data.pagination);
      } else {
        console.error('获取题目列表失败:', result.error);
      }
    } catch (error) {
      console.error('获取题目列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

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

  // 删除题目
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这道题目吗？')) return;

    try {
      const response = await fetch(`/api/questions/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        alert('题目删除成功');
        fetchQuestions();
      } else {
        alert('删除失败: ' + result.error);
      }
    } catch (error) {
      console.error('删除题目失败:', error);
      alert('删除失败');
    }
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    fetchQuestions();
  }, [searchParams]);

  const handleSearchChange = (field: keyof QuestionQueryParams, value: any) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value,
      page: 1 // 重置到第一页
    }));
  };

  const handlePageChange = (page: number) => {
    setSearchParams(prev => ({ ...prev, page }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">题目管理</h1>
            <p className="text-gray-600 mt-2">管理生物竞赛题目，支持多种题型和标签分类</p>
          </div>
          <Link
            href="/questions/create"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            创建题目
          </Link>
        </div>

        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 搜索框 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
              <input
                type="text"
                placeholder="搜索题干、答案、解析..."
                value={searchParams.search || ''}
                onChange={(e) => handleSearchChange('search', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* 题型筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">题型</label>
              <select
                value={searchParams.type_id || ''}
                onChange={(e) => handleSearchChange('type_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部题型</option>
                {questionTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.type_name}</option>
                ))}
              </select>
            </div>

            {/* 来源筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">来源</label>
              <select
                value={searchParams.source_id || ''}
                onChange={(e) => handleSearchChange('source_id', e.target.value ? parseInt(e.target.value) : undefined)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">全部来源</option>
                {sources.map(source => (
                  <option key={source.id} value={source.id}>{source.source_name}</option>
                ))}
              </select>
            </div>

            {/* 标签筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
              <select
                multiple
                value={searchParams.tag_ids || []}
                onChange={(e) => {
                  const selectedTags = Array.from(e.target.selectedOptions, option => parseInt(option.value));
                  handleSearchChange('tag_ids', selectedTags);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {tags.map(tag => (
                  <option key={tag.id} value={tag.id}>{tag.tag_name}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 题目列表 */}
        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : questions.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              暂无题目数据
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {questions.map((question) => (
                <div key={question.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                          {question.type_name}
                        </span>
                        {question.source_name && (
                          <span className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded">
                            {question.source_name}
                          </span>
                        )}
                        <span className="text-sm text-gray-500">
                          {new Date(question.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                        {question.stem}
                      </h3>
                      
                      {question.tags && question.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                          {question.tags.map(tag => (
                            <span key={tag.id} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                              {tag.tag_name}
                            </span>
                          ))}
                        </div>
                      )}

                      {question.options && question.options.length > 0 && (
                        <div className="text-sm text-gray-600">
                          <p className="font-medium mb-1">选项：</p>
                          <div className="space-y-1">
                            {question.options.map((option, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="font-medium">{option.opt_label}.</span>
                                <span className={option.is_correct ? 'text-green-600 font-medium' : ''}>
                                  {option.opt_content}
                                </span>
                                {option.is_correct && (
                                  <span className="text-green-600 text-xs">✓</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <Link
                        href={`/questions/${question.id}/edit`}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(question.id)}
                        className="text-red-600 hover:text-red-800 text-sm"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* 分页 */}
          {pagination.totalPages > 1 && (
            <div className="px-6 py-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  显示第 {(pagination.page - 1) * pagination.pageSize + 1} 到{' '}
                  {Math.min(pagination.page * pagination.pageSize, pagination.total)} 条，
                  共 {pagination.total} 条
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    上一页
                  </button>
                  <span className="px-3 py-2 text-sm">
                    第 {pagination.page} 页，共 {pagination.totalPages} 页
                  </span>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.totalPages}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    下一页
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
