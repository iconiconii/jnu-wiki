-- 创建分类表
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  color TEXT DEFAULT 'blue',
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建服务表
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[] DEFAULT '{}',
  image TEXT,
  href TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'coming-soon', 'maintenance')),
  featured BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以优化查询性能
CREATE INDEX idx_categories_sort_order ON categories(sort_order);
CREATE INDEX idx_categories_featured ON categories(featured);
CREATE INDEX idx_services_category_id ON services(category_id);
CREATE INDEX idx_services_status ON services(status);
CREATE INDEX idx_services_featured ON services(featured);
CREATE INDEX idx_services_sort_order ON services(sort_order);

-- 创建触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为分类表添加更新触发器
CREATE TRIGGER update_categories_updated_at 
    BEFORE UPDATE ON categories 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 为服务表添加更新触发器
CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) 策略
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;

-- 允许所有用户查看分类和服务（公开数据）
CREATE POLICY "Allow public read access to categories" ON categories
    FOR SELECT 
    USING (true);

CREATE POLICY "Allow public read access to services" ON services
    FOR SELECT 
    USING (true);

-- 只有认证用户可以修改分类和服务（管理员功能）
CREATE POLICY "Allow authenticated users to manage categories" ON categories
    FOR ALL 
    USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to manage services" ON services
    FOR ALL 
    USING (auth.role() = 'authenticated');

-- 插入初始数据（从现有配置迁移）
INSERT INTO categories (name, icon, description, featured, sort_order) VALUES
('有关学习', '🎓', '学习内容、学习工具', true, 1);

-- 获取刚插入的分类ID并插入服务
DO $$
DECLARE
    learning_category_id UUID;
BEGIN
    SELECT id INTO learning_category_id FROM categories WHERE name = '有关学习';
    
    INSERT INTO services (category_id, title, description, tags, href, status, featured, sort_order) VALUES
    (learning_category_id, 'Ai-提效篇', '一些使用Ai提效的工具和个人心得', ARRAY['Ai'], 'https://example.com', 'active', true, 1);
END $$;

-- 创建视图简化查询
CREATE VIEW categories_with_services AS
SELECT 
    c.id,
    c.name,
    c.icon,
    c.description,
    c.color,
    c.featured,
    c.sort_order,
    c.created_at,
    c.updated_at,
    COALESCE(
        json_agg(
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
        ) FILTER (WHERE s.id IS NOT NULL), 
        '[]'::json
    ) AS services
FROM categories c
LEFT JOIN services s ON c.id = s.category_id
GROUP BY c.id, c.name, c.icon, c.description, c.color, c.featured, c.sort_order, c.created_at, c.updated_at
ORDER BY c.sort_order, c.created_at;