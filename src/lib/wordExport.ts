// @ts-ignore
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { QuestionWithDetails, MaterialWithDetails } from '@/types/database';

// 处理LaTeX内容，转换为纯文本
function processLatexContent(content: string): string {
  if (!content) return '';
  
  // 移除LaTeX标记，保留基本内容
  return content
    .replace(/\$([^$]+)\$/g, '$1') // 移除行内公式标记
    .replace(/\$\$([^$]+)\$\$/g, '$1') // 移除块级公式标记
    .replace(/\\\[([\s\S]*?)\\\]/g, '$1') // 移除LaTeX块标记
    .replace(/\\[a-zA-Z]+/g, '') // 移除LaTeX命令
    .replace(/\{|\}/g, '') // 移除大括号
    .replace(/\\/g, '') // 移除反斜杠
    .trim();
}

// 导出试卷为Word文档（包含试卷和答案）
export async function exportPaperToWord(
  questions: QuestionWithDetails[],
  materials: MaterialWithDetails[] = [],
  paperTitle: string = '生物竞赛试卷',
  paperSubtitle: string = ''
) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // 试卷标题
        new Paragraph({
          text: paperTitle,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        
        // 副标题
        ...(paperSubtitle ? [new Paragraph({
          text: paperSubtitle,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        })] : []),
        
        // 考试信息
        new Paragraph({
          children: [
            new TextRun({ text: '姓名：_______________', size: 24 }),
            new TextRun({ text: ' 班级：_______________', size: 24 }),
            new TextRun({ text: ' 学号：_______________', size: 24 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 200 }
        }),
        
        new Paragraph({
          children: [
            new TextRun({ text: `考试时间：120分钟`, size: 24 }),
            new TextRun({ text: ` 总分：${(questions.length + materials.reduce((sum, m) => sum + (m.questions?.length || 0), 0)) * 10}分`, size: 24 })
          ],
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 }
        }),
        
        // 题目列表
        ...questions.map((question, index) => [
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. `,
                bold: true,
                size: 28
              }),
              new TextRun({
                text: `[${question.type_name}] `,
                bold: true,
                color: '0066CC',
                size: 24
              }),
              new TextRun({
                text: `(${10}分)`,
                size: 24
              })
            ],
            spacing: { before: 200, after: 200 }
          }),
          
          new Paragraph({
            text: processLatexContent(question.stem),
            spacing: { after: 200 }
          }),
          
          // 选项 - 确保所有题型都显示选项
          ...(question.options && question.options.length > 0 ? [
            ...question.options.map(option => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${option.opt_label}. `,
                    bold: true
                  }),
                  new TextRun({
                    text: processLatexContent(option.opt_content)
                  })
                ],
                spacing: { after: 100 }
              })
            )
          ] : []),
          
          // 答题区域
          new Paragraph({
            children: [
              new TextRun({
                text: '答案：',
                bold: true
              })
            ],
            spacing: { before: 200, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: '_________________________________',
                color: 'CCCCCC'
              })
            ],
            spacing: { after: 400 }
          })
        ]).flat(),
        
        // 材料题列表
        ...materials.map((material, materialIndex) => [
          new Paragraph({
            children: [
              new TextRun({
                text: `${questions.length + materialIndex + 1}. `,
                bold: true,
                size: 28
              }),
              new TextRun({
                text: `[材料题] `,
                bold: true,
                color: 'FF6600',
                size: 24
              }),
              new TextRun({
                text: `(${(material.questions?.length || 0) * 10}分)`,
                size: 24
              })
            ],
            spacing: { before: 200, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: material.title || '材料题',
                bold: true,
                size: 20
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            text: processLatexContent(material.content),
            spacing: { after: 200 }
          }),
          
          // 材料题的小题
          ...(material.questions && material.questions.length > 0 ? material.questions.map((question: QuestionWithDetails, questionIndex: number) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `(${questionIndex + 1}) `,
                  bold: true,
                  size: 24
                }),
                new TextRun({
                  text: `[${question.type_name}] `,
                  bold: true,
                  color: '0066CC',
                  size: 20
                }),
                new TextRun({
                  text: `(${10}分)`,
                  size: 20
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            
            new Paragraph({
              text: processLatexContent(question.stem),
              spacing: { after: 200 }
            }),
            
            // 选项
            ...(question.options && question.options.length > 0 ? [
              ...question.options.map((option: any) => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${option.opt_label}. `,
                      bold: true
                    }),
                    new TextRun({
                      text: processLatexContent(option.opt_content)
                    })
                  ],
                  spacing: { after: 100 }
                })
              )
            ] : []),
            
            // 答题区域
            new Paragraph({
              children: [
                new TextRun({
                  text: '答案：',
                  bold: true
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            
            new Paragraph({
              children: [
                new TextRun({
                  text: '_________________________________',
                  color: 'CCCCCC'
                })
              ],
              spacing: { after: 400 }
            })
          ]).flat() : [])
        ]).flat(),
        
        // 试卷结束标记
        new Paragraph({
          text: '—————— 试卷结束 ——————',
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 }
        }),
        
        // 分页符 - 答案单独一页
        new Paragraph({
          text: '',
          pageBreakBefore: true
        }),
        
        // 答案标题
        new Paragraph({
          text: `${paperTitle} - 答案与解析`,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
          spacing: { after: 400 }
        }),
        
        // 答案列表 - 普通题目
        ...questions.map((question, index) => [
          new Paragraph({
            children: [
              new TextRun({
                text: `${index + 1}. `,
                bold: true,
                size: 28
              }),
              new TextRun({
                text: `[${question.type_name}] `,
                bold: true,
                color: '0066CC',
                size: 24
              }),
              new TextRun({
                text: `(${10}分)`,
                size: 24
              })
            ],
            spacing: { before: 200, after: 200 }
          }),
          
          new Paragraph({
            text: processLatexContent(question.stem),
            spacing: { after: 200 }
          }),
          
          // 选项（高亮正确答案）
          ...(question.options && question.options.length > 0 ? [
            ...question.options.map(option => 
              new Paragraph({
                children: [
                  new TextRun({
                    text: `${option.opt_label}. `,
                    bold: true,
                    color: option.is_correct ? '00AA00' : '000000'
                  }),
                  new TextRun({
                    text: processLatexContent(option.opt_content),
                    color: option.is_correct ? '00AA00' : '000000',
                    bold: option.is_correct
                  }),
                  ...(option.is_correct ? [new TextRun({
                    text: ' ✓ 正确答案',
                    color: '00AA00',
                    bold: true
                  })] : [])
                ],
                spacing: { after: 100 }
              })
            )
          ] : []),
          
          // 答案
          new Paragraph({
            children: [
              new TextRun({
                text: '答案：',
                bold: true,
                color: '00AA00'
              }),
              new TextRun({
                text: question.answer 
                  ? processLatexContent(question.answer)
                  : question.options 
                    ? question.options
                        .filter(opt => opt.is_correct)
                        .map(opt => opt.opt_label)
                        .join('、')
                    : '暂无答案',
                bold: true,
                color: '00AA00'
              })
            ],
            spacing: { before: 200, after: 200 }
          }),
          
          // 解析
          ...(question.explanation ? [
            new Paragraph({
              children: [
                new TextRun({
                  text: '解析：',
                  bold: true,
                  color: '0066CC'
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            new Paragraph({
              text: processLatexContent(question.explanation),
              spacing: { after: 400 }
            })
          ] : [])
        ]).flat(),
        
        // 材料题答案列表
        ...materials.map((material, materialIndex) => [
          new Paragraph({
            children: [
              new TextRun({
                text: `${questions.length + materialIndex + 1}. `,
                bold: true,
                size: 28
              }),
              new TextRun({
                text: `[材料题] `,
                bold: true,
                color: 'FF6600',
                size: 24
              }),
              new TextRun({
                text: `(${(material.questions?.length || 0) * 10}分)`,
                size: 24
              })
            ],
            spacing: { before: 200, after: 200 }
          }),
          
          new Paragraph({
            children: [
              new TextRun({
                text: material.title || '材料题',
                bold: true,
                size: 20
              })
            ],
            spacing: { after: 200 }
          }),
          
          new Paragraph({
            text: processLatexContent(material.content),
            spacing: { after: 200 }
          }),
          
          // 材料题的小题答案
          ...(material.questions && material.questions.length > 0 ? material.questions.map((question: QuestionWithDetails, questionIndex: number) => [
            new Paragraph({
              children: [
                new TextRun({
                  text: `(${questionIndex + 1}) `,
                  bold: true,
                  size: 24
                }),
                new TextRun({
                  text: `[${question.type_name}] `,
                  bold: true,
                  color: '0066CC',
                  size: 20
                }),
                new TextRun({
                  text: `(${10}分)`,
                  size: 20
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            
            new Paragraph({
              text: processLatexContent(question.stem),
              spacing: { after: 200 }
            }),
            
            // 选项（高亮正确答案）
            ...(question.options && question.options.length > 0 ? [
              ...question.options.map((option: any) => 
                new Paragraph({
                  children: [
                    new TextRun({
                      text: `${option.opt_label}. `,
                      bold: true,
                      color: option.is_correct ? '00AA00' : '000000'
                    }),
                    new TextRun({
                      text: processLatexContent(option.opt_content),
                      color: option.is_correct ? '00AA00' : '000000',
                      bold: option.is_correct
                    }),
                    ...(option.is_correct ? [new TextRun({
                      text: ' ✓ 正确答案',
                      color: '00AA00',
                      bold: true
                    })] : [])
                  ],
                  spacing: { after: 100 }
                })
              )
            ] : []),
            
            // 答案
            new Paragraph({
              children: [
                new TextRun({
                  text: '答案：',
                  bold: true,
                  color: '00AA00'
                }),
                new TextRun({
                  text: question.answer 
                    ? processLatexContent(question.answer)
                    : question.options 
                      ? question.options
                          .filter((opt: any) => opt.is_correct)
                          .map((opt: any) => opt.opt_label)
                          .join('、')
                      : '暂无答案',
                  bold: true,
                  color: '00AA00'
                })
              ],
              spacing: { before: 200, after: 200 }
            }),
            
            // 解析
            ...(question.explanation ? [
              new Paragraph({
                children: [
                  new TextRun({
                    text: '解析：',
                    bold: true,
                    color: '0066CC'
                  })
                ],
                spacing: { before: 200, after: 200 }
              }),
              new Paragraph({
                text: processLatexContent(question.explanation),
                spacing: { after: 400 }
              })
            ] : [])
          ]).flat() : [])
        ]).flat(),
        
        // 答案结束标记
        new Paragraph({
          text: '—————— 答案结束 ——————',
          alignment: AlignmentType.CENTER,
          spacing: { before: 600 }
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  return buffer;
}

