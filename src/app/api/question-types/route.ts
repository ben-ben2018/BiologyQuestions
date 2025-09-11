import { NextRequest, NextResponse } from 'next/server';
import { query } from '@/lib/database';
import { QuestionType, ApiResponse } from '@/types/database';

// GET /api/question-types - 获取题目类型列表
export async function GET(request: NextRequest) {
  try {
    const sql = 'SELECT * FROM question_types ORDER BY id';
    const questionTypes = await query<QuestionType>(sql);

    return NextResponse.json({
      success: true,
      data: questionTypes
    } as ApiResponse);

  } catch (error) {
    console.error('获取题目类型列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取题目类型列表失败'
    } as ApiResponse, { status: 500 });
  }
}
