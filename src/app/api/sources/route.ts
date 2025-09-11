import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { Source, ApiResponse } from '@/types/database';

// GET /api/sources - 获取来源列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');

    let sql = 'SELECT * FROM sources';
    let params: any[] = [];

    if (search) {
      sql += ' WHERE source_name LIKE ?';
      params.push(`%${search}%`);
    }

    sql += ' ORDER BY created_at DESC';

    const sources = await query<Source>(sql, params);

    return NextResponse.json({
      success: true,
      data: sources
    } as ApiResponse);

  } catch (error) {
    console.error('获取来源列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取来源列表失败'
    } as ApiResponse, { status: 500 });
  }
}

// POST /api/sources - 创建来源
export async function POST(request: NextRequest) {
  try {
    const { source_name } = await request.json();

    if (!source_name || source_name.trim() === '') {
      return NextResponse.json({
        success: false,
        error: '来源名称不能为空'
      } as ApiResponse, { status: 400 });
    }

    // 检查来源是否已存在
    const existingSource = await query<Source>('SELECT id FROM sources WHERE source_name = ?', [source_name.trim()]);
    if (existingSource.length > 0) {
      return NextResponse.json({
        success: false,
        error: '来源已存在'
      } as ApiResponse, { status: 400 });
    }

    const insertSql = 'INSERT INTO sources (source_name) VALUES (?)';
    const result = await query(insertSql, [source_name.trim()]);
    const insertId = (result as any).insertId;

    return NextResponse.json({
      success: true,
      data: { id: insertId },
      message: '来源创建成功'
    } as ApiResponse);

  } catch (error) {
    console.error('创建来源失败:', error);
    return NextResponse.json({
      success: false,
      error: '创建来源失败'
    } as ApiResponse, { status: 500 });
  }
}
