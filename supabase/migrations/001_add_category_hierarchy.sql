-- 分类系统层级化迁移脚本
-- 添加 type 和 parent_id 字段支持二级分类

-- 1. 添加 type 字段，支持 campus（校区）、section（篇章）、general（通用）
ALTER TABLE categories ADD COLUMN type TEXT DEFAULT 'general' CHECK (type IN ('campus', 'section', 'general'));

-- 2. 添加 parent_id 字段，用于建立父子关系
ALTER TABLE categories ADD COLUMN parent_id UUID REFERENCES categories(id) ON DELETE CASCADE;

-- 3. 创建索引优化查询性能
CREATE INDEX idx_categories_type ON categories(type);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);

-- 4. 添加数据验证约束
-- 校区类型不能有父分类
ALTER TABLE categories ADD CONSTRAINT chk_campus_no_parent 
  CHECK (NOT (type = 'campus' AND parent_id IS NOT NULL));

-- 篇章类型必须有父分类（属于某个校区）
ALTER TABLE categories ADD CONSTRAINT chk_section_has_parent 
  CHECK (NOT (type = 'section' AND parent_id IS NULL));

-- 通用类型不能有父分类
ALTER TABLE categories ADD CONSTRAINT chk_general_no_parent 
  CHECK (NOT (type = 'general' AND parent_id IS NOT NULL));

-- 5. 更新现有数据，将所有现有分类标记为 general 类型
UPDATE categories SET type = 'general' WHERE type IS NULL;

-- 6. 设置默认值为 general（已在 ADD COLUMN 时设置）
ALTER TABLE categories ALTER COLUMN type SET DEFAULT 'general';

-- 7. 更新视图以支持树形结构
DROP VIEW IF EXISTS categories_with_services;

CREATE VIEW categories_with_services AS
WITH RECURSIVE category_tree AS (
  -- 根节点（一级分类）
  SELECT 
    c.id,
    c.name,
    c.icon,
    c.description,
    c.color,
    c.featured,
    c.sort_order,
    c.type,
    c.parent_id,
    c.created_at,
    c.updated_at,
    0 as level,
    ARRAY[c.id] as path
  FROM categories c
  WHERE c.parent_id IS NULL
  
  UNION ALL
  
  -- 子节点（二级分类）
  SELECT 
    c.id,
    c.name,
    c.icon,
    c.description,
    c.color,
    c.featured,
    c.sort_order,
    c.type,
    c.parent_id,
    c.created_at,
    c.updated_at,
    ct.level + 1,
    ct.path || c.id
  FROM categories c
  INNER JOIN category_tree ct ON c.parent_id = ct.id
)
SELECT 
    ct.id,
    ct.name,
    ct.icon,
    ct.description,
    ct.color,
    ct.featured,
    ct.sort_order,
    ct.type,
    ct.parent_id,
    ct.level,
    ct.path,
    ct.created_at,
    ct.updated_at,
    -- 获取直接子分类
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', child.id,
                'name', child.name,
                'icon', child.icon,
                'description', child.description,
                'color', child.color,
                'featured', child.featured,
                'sort_order', child.sort_order,
                'type', child.type,
                'created_at', child.created_at,
                'updated_at', child.updated_at
            ) ORDER BY child.sort_order, child.created_at
        )
        FROM categories child 
        WHERE child.parent_id = ct.id),
        '[]'::json
    ) AS children,
    -- 获取服务
    COALESCE(
        (SELECT json_agg(
            json_build_object(
                'id', s.id,
                'title', s.title,
                'description', s.description,
                'tags', s.tags,
                'image', s.image,
                'href', s.href,
                'status', s.status,
                'featured', s.featured,
                'sort_order', s.sort_order,
                'created_at', s.created_at,
                'updated_at', s.updated_at
            ) ORDER BY s.sort_order, s.created_at
        ) 
        FROM services s 
        WHERE s.category_id = ct.id), 
        '[]'::json
    ) AS services
FROM category_tree ct
ORDER BY ct.level, ct.sort_order, ct.created_at;

-- 8. 创建获取分类树的函数
CREATE OR REPLACE FUNCTION get_category_tree(category_type TEXT DEFAULT NULL)
RETURNS TABLE (
    id UUID,
    name TEXT,
    icon TEXT,
    description TEXT,
    color TEXT,
    featured BOOLEAN,
    sort_order INTEGER,
    type TEXT,
    parent_id UUID,
    level INTEGER,
    children JSON,
    services JSON,
    created_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT * FROM categories_with_services 
    WHERE (category_type IS NULL OR categories_with_services.type = category_type)
    ORDER BY categories_with_services.level, categories_with_services.sort_order, categories_with_services.created_at;
END;
$$ LANGUAGE plpgsql;

-- 9. 创建示例数据（可选，用于测试）
-- 插入校区数据
INSERT INTO categories (name, icon, description, color, type, featured, sort_order) VALUES
('沙河校区', '🏫', '北京航空航天大学沙河校区', 'blue', 'campus', true, 1),
('学院路校区', '🏛️', '北京航空航天大学学院路校区', 'green', 'campus', true, 2)
ON CONFLICT (name) DO NOTHING;

-- 获取校区ID并插入子篇章
DO $$
DECLARE
    shahe_id UUID;
    xueyuanlu_id UUID;
BEGIN
    -- 获取校区ID
    SELECT id INTO shahe_id FROM categories WHERE name = '沙河校区' AND type = 'campus';
    SELECT id INTO xueyuanlu_id FROM categories WHERE name = '学院路校区' AND type = 'campus';
    
    -- 为沙河校区添加篇章
    IF shahe_id IS NOT NULL THEN
        INSERT INTO categories (name, icon, description, color, type, parent_id, featured, sort_order) VALUES
        ('美食篇', '🍔', '沙河校区美食指南', 'orange', 'section', shahe_id, true, 1),
        ('娱乐篇', '🎮', '沙河校区娱乐活动', 'purple', 'section', shahe_id, true, 2),
        ('运动篇', '🏃', '沙河校区运动设施', 'red', 'section', shahe_id, false, 3)
        ON CONFLICT (name) DO NOTHING;
    END IF;
    
    -- 为学院路校区添加篇章
    IF xueyuanlu_id IS NOT NULL THEN
        INSERT INTO categories (name, icon, description, color, type, parent_id, featured, sort_order) VALUES
        ('美食篇', '🍜', '学院路校区美食指南', 'yellow', 'section', xueyuanlu_id, true, 1),
        ('娱乐篇', '🎭', '学院路校区娱乐活动', 'pink', 'section', xueyuanlu_id, true, 2)
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 10. 更新 RLS 策略以支持新字段
-- 删除旧的策略
DROP POLICY IF EXISTS "Allow public read access to categories" ON categories;

-- 创建新的策略
CREATE POLICY "Allow public read access to categories" ON categories
    FOR SELECT 
    USING (true);

COMMENT ON TABLE categories IS '分类表，支持两级分类：校区(campus) -> 篇章(section)，以及通用分类(general)';
COMMENT ON COLUMN categories.type IS '分类类型：campus(校区)、section(篇章)、general(通用)';
COMMENT ON COLUMN categories.parent_id IS '父分类ID，用于建立层级关系';