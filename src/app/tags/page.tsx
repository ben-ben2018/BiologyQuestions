'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Tag } from '@/types/database';

export default function TagsPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ tag_name: '' });

  // 获取标签列表
  const fetchTags = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) {
        params.append('search', searchTerm);
      }
      
      const response = await fetch(`/api/tags?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setTags(result.data);
      } else {
        console.error('获取标签列表失败:', result.error);
      }
    } catch (error) {
      console.error('获取标签列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 创建标签
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tag_name.trim()) {
      alert('请输入标签名称');
      return;
    }

    try {
      const response = await fetch('/api/tags', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('标签创建成功');
        setFormData({ tag_name: '' });
        setShowCreateForm(false);
        fetchTags();
      } else {
        alert('创建失败: ' + result.error);
      }
    } catch (error) {
      console.error('创建标签失败:', error);
      alert('创建失败');
    }
  };

  // 更新标签
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.tag_name.trim()) {
      alert('请输入标签名称');
      return;
    }

    if (!editingTag) return;

    try {
      const response = await fetch(`/api/tags/${editingTag.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (result.success) {
        alert('标签更新成功');
        setFormData({ tag_name: '' });
        setEditingTag(null);
        fetchTags();
      } else {
        alert('更新失败: ' + result.error);
      }
    } catch (error) {
      console.error('更新标签失败:', error);
      alert('更新失败');
    }
  };

  // 删除标签
  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个标签吗？')) return;

    try {
      const response = await fetch(`/api/tags/${id}`, {
        method: 'DELETE'
      });
      const result = await response.json();

      if (result.success) {
        alert('标签删除成功');
        fetchTags();
      } else {
        alert('删除失败: ' + result.error);
      }
    } catch (error) {
      console.error('删除标签失败:', error);
      alert('删除失败');
    }
  };

  // 开始编辑
  const startEdit = (tag: Tag) => {
    setEditingTag(tag);
    setFormData({ tag_name: tag.tag_name });
    setShowCreateForm(false);
  };

  // 取消编辑
  const cancelEdit = () => {
    setEditingTag(null);
    setFormData({ tag_name: '' });
  };

  // 取消创建
  const cancelCreate = () => {
    setShowCreateForm(false);
    setFormData({ tag_name: '' });
  };

  useEffect(() => {
    fetchTags();
  }, [searchTerm]);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">标签管理</h1>
            <p className="text-gray-600 mt-2">管理知识点标签，方便题目分类和检索</p>
          </div>
          <button
            onClick={() => setShowCreateForm(true)}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
          >
            创建标签
          </button>
        </div>

        {/* 搜索框 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="max-w-md">
            <label className="block text-sm font-medium text-gray-700 mb-2">搜索标签</label>
            <input
              type="text"
              placeholder="输入标签名称..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* 创建/编辑表单 */}
        {(showCreateForm || editingTag) && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {editingTag ? '编辑标签' : '创建标签'}
            </h2>
            <form onSubmit={editingTag ? handleUpdate : handleCreate}>
              <div className="flex gap-4">
                <div className="flex-1">
                  <input
                    type="text"
                    placeholder="请输入标签名称..."
                    value={formData.tag_name}
                    onChange={(e) => setFormData({ tag_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    {editingTag ? '更新' : '创建'}
                  </button>
                  <button
                    type="button"
                    onClick={editingTag ? cancelEdit : cancelCreate}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            </form>
          </div>
        )}

        {/* 标签列表 */}
        <div className="bg-white rounded-lg shadow-md">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : tags.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchTerm ? '没有找到匹配的标签' : '暂无标签数据'}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {tags.map((tag) => (
                <div key={tag.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{tag.tag_name}</h3>
                      <p className="text-sm text-gray-500">
                        创建时间: {new Date(tag.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(tag)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(tag.id)}
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
