-- 创建投稿表
CREATE TABLE submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  url TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_by TEXT,
  submitted_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以优化查询性能
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_category ON submissions(category);
CREATE INDEX idx_submissions_created_at ON submissions(created_at);

-- 创建触发器自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_submissions_updated_at 
    BEFORE UPDATE ON submissions 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) 策略
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户插入投稿（但不能查看）
CREATE POLICY "Allow anonymous submissions" ON submissions
    FOR INSERT 
    WITH CHECK (true);

-- 只有认证用户可以查看投稿（用于管理员）
CREATE POLICY "Allow authenticated users to view submissions" ON submissions
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 只有认证用户可以更新投稿状态（用于管理员）
CREATE POLICY "Allow authenticated users to update submissions" ON submissions
    FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- 创建一个函数来获取投稿统计
CREATE OR REPLACE FUNCTION get_submission_stats()
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'total', COUNT(*),
      'pending', COUNT(*) FILTER (WHERE status = 'pending'),
      'approved', COUNT(*) FILTER (WHERE status = 'approved'),
      'rejected', COUNT(*) FILTER (WHERE status = 'rejected')
    )
    FROM submissions
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;