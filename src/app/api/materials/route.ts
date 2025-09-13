import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import { MaterialWithDetails, CreateMaterialData, ApiResponse } from '@/types/database';

// GET /api/materials - 获取材料列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');
    
    const offset = (page - 1) * pageSize;
    const question_id = searchParams.get('question_id');
    
    if (!Number.isInteger(page) || !Number.isInteger(pageSize) || !Number.isInteger(offset)) {
      return NextResponse.json({
        success: false,
        error: '无效的分页参数'
      } as ApiResponse, { status: 400 });
    }

    let materials: MaterialWithDetails[] = [];
    let total = 0;

    if (question_id) {
      // 通过题目ID查询材料
      const materialSql = `
        SELECT 
          m.*,
          s.source_name
        FROM materials m
        INNER JOIN material_questions mq ON m.id = mq.material_id
        LEFT JOIN sources s ON m.source_id = s.id
        WHERE mq.question_id = ?
      `;
      
      materials = await query<MaterialWithDetails>(materialSql, [parseInt(question_id)]);
    } else {
      // 查询材料总数
      const countSql = 'SELECT COUNT(*) as total FROM materials';
      const countResult = await query<{ total: number }>(countSql);
      total = countResult[0].total;

      // 查询材料列表
      const materialsSql = `
        SELECT 
          m.*,
          s.source_name
        FROM materials m
        LEFT JOIN sources s ON m.source_id = s.id
        ORDER BY m.created_at DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      
      materials = await query<MaterialWithDetails>(materialsSql);
    }

    // 为每个材料获取关联的题目
    for (const material of materials) {
      const questionsSql = `
        SELECT 
          q.*,
          qt.type_name,
          s.source_name
        FROM questions q
        INNER JOIN material_questions mq ON q.id = mq.question_id
        LEFT JOIN question_types qt ON q.type_id = qt.id
        LEFT JOIN sources s ON q.source_id = s.id
        WHERE mq.material_id = ?
        ORDER BY mq.sub_no
      `;
      
      const questions = await query(questionsSql, [material.id]);
      
      // 为每个题目获取选项和标签
      for (const question of questions) {
        const optionsSql = 'SELECT * FROM options WHERE question_id = ? ORDER BY sort_order, opt_label';
        question.options = await query(optionsSql, [question.id]);

        const tagsSql = `
          SELECT t.* FROM tags t
          INNER JOIN question_tags qt ON t.id = qt.tag_id
          WHERE qt.question_id = ?
          ORDER BY t.tag_name
        `;
        question.tags = await query(tagsSql, [question.id]);
      }
      
      material.questions = questions;
    }

    if (question_id) {
      return NextResponse.json({
        success: true,
        data: {
          materials
        }
      } as ApiResponse);
    } else {
      const totalPages = Math.ceil(total / pageSize);

      return NextResponse.json({
        success: true,
        data: {
          materials,
          pagination: {
            total,
            page,
            pageSize,
            totalPages
          }
        }
      } as ApiResponse);
    }

  } catch (error) {
    console.error('获取材料列表失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取材料列表失败'
    } as ApiResponse, { status: 500 });
  }
}

// POST /api/materials - 创建材料题
export async function POST(request: NextRequest) {
  try {
    const data: CreateMaterialData = await request.json();

    // 验证必填字段
    if (!data.content) {
      return NextResponse.json({
        success: false,
        error: '材料内容为必填项'
      } as ApiResponse, { status: 400 });
    }

    const result = await transaction(async (connection) => {
      // 插入材料
      const insertMaterialSql = `
        INSERT INTO materials (title, content, source_id)
        VALUES (?, ?, ?)
      `;
      const [materialResult] = await connection.execute(insertMaterialSql, [
        data.title || null,
        data.content,
        data.source_id || null
      ]);
      
      const materialId = (materialResult as any).insertId;

      // 插入关联的题目
      if (data.questions && data.questions.length > 0) {
        for (let i = 0; i < data.questions.length; i++) {
          const questionData = data.questions[i];
          
          // 插入题目
          const insertQuestionSql = `
            INSERT INTO questions (type_id, stem, answer, explanation, source_id)
            VALUES (?, ?, ?, ?, ?)
          `;
          const [questionResult] = await connection.execute(insertQuestionSql, [
            questionData.type_id,
            questionData.stem,
            questionData.answer || null,
            questionData.explanation || null,
            questionData.source_id || null
          ]);
          
          const questionId = (questionResult as any).insertId;

          // 插入选项
          if (questionData.options && questionData.options.length > 0) {
            for (const option of questionData.options) {
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
          if (questionData.tag_ids && questionData.tag_ids.length > 0) {
            for (const tagId of questionData.tag_ids) {
              const insertTagSql = `
                INSERT INTO question_tags (question_id, tag_id)
                VALUES (?, ?)
              `;
              await connection.execute(insertTagSql, [questionId, tagId]);
            }
          }

          // 插入材料题目关联
          const insertMaterialQuestionSql = `
            INSERT INTO material_questions (material_id, question_id, sub_no)
            VALUES (?, ?, ?)
          `;
          await connection.execute(insertMaterialQuestionSql, [materialId, questionId, i + 1]);
        }
      }

      return materialId;
    });

    return NextResponse.json({
      success: true,
      data: { id: result },
      message: '材料题创建成功'
    } as ApiResponse);

  } catch (error) {
    console.error('创建材料题失败:', error);
    return NextResponse.json({
      success: false,
      error: '创建材料题失败'
    } as ApiResponse, { status: 500 });
  }
}
