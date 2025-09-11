import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import { QuestionWithDetails, UpdateQuestionData, ApiResponse } from '@/types/database';

// GET /api/questions/[id] - 获取单个题目详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = parseInt(params.id);

    if (isNaN(questionId)) {
      return NextResponse.json({
        success: false,
        error: '无效的题目ID'
      } as ApiResponse, { status: 400 });
    }

    // 查询题目基本信息
    const questionSql = `
      SELECT 
        q.*,
        qt.type_name,
        s.source_name
      FROM questions q
      LEFT JOIN question_types qt ON q.type_id = qt.id
      LEFT JOIN sources s ON q.source_id = s.id
      WHERE q.id = ?
    `;
    
    const questions = await query<QuestionWithDetails>(questionSql, [questionId]);
    
    if (questions.length === 0) {
      return NextResponse.json({
        success: false,
        error: '题目不存在'
      } as ApiResponse, { status: 404 });
    }

    const question = questions[0];

    // 获取选项
    const optionsSql = 'SELECT * FROM options WHERE question_id = ? ORDER BY sort_order, opt_label';
    question.options = await query(optionsSql, [questionId]);

    // 获取标签
    const tagsSql = `
      SELECT t.* FROM tags t
      INNER JOIN question_tags qt ON t.id = qt.tag_id
      WHERE qt.question_id = ?
      ORDER BY t.tag_name
    `;
    question.tags = await query(tagsSql, [questionId]);

    return NextResponse.json({
      success: true,
      data: question
    } as ApiResponse);

  } catch (error) {
    console.error('获取题目详情失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取题目详情失败'
    } as ApiResponse, { status: 500 });
  }
}

// PUT /api/questions/[id] - 更新题目
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = parseInt(params.id);
    const data: UpdateQuestionData = await request.json();

    if (isNaN(questionId)) {
      return NextResponse.json({
        success: false,
        error: '无效的题目ID'
      } as ApiResponse, { status: 400 });
    }

    // 验证题目是否存在
    const existingQuestion = await query('SELECT id FROM questions WHERE id = ?', [questionId]);
    if (existingQuestion.length === 0) {
      return NextResponse.json({
        success: false,
        error: '题目不存在'
      } as ApiResponse, { status: 404 });
    }

    await transaction(async (connection) => {
      // 更新题目基本信息
      const updateFields = [];
      const updateValues = [];

      if (data.type_id !== undefined) {
        updateFields.push('type_id = ?');
        updateValues.push(data.type_id);
      }
      if (data.stem !== undefined) {
        updateFields.push('stem = ?');
        updateValues.push(data.stem);
      }
      if (data.answer !== undefined) {
        updateFields.push('answer = ?');
        updateValues.push(data.answer);
      }
      if (data.explanation !== undefined) {
        updateFields.push('explanation = ?');
        updateValues.push(data.explanation);
      }
      if (data.source_id !== undefined) {
        updateFields.push('source_id = ?');
        updateValues.push(data.source_id);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(questionId);

        const updateQuestionSql = `
          UPDATE questions 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `;
        await connection.execute(updateQuestionSql, updateValues);
      }

      // 更新选项
      if (data.options !== undefined) {
        // 删除现有选项
        await connection.execute('DELETE FROM options WHERE question_id = ?', [questionId]);
        
        // 插入新选项
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

      // 更新标签关联
      if (data.tag_ids !== undefined) {
        // 删除现有标签关联
        await connection.execute('DELETE FROM question_tags WHERE question_id = ?', [questionId]);
        
        // 插入新标签关联
        for (const tagId of data.tag_ids) {
          const insertTagSql = `
            INSERT INTO question_tags (question_id, tag_id)
            VALUES (?, ?)
          `;
          await connection.execute(insertTagSql, [questionId, tagId]);
        }
      }
    });

    return NextResponse.json({
      success: true,
      message: '题目更新成功'
    } as ApiResponse);

  } catch (error) {
    console.error('更新题目失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新题目失败'
    } as ApiResponse, { status: 500 });
  }
}

// DELETE /api/questions/[id] - 删除题目
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const questionId = parseInt(params.id);

    if (isNaN(questionId)) {
      return NextResponse.json({
        success: false,
        error: '无效的题目ID'
      } as ApiResponse, { status: 400 });
    }

    // 验证题目是否存在
    const existingQuestion = await query('SELECT id FROM questions WHERE id = ?', [questionId]);
    if (existingQuestion.length === 0) {
      return NextResponse.json({
        success: false,
        error: '题目不存在'
      } as ApiResponse, { status: 404 });
    }

    // 删除题目（会级联删除选项和标签关联）
    await query('DELETE FROM questions WHERE id = ?', [questionId]);

    return NextResponse.json({
      success: true,
      message: '题目删除成功'
    } as ApiResponse);

  } catch (error) {
    console.error('删除题目失败:', error);
    return NextResponse.json({
      success: false,
      error: '删除题目失败'
    } as ApiResponse, { status: 500 });
  }
}
