'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MaterialWithDetails } from '@/types/database';

export default function MaterialsPage() {
  const router = useRouter();
  const [materials, setMaterials] = useState<MaterialWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });

  // 获取材料列表
  const fetchMaterials = async (page = 1) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/materials?page=${page}&pageSize=10`);
      const result = await response.json();

      if (result.success) {
        setMaterials(result.data.materials);
        setPagination(result.data.pagination);
      } else {
        alert('获取材料列表失败: ' + result.error);
      }
    } catch (error) {
      console.error('获取材料列表失败:', error);
      alert('获取材料列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, []);

  // 删除材料
  const handleDelete = async (materialId: number) => {
    if (!confirm('确定要删除这个材料题吗？此操作不可撤销。')) {
      return;
    }

    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        alert('材料题删除成功');
        fetchMaterials(pagination.page);
      } else {
        alert('删除失败: ' + result.error);
      }
    } catch (error) {
      console.error('删除材料题失败:', error);
      alert('删除失败');
    }
  };

  if (loading) {
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">材料题管理</h1>
              <p className="text-gray-600 mt-2">管理生物竞赛材料题，包含材料内容和相关小题</p>
            </div>
            <button
              onClick={() => router.push('/materials/create')}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              创建材料题
            </button>
          </div>
        </div>

        {/* 材料列表 */}
        <div className="bg-white rounded-lg shadow-md">
          {materials.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {materials.map((material) => (
                <div key={material.id} className="p-6 hover:bg-gray-50">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {material.title || '无标题'}
                        </h3>
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                          {material.questions?.length || 0} 道小题
                        </span>
                        {material.source_name && (
                          <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                            {material.source_name}
                          </span>
                        )}
                      </div>
                      
                      <div 
                        className="text-gray-700 mb-4 line-clamp-3"
                        dangerouslySetInnerHTML={{ __html: material.content }}
                      />
                      
                      <div className="text-sm text-gray-500">
                        创建时间: {new Date(material.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => router.push(`/materials/${material.id}/edit`)}
                        className="text-blue-600 hover:text-blue-800 text-sm px-3 py-1 border border-blue-300 rounded hover:bg-blue-50"
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(material.id)}
                        className="text-red-600 hover:text-red-800 text-sm px-3 py-1 border border-red-300 rounded hover:bg-red-50"
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">暂无材料题</h3>
              <p className="text-gray-500 mb-6">开始创建你的第一个材料题吧</p>
              <button
                onClick={() => router.push('/materials/create')}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                创建材料题
              </button>
            </div>
          )}
        </div>

        {/* 分页 */}
        {pagination.totalPages > 1 && (
          <div className="mt-6 flex justify-center">
            <div className="flex gap-2">
              <button
                onClick={() => fetchMaterials(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                上一页
              </button>
              
              <span className="px-4 py-2 text-gray-700">
                第 {pagination.page} 页，共 {pagination.totalPages} 页
              </span>
              
              <button
                onClick={() => fetchMaterials(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
