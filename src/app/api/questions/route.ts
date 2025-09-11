import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import { QuestionWithDetails, CreateQuestionData, QuestionQueryParams, ApiResponse } from '@/types/database';

// GET /api/questions - 获取题目列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    const offset = (page - 1) * pageSize;
    
    // 确保参数是有效的数字
    if (!Number.isInteger(page) || !Number.isInteger(pageSize) || !Number.isInteger(offset)) {
      console.error('Invalid parameters:', { page, pageSize, offset });
      return NextResponse.json({
        success: false,
        error: '无效的分页参数'
      } as ApiResponse, { status: 400 });
    }
    
    if (isNaN(page) || isNaN(pageSize)) {
      return NextResponse.json({
        success: false,
        error: '无效的分页参数'
      } as ApiResponse, { status: 400 });
    }
    const type_id = searchParams.get('type_id');
    const source_id = searchParams.get('source_id');
    const tag_ids = searchParams.get('tag_ids');
    const search = searchParams.get('search');
    
    // 构建查询条件
    let whereConditions = [];
    let queryParams: any[] = [];

    if (type_id) {
      whereConditions.push('q.type_id = ?');
      queryParams.push(parseInt(type_id));
    }

    if (source_id) {
      whereConditions.push('q.source_id = ?');
      queryParams.push(parseInt(source_id));
    }

    if (search) {
      whereConditions.push('(q.stem LIKE ? OR q.answer LIKE ? OR q.explanation LIKE ?)');
      const searchPattern = `%${search}%`;
      queryParams.push(searchPattern, searchPattern, searchPattern);
    }

    if (tag_ids) {
      const tagIdArray = tag_ids.split(',').map(id => parseInt(id.trim()));
      whereConditions.push(`q.id IN (
        SELECT question_id FROM question_tags WHERE tag_id IN (${tagIdArray.map(() => '?').join(',')})
      )`);
      queryParams.push(...tagIdArray);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // 查询题目总数
    const countSql = `
      SELECT COUNT(*) as total
      FROM questions q
      ${whereClause}
    `;
    const countResult = await query<{ total: number }>(countSql, queryParams);
    const total = countResult[0].total;

    // 查询题目列表 - 使用字符串拼接处理 LIMIT 和 OFFSET
    const questionsSql = `
      SELECT 
        q.*,
        qt.type_name,
        s.source_name
      FROM questions q
      LEFT JOIN question_types qt ON q.type_id = qt.id
      LEFT JOIN sources s ON q.source_id = s.id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;
    
    
    const questions = await query<QuestionWithDetails>(questionsSql, queryParams);

    // 为每个题目获取选项和标签
    for (const question of questions) {
      // 获取选项
      const optionsSql = 'SELECT * FROM options WHERE question_id = ? ORDER BY sort_order, opt_label';
      question.options = await query(optionsSql, [question.id]);

      // 获取标签
      const tagsSql = `
        SELECT t.* FROM tags t
        INNER JOIN question_tags qt ON t.id = qt.tag_id
        WHERE qt.question_id = ?
        ORDER BY t.tag_name
      `;
      question.tags = await query(tagsSql, [question.id]);
    }

    const totalPages = Math.ceil(total / pageSize);

    return NextResponse.json({
      success: true,
      data: {
        questions,
        pagination: {
          total,
          page,
          pageSize,
          totalPages
        }
      }
    } as ApiResponse);

  } catch (error) {
    console.error('获取题目列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取题目列表失败'
    } as ApiResponse, { status: 500 });
  }
}

// POST /api/questions - 创建题目
export async function POST(request: NextRequest) {
  try {
    const data: CreateQuestionData = await request.json();

    // 验证必填字段
    if (!data.type_id || !data.stem) {
      return NextResponse.json({
        success: false,
        error: '题目类型和题干为必填项'
      } as ApiResponse, { status: 400 });
    }

    const result = await transaction(async (connection) => {
      // 插入题目
      const insertQuestionSql = `
        INSERT INTO questions (type_id, stem, answer, explanation, source_id)
        VALUES (?, ?, ?, ?, ?)
      `;
      const [questionResult] = await connection.execute(insertQuestionSql, [
        data.type_id,
        data.stem,
        data.answer || null,
        data.explanation || null,
        data.source_id || null
      ]);
      
      const questionId = (questionResult as any).insertId;

      // 插入选项
      if (data.options && data.options.length > 0) {
        for (const option of data.options) {
          const insertOptionSql = `
            INSERT INTO options (question_id, opt_label, opt_content, is_correct, sort_order)
            VALUES (?, ?, ?, ?, ?)
          `;
          await connection.execute(insertOptionSql, [
            questionId,
            option.opt_label,
            option.opt_content,
            option.is_correct,
            option.sort_order
          ]);
        }
      }

      // 插入标签关联
      if (data.tag_ids && data.tag_ids.length > 0) {
        for (const tagId of data.tag_ids) {
          const insertTagSql = `
            INSERT INTO question_tags (question_id, tag_id)
            VALUES (?, ?)
          `;
          await connection.execute(insertTagSql, [questionId, tagId]);
        }
      }

      return questionId;
    });

    return NextResponse.json({
      success: true,
      data: { id: result },
      message: '题目创建成功'
    } as ApiResponse);

  } catch (error) {
    console.error('创建题目失败:', error);
    return NextResponse.json({
      success: false,
      error: '创建题目失败'
    } as ApiResponse, { status: 500 });
  }
}
