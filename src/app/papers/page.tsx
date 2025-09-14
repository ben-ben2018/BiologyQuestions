'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { QuestionWithDetails, QuestionType, Source, Tag, QuestionQueryParams, MaterialWithDetails } from '@/types/database';
import LatexRenderer from '@/components/LatexRenderer';

interface SelectedQuestion extends QuestionWithDetails {
  selected: boolean;
}

interface SelectedMaterial extends MaterialWithDetails {
  selected: boolean;
}

export default function PapersPage() {
  const router = useRouter();
  const [questions, setQuestions] = useState<SelectedQuestion[]>([]);
  const [materials, setMaterials] = useState<SelectedMaterial[]>([]);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([]);
  const [sources, setSources] = useState<Source[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'questions' | 'materials'>('questions');
  const [searchParams, setSearchParams] = useState<QuestionQueryParams>({
    page: 1,
    pageSize: 20,
    search: '',
    type_id: undefined,
    source_id: undefined,
    tag_ids: []
  });
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });
  const [selectedQuestions, setSelectedQuestions] = useState<SelectedQuestion[]>([]);
  const [selectedMaterials, setSelectedMaterials] = useState<SelectedMaterial[]>([]);

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
        // 保持已选择的题目状态
        const questionsWithSelection = result.data.questions.map((q: QuestionWithDetails) => {
          const existingQuestion = questions.find(existing => existing.id === q.id);
          return {
            ...q,
            selected: existingQuestion ? existingQuestion.selected : false
          };
        });
        setQuestions(questionsWithSelection);
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

  // 获取材料题列表
  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      
      if (searchParams.page) params.append('page', searchParams.page.toString());
      if (searchParams.pageSize) params.append('pageSize', searchParams.pageSize.toString());

      const response = await fetch(`/api/materials?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        // 保持已选择的材料题状态
        const materialsWithSelection = result.data.materials.map((m: MaterialWithDetails) => {
          const existingMaterial = materials.find(existing => existing.id === m.id);
          return {
            ...m,
            selected: existingMaterial ? existingMaterial.selected : false
          };
        });
        setMaterials(materialsWithSelection);
        setPagination(result.data.pagination);
      } else {
        console.error('获取材料题列表失败:', result.error);
      }
    } catch (error) {
      console.error('获取材料题列表失败:', error);
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

  // 切换题目选择状态
  const toggleQuestionSelection = (questionId: number) => {
    setQuestions(prev => prev.map(q => 
      q.id === questionId ? { ...q, selected: !q.selected } : q
    ));
  };

  // 切换材料题选择状态
  const toggleMaterialSelection = (materialId: number) => {
    setMaterials(prev => prev.map(m => 
      m.id === materialId ? { ...m, selected: !m.selected } : m
    ));
  };

  // 全选/取消全选当前页
  const toggleSelectAll = () => {
    if (activeTab === 'questions') {
      const allSelected = questions.every(q => q.selected);
      setQuestions(prev => prev.map(q => ({ ...q, selected: !allSelected })));
    } else {
      const allSelected = materials.every(m => m.selected);
      setMaterials(prev => prev.map(m => ({ ...m, selected: !allSelected })));
    }
  };

  // 更新已选题目和材料题列表
  useEffect(() => {
    const selectedQ = questions.filter(q => q.selected);
    setSelectedQuestions(selectedQ);
    
    const selectedM = materials.filter(m => m.selected);
    setSelectedMaterials(selectedM);
  }, [questions, materials]);

  // 清空选择
  const clearSelection = () => {
    setQuestions(prev => prev.map(q => ({ ...q, selected: false })));
    setMaterials(prev => prev.map(m => ({ ...m, selected: false })));
  };

  // 预览试卷
  const previewPaper = () => {
    if (selectedQuestions.length === 0 && selectedMaterials.length === 0) {
      alert('请先选择题目或材料题');
      return;
    }
    
    // 保存选中的题目和材料题到localStorage
    localStorage.setItem('selectedQuestions', JSON.stringify(selectedQuestions));
    localStorage.setItem('selectedMaterials', JSON.stringify(selectedMaterials));
    router.push('/papers/preview');
  };

  useEffect(() => {
    fetchBaseData();
  }, []);

  useEffect(() => {
    if (activeTab === 'questions') {
      fetchQuestions();
    } else {
      fetchMaterials();
    }
  }, [searchParams]);

  // 切换标签页时，如果数据为空则获取数据
  useEffect(() => {
    if (activeTab === 'questions' && questions.length === 0) {
      fetchQuestions();
    } else if (activeTab === 'materials' && materials.length === 0) {
      fetchMaterials();
    }
  }, [activeTab]);

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
            <h1 className="text-3xl font-bold text-gray-900">组卷</h1>
            <p className="text-gray-600 mt-2">选择题目和材料题组成试卷，支持预览和导出</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={clearSelection}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              清空选择
            </button>
            <button
              onClick={previewPaper}
              disabled={selectedQuestions.length === 0 && selectedMaterials.length === 0}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              预览试卷 ({selectedQuestions.length + selectedMaterials.length})
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="mb-6">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('questions')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'questions'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                普通题目 ({questions.length})
              </button>
              <button
                onClick={() => setActiveTab('materials')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'materials'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                材料题 ({materials.length})
              </button>
            </nav>
          </div>
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

        {/* 题目/材料题列表 */}
        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : activeTab === 'questions' ? (
            questions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                暂无题目数据
              </div>
            ) : (
              <>
                {/* 全选控制 */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={questions.length > 0 && questions.every(q => q.selected)}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      全选当前页 ({questions.filter(q => q.selected).length}/{questions.length})
                    </span>
                  </label>
                </div>

                <div className="divide-y divide-gray-200">
                  {questions.map((question) => (
                    <div key={question.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={question.selected}
                          onChange={() => toggleQuestionSelection(question.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                        />
                        
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
                          
                          <div className="text-lg font-medium text-gray-900 mb-2 line-clamp-2">
                            <LatexRenderer content={question.stem} />
                          </div>
                          
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
                                      <LatexRenderer content={option.opt_content} />
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
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
          ) : (
            materials.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                暂无材料题数据
              </div>
            ) : (
              <>
                {/* 全选控制 */}
                <div className="px-6 py-4 border-b border-gray-200">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={materials.length > 0 && materials.every(m => m.selected)}
                      onChange={toggleSelectAll}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      全选当前页 ({materials.filter(m => m.selected).length}/{materials.length})
                    </span>
                  </label>
                </div>

                <div className="divide-y divide-gray-200">
                  {materials.map((material) => (
                    <div key={material.id} className="p-6 hover:bg-gray-50">
                      <div className="flex items-start gap-4">
                        <input
                          type="checkbox"
                          checked={material.selected}
                          onChange={() => toggleMaterialSelection(material.id)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mt-1"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <span className="bg-orange-100 text-orange-800 text-sm px-2 py-1 rounded">
                              材料题
                            </span>
                            <span className="bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                              {material.questions?.length || 0} 道小题
                            </span>
                            {material.source_name && (
                              <span className="bg-gray-100 text-gray-800 text-sm px-2 py-1 rounded">
                                {material.source_name}
                              </span>
                            )}
                            <span className="text-sm text-gray-500">
                              {new Date(material.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">
                            {material.title || '无标题'}
                          </h3>
                          
                          <div 
                            className="text-gray-700 mb-4 line-clamp-3"
                            dangerouslySetInnerHTML={{ __html: material.content }}
                          />
                          
                          {material.questions && material.questions.length > 0 && (
                            <div className="text-sm text-gray-600">
                              <p className="font-medium mb-2">包含小题：</p>
                              <div className="space-y-1">
                                {material.questions.map((question, index) => (
                                  <div key={index} className="flex items-center gap-2">
                                    <span className="font-medium">{index + 1}.</span>
                                    <span className="text-gray-700 line-clamp-1">
                                      <LatexRenderer content={question.stem} />
                                    </span>
                                    <span className="bg-gray-100 text-gray-600 text-xs px-1 py-0.5 rounded">
                                      {question.type_name}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )
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
