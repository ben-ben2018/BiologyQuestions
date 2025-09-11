import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { Tag, ApiResponse } from '@/types/database';

// GET /api/tags - 获取标签列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM tags';
    let params: any[] = [];

    if (search) {
      sql += ' WHERE tag_name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const tags = await query<Tag>(sql, params);

    return NextResponse.json({
      success: true,
      data: tags
    } as ApiResponse);

  } catch (error) {
    console.error('获取标签列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取标签列表失败'
    } as ApiResponse, { status: 500 });
  }
}

// POST /api/tags - 创建标签
export async function POST(request: NextRequest) {
  try {
    const { tag_name } = await request.json();

    if (!tag_name || tag_name.trim() === '') {
      return NextResponse.json({
        success: false,
        error: '标签名称不能为空'
      } as ApiResponse, { status: 400 });
    }

    // 检查标签是否已存在
    const existingTag = await query<Tag>('SELECT id FROM tags WHERE tag_name = ?', [tag_name.trim()]);
    if (existingTag.length > 0) {
      return NextResponse.json({
        success: false,
        error: '标签已存在'
      } as ApiResponse, { status: 400 });
    }

    const insertSql = 'INSERT INTO tags (tag_name) VALUES (?)';
    const result = await query(insertSql, [tag_name.trim()]);
    const insertId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      data: { id: insertId },
      message: '标签创建成功'
    } as ApiResponse);

  } catch (error) {
    console.error('创建标签失败:', error);
    return NextResponse.json({
      success: false,
      error: '创建标签失败'
    } as ApiResponse, { status: 500 });
  }
}
