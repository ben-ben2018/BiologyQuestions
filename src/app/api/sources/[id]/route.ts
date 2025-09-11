import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { Source, ApiResponse } from '@/types/database';

// PUT /api/sources/[id] - 更新来源
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sourceId = parseInt(params.id);
    const { source_name } = await request.json();

    if (isNaN(sourceId)) {
      return NextResponse.json({
        success: false,
        error: '无效的来源ID'
      } as ApiResponse, { status: 400 });
    }

    if (!source_name || source_name.trim() === '') {
      return NextResponse.json({
        success: false,
        error: '来源名称不能为空'
      } as ApiResponse, { status: 400 });
    }

    // 检查来源是否存在
    const existingSource = await query<Source>('SELECT id FROM sources WHERE id = ?', [sourceId]);
    if (existingSource.length === 0) {
      return NextResponse.json({
        success: false,
        error: '来源不存在'
      } as ApiResponse, { status: 404 });
    }

    // 检查新名称是否已存在
    const duplicateSource = await query<Source>('SELECT id FROM sources WHERE source_name = ? AND id != ?', [source_name.trim(), sourceId]);
    if (duplicateSource.length > 0) {
      return NextResponse.json({
        success: false,
        error: '来源名称已存在'
      } as ApiResponse, { status: 400 });
    }

    const updateSql = 'UPDATE sources SET source_name = ? WHERE id = ?';
    await query(updateSql, [source_name.trim(), sourceId]);

    return NextResponse.json({
      success: true,
      message: '来源更新成功'
    } as ApiResponse);

  } catch (error) {
    console.error('更新来源失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新来源失败'
    } as ApiResponse, { status: 500 });
  }
}

// DELETE /api/sources/[id] - 删除来源
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const sourceId = parseInt(params.id);

    if (isNaN(sourceId)) {
      return NextResponse.json({
        success: false,
        error: '无效的来源ID'
      } as ApiResponse, { status: 400 });
    }

    // 检查来源是否存在
    const existingSource = await query<Source>('SELECT id FROM sources WHERE id = ?', [sourceId]);
    if (existingSource.length === 0) {
      return NextResponse.json({
        success: false,
        error: '来源不存在'
      } as ApiResponse, { status: 404 });
    }

    // 检查是否有题目使用此来源
    const usedInQuestions = await query('SELECT COUNT(*) as count FROM questions WHERE source_id = ?', [sourceId]);
    if (usedInQuestions[0].count > 0) {
      return NextResponse.json({
        success: false,
        error: '该来源正在被题目使用，无法删除'
      } as ApiResponse, { status: 400 });
    }

    const deleteSql = 'DELETE FROM sources WHERE id = ?';
    await query(deleteSql, [sourceId]);

    return NextResponse.json({
      success: true,
      message: '来源删除成功'
    } as ApiResponse);

  } catch (error) {
    console.error('删除来源失败:', error);
    return NextResponse.json({
      success: false,
      error: '删除来源失败'
    } as ApiResponse, { status: 500 });
  }
}
