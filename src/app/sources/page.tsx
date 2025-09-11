'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Source } from '@/types/database';

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingSource, setEditingSource] = useState<Source | null>(null);
  const [formData, setFormData] = useState({ source_name: '' });

  // 获取来源列表
  const fetchSources = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/sources?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setSources(result.data);
      } else {
        console.error('获取来源列表失败:', result.error);
      }
    } catch (error) {
      console.error('获取来源列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建来源
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.source_name.trim()) {
      alert('请输入来源名称');
      return;
    }

    try {
      const response = await fetch('/api/sources', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('来源创建成功');
        setFormData({ source_name: '' });
        setShowCreateForm(false);
        fetchSources();
      } else {
        alert('创建失败: ' + result.error);
      }
    } catch (error) {
      console.error('创建来源失败:', error);
      alert('创建失败');
    }
  };

  // 更新来源
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.source_name.trim()) {
      alert('请输入来源名称');
      return;
    }

    if (!editingSource) return;

    try {
      const response = await fetch(`/api/sources/${editingSource.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('来源更新成功');
        setFormData({ source_name: '' });
        setEditingSource(null);
        fetchSources();
      } else {
        alert('更新失败: ' + result.error);
      }
    } catch (error) {
      console.error('更新来源失败:', error);
      alert('更新失败');
    }
  };

  // 删除来源
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个来源吗？')) return;

    try {
      const response = await fetch(`/api/sources/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        alert('来源删除成功');
        fetchSources();
      } else {
        alert('删除失败: ' + result.error);
      }
    } catch (error) {
      console.error('删除来源失败:', error);
      alert('删除失败');
    }
  };

  // 开始编辑
  const startEdit = (source: Source) => {
    setEditingSource(source);
    setFormData({ source_name: source.source_name });
    setShowCreateForm(false);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingSource(null);
    setFormData({ source_name: '' });
  };

  // 取消创建
  const cancelCreate = () => {
    setShowCreateForm(false);
    setFormData({ source_name: '' });
  };

  useEffect(() => {
    fetchSources();
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">来源管理</h1>
            <p className="text-gray-600 mt-2">管理题目来源，如真题、自编题等</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors"
          >
            创建来源
          </button>
        </div>

        {/* 搜索框 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">搜索来源</label>
            <input
              type="text"
              placeholder="输入来源名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 创建/编辑表单 */}
        {(showCreateForm || editingSource) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingSource ? '编辑来源' : '创建来源'}
            </h2>
            <form onSubmit={editingSource ? handleUpdate : handleCreate}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="请输入来源名称..."
                    value={formData.source_name}
                    onChange={(e) => setFormData({ source_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    {editingSource ? '更新' : '创建'}
                  </button>
                  <button
                    type="button"
                    onClick={editingSource ? cancelEdit : cancelCreate}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 来源列表 */}
        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : sources.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? '没有找到匹配的来源' : '暂无来源数据'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {sources.map((source) => (
                <div key={source.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{source.source_name}</h3>
                      <p className="text-sm text-gray-500">
                        创建时间: {new Date(source.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(source)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(source.id)}
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
        </div>

        {/* 返回按钮 */}
        <div className="mt-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-800"
          >
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            返回首页
          </Link>
        </div>
      </div>
    </div>
  );
}
