import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { Tag, ApiResponse } from '@/types/database';

// PUT /api/tags/[id] - 更新标签
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tagId = parseInt(params.id);
    const { tag_name } = await request.json();

    if (isNaN(tagId)) {
      return NextResponse.json({
        success: false,
        error: '无效的标签ID'
      } as ApiResponse, { status: 400 });
    }

    if (!tag_name || tag_name.trim() === '') {
      return NextResponse.json({
        success: false,
        error: '标签名称不能为空'
      } as ApiResponse, { status: 400 });
    }

    // 检查标签是否存在
    const existingTag = await query<Tag>('SELECT id FROM tags WHERE id = ?', [tagId]);
    if (existingTag.length === 0) {
      return NextResponse.json({
        success: false,
        error: '标签不存在'
      } as ApiResponse, { status: 404 });
    }

    // 检查新名称是否已存在
    const duplicateTag = await query<Tag>('SELECT id FROM tags WHERE tag_name = ? AND id != ?', [tag_name.trim(), tagId]);
    if (duplicateTag.length > 0) {
      return NextResponse.json({
        success: false,
        error: '标签名称已存在'
      } as ApiResponse, { status: 400 });
    }

    const updateSql = 'UPDATE tags SET tag_name = ? WHERE id = ?';
    await query(updateSql, [tag_name.trim(), tagId]);

    return NextResponse.json({
      success: true,
      message: '标签更新成功'
    } as ApiResponse);

  } catch (error) {
    console.error('更新标签失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新标签失败'
    } as ApiResponse, { status: 500 });
  }
}

// DELETE /api/tags/[id] - 删除标签
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const tagId = parseInt(params.id);

    if (isNaN(tagId)) {
      return NextResponse.json({
        success: false,
        error: '无效的标签ID'
      } as ApiResponse, { status: 400 });
    }

    // 检查标签是否存在
    const existingTag = await query<Tag>('SELECT id FROM tags WHERE id = ?', [tagId]);
    if (existingTag.length === 0) {
      return NextResponse.json({
        success: false,
        error: '标签不存在'
      } as ApiResponse, { status: 404 });
    }

    // 检查是否有题目使用此标签
    const usedInQuestions = await query('SELECT COUNT(*) as count FROM question_tags WHERE tag_id = ?', [tagId]);
    if (usedInQuestions[0].count > 0) {
      return NextResponse.json({
        success: false,
        error: '该标签正在被题目使用，无法删除'
      } as ApiResponse, { status: 400 });
    }

    const deleteSql = 'DELETE FROM tags WHERE id = ?';
    await query(deleteSql, [tagId]);

    return NextResponse.json({
      success: true,
      message: '标签删除成功'
    } as ApiResponse);

  } catch (error) {
    console.error('删除标签失败:', error);
    return NextResponse.json({
      success: false,
      error: '删除标签失败'
    } as ApiResponse, { status: 500 });
  }
}
