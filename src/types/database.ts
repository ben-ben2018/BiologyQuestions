// 数据库表类型定义

export interface QuestionType {
  id: number;
  type_name: string;
}

export interface Source {
  id: number;
  source_name: string;
  created_at: Date;
}

export interface Tag {
  id: number;
  tag_name: string;
  created_at: Date;
}

export interface Question {
  id: number;
  type_id: number;
  stem: string;
  answer?: string;
  explanation?: string;
  source_id?: number;
  created_at: Date;
  updated_at: Date;
}

export interface Option {
  id: number;
  question_id: number;
  opt_label: string;
  opt_content: string;
  is_correct: boolean;
  sort_order: number;
}

export interface QuestionTag {
  question_id: number;
  tag_id: number;
}

// 扩展类型，用于前端显示
export interface QuestionWithDetails extends Question {
  type_name?: string;
  source_name?: string;
  options?: Option[];
  tags?: Tag[];
}

export interface CreateQuestionData {
  type_id: number;
  stem: string;
  answer?: string;
  explanation?: string;
  source_id?: number;
  options?: Omit<Option, 'id' | 'question_id'>[];
  tag_ids?: number[];
}

export interface UpdateQuestionData extends Partial<CreateQuestionData> {
  id: number;
}

// API响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页响应类型
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// 查询参数类型
export interface QuestionQueryParams {
  page?: number;
  pageSize?: number;
  type_id?: number;
  source_id?: number;
  tag_ids?: number[];
  search?: string;
}
