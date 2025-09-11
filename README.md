# 高中生物竞赛题目管理系统

一个基于 Next.js 和 MySQL 的高中生物竞赛题目管理系统，支持多种题型和标签分类。

## 功能特点

- **多题型支持**: 支持单选、多选、判断、简答等题型
- **智能搜索**: 支持按内容、标签、来源等多维度搜索
- **标签分类**: 灵活的知识点标签系统
- **来源管理**: 管理题目来源，如真题、自编题等
- **易于使用**: 简洁直观的用户界面

## 技术栈

- **前端**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **后端**: Next.js API Routes
- **数据库**: MySQL 8.0+
- **ORM**: 原生 MySQL2

## 数据库设计

### 表结构

1. **question_types** - 题目类型字典
2. **sources** - 题目来源字典
3. **tags** - 知识点标签字典
4. **questions** - 题目主体
5. **options** - 题目选项
6. **question_tags** - 题目-标签关联

### 初始化数据库

请先执行以下SQL语句创建数据库和表：

```sql
-- 创建数据库
CREATE DATABASE biology_competition CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- 使用数据库
USE biology_competition;

-- 创建题目类型表
CREATE TABLE question_types (
    id          TINYINT      PRIMARY KEY AUTO_INCREMENT,
    type_name   VARCHAR(20)  NOT NULL UNIQUE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '题目类型字典';

-- 插入题目类型数据
INSERT INTO question_types (type_name) VALUES
('单选'), ('多选'), ('判断'), ('简答');

-- 创建来源表
CREATE TABLE sources (
    id          INT          PRIMARY KEY AUTO_INCREMENT,
    source_name VARCHAR(255) NOT NULL UNIQUE,
    created_at  TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '题目来源字典';

-- 创建标签表
CREATE TABLE tags (
    id        INT          PRIMARY KEY AUTO_INCREMENT,
    tag_name  VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP   DEFAULT CURRENT_TIMESTAMP
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '知识点标签字典';

-- 创建题目表
CREATE TABLE questions (
    id            BIGINT       PRIMARY KEY AUTO_INCREMENT,
    type_id       TINYINT      NOT NULL,
    stem          TEXT         NOT NULL,
    answer        TEXT         COMMENT '简答、判断、单选/多选均可存储',
    explanation   TEXT         COMMENT '解析',
    source_id     INT,
    created_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_q_type   FOREIGN KEY (type_id)   REFERENCES question_types(id),
    CONSTRAINT fk_q_source FOREIGN KEY (source_id) REFERENCES sources(id)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '题目主体';

-- 创建选项表
CREATE TABLE options (
    id           BIGINT  PRIMARY KEY AUTO_INCREMENT,
    question_id  BIGINT  NOT NULL,
    opt_label    VARCHAR(10) NOT NULL COMMENT 'A/B/C/D 或 对/错',
    opt_content  TEXT    NOT NULL,
    is_correct   BOOLEAN NOT NULL DEFAULT 0,
    sort_order   TINYINT NOT NULL DEFAULT 0,
    CONSTRAINT fk_opt_q   FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    UNIQUE KEY uk_q_label (question_id, opt_label)
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '题目选项';

-- 创建题目标签关联表
CREATE TABLE question_tags (
    question_id BIGINT NOT NULL,
    tag_id      INT    NOT NULL,
    PRIMARY KEY (question_id, tag_id),
    CONSTRAINT fk_qt_q FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    CONSTRAINT fk_qt_t FOREIGN KEY (tag_id)      REFERENCES tags(id)      ON DELETE CASCADE
) ENGINE = InnoDB
  DEFAULT CHARSET = utf8mb4
  COMMENT = '题目-标签关联';
```

## 安装和运行

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

创建 `.env.local` 文件并配置数据库连接：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=biology_competition

# Next.js配置
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. 运行开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 使用说明

### 题目管理

1. **创建题目**: 点击"创建题目"按钮，填写题目信息
2. **编辑题目**: 在题目列表中点击"编辑"按钮
3. **删除题目**: 在题目列表中点击"删除"按钮
4. **搜索题目**: 使用搜索框和筛选条件查找题目

### 标签管理

1. **创建标签**: 在标签管理页面点击"创建标签"按钮
2. **编辑标签**: 点击标签列表中的"编辑"按钮
3. **删除标签**: 点击标签列表中的"删除"按钮
4. **搜索标签**: 使用搜索框查找标签

### 来源管理

1. **创建来源**: 在来源管理页面点击"创建来源"按钮
2. **编辑来源**: 点击来源列表中的"编辑"按钮
3. **删除来源**: 点击来源列表中的"删除"按钮
4. **搜索来源**: 使用搜索框查找来源

## API 接口

### 题目相关

- `GET /api/questions` - 获取题目列表
- `POST /api/questions` - 创建题目
- `GET /api/questions/[id]` - 获取题目详情
- `PUT /api/questions/[id]` - 更新题目
- `DELETE /api/questions/[id]` - 删除题目

### 标签相关

- `GET /api/tags` - 获取标签列表
- `POST /api/tags` - 创建标签
- `PUT /api/tags/[id]` - 更新标签
- `DELETE /api/tags/[id]` - 删除标签

### 来源相关

- `GET /api/sources` - 获取来源列表
- `POST /api/sources` - 创建来源
- `PUT /api/sources/[id]` - 更新来源
- `DELETE /api/sources/[id]` - 删除来源

### 题目类型相关

- `GET /api/question-types` - 获取题目类型列表

## 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API 路由
│   │   ├── questions/     # 题目相关 API
│   │   ├── tags/          # 标签相关 API
│   │   ├── sources/       # 来源相关 API
│   │   └── question-types/ # 题目类型相关 API
│   ├── questions/         # 题目管理页面
│   ├── tags/              # 标签管理页面
│   ├── sources/           # 来源管理页面
│   └── page.tsx           # 首页
├── lib/                   # 工具库
│   └── database.ts        # 数据库连接
├── types/                 # TypeScript 类型定义
│   └── database.ts        # 数据库类型
└── globals.css            # 全局样式
```

## 注意事项

1. 确保 MySQL 数据库已正确安装并运行
2. 确保数据库用户有足够的权限创建表和插入数据
3. 在生产环境中，请修改默认的数据库密码
4. 建议定期备份数据库数据

## 开发说明

- 使用 TypeScript 确保类型安全
- 使用 Tailwind CSS 进行样式设计
- 遵循 Next.js 最佳实践
- 使用 MySQL2 进行数据库操作
- 实现了完整的 CRUD 操作
- 支持分页和搜索功能

## 许可证

MIT License