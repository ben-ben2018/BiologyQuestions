import { NextRequest, NextResponse } from 'next/server';
import { query, transaction } from '@/lib/database';
import { MaterialWithDetails, UpdateMaterialData, ApiResponse } from '@/types/database';

// GET /api/materials/[id] - 获取单个材料详情
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = parseInt(params.id);

    if (isNaN(materialId)) {
      return NextResponse.json({
        success: false,
        error: '无效的材料ID'
      } as ApiResponse, { status: 400 });
    }

    // 查询材料基本信息
    const materialSql = `
      SELECT 
        m.*,
        s.source_name
      FROM materials m
      LEFT JOIN sources s ON m.source_id = s.id
      WHERE m.id = ?
    `;
    
    const materials = await query<MaterialWithDetails>(materialSql, [materialId]);
    
    if (materials.length === 0) {
      return NextResponse.json({
        success: false,
        error: '材料不存在'
      } as ApiResponse, { status: 404 });
    }

    const material = materials[0];

    // 获取关联的题目
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
    
    const questions = await query(questionsSql, [materialId]);
    
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

    return NextResponse.json({
      success: true,
      data: material
    } as ApiResponse);

  } catch (error) {
    console.error('获取材料详情失败:', error);
    return NextResponse.json({
      success: false,
      error: '获取材料详情失败'
    } as ApiResponse, { status: 500 });
  }
}

// PUT /api/materials/[id] - 更新材料题
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = parseInt(params.id);
    const data: UpdateMaterialData = await request.json();

    if (isNaN(materialId)) {
      return NextResponse.json({
        success: false,
        error: '无效的材料ID'
      } as ApiResponse, { status: 400 });
    }

    // 验证材料是否存在
    const existingMaterial = await query('SELECT id FROM materials WHERE id = ?', [materialId]);
    if (existingMaterial.length === 0) {
      return NextResponse.json({
        success: false,
        error: '材料不存在'
      } as ApiResponse, { status: 404 });
    }

    await transaction(async (connection) => {
      // 更新材料基本信息
      const updateFields = [];
      const updateValues = [];

      if (data.title !== undefined) {
        updateFields.push('title = ?');
        updateValues.push(data.title);
      }
      if (data.content !== undefined) {
        updateFields.push('content = ?');
        updateValues.push(data.content);
      }
      if (data.source_id !== undefined) {
        updateFields.push('source_id = ?');
        updateValues.push(data.source_id);
      }

      if (updateFields.length > 0) {
        updateFields.push('updated_at = CURRENT_TIMESTAMP');
        updateValues.push(materialId);

        const updateMaterialSql = `
          UPDATE materials 
          SET ${updateFields.join(', ')}
          WHERE id = ?
        `;
        await connection.execute(updateMaterialSql, updateValues);
      }

      // 更新关联的题目
      if (data.questions !== undefined) {
        // 删除现有的材料题目关联
        await connection.execute('DELETE FROM material_questions WHERE material_id = ?', [materialId]);
        
        // 删除现有的题目（级联删除选项和标签）
        const existingQuestions = await query('SELECT question_id FROM material_questions WHERE material_id = ?', [materialId]);
        for (const q of existingQuestions) {
          await connection.execute('DELETE FROM questions WHERE id = ?', [q.question_id]);
        }
        
        // 插入新题目
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
    });

    return NextResponse.json({
      success: true,
      message: '材料题更新成功'
    } as ApiResponse);

  } catch (error) {
    console.error('更新材料题失败:', error);
    return NextResponse.json({
      success: false,
      error: '更新材料题失败'
    } as ApiResponse, { status: 500 });
  }
}

// DELETE /api/materials/[id] - 删除材料题
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const materialId = parseInt(params.id);

    if (isNaN(materialId)) {
      return NextResponse.json({
        success: false,
        error: '无效的材料ID'
      } as ApiResponse, { status: 400 });
    }

    // 验证材料是否存在
    const existingMaterial = await query('SELECT id FROM materials WHERE id = ?', [materialId]);
    if (existingMaterial.length === 0) {
      return NextResponse.json({
        success: false,
        error: '材料不存在'
      } as ApiResponse, { status: 404 });
    }

    // 删除材料（会级联删除关联的题目）
    await query('DELETE FROM materials WHERE id = ?', [materialId]);

    return NextResponse.json({
      success: true,
      message: '材料题删除成功'
    } as ApiResponse);

  } catch (error) {
    console.error('删除材料题失败:', error);
    return NextResponse.json({
      success: false,
      error: '删除材料题失败'
    } as ApiResponse, { status: 500 });
  }
}
