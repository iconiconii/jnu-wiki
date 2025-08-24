-- 创建反馈表
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  contact_info TEXT, -- 可选联系方式（邮箱或其他）
  user_agent TEXT,
  page_url TEXT,
  browser_info JSONB,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  admin_reply TEXT,
  tags TEXT[] DEFAULT '{}',
  submitted_ip TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以优化查询性能
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_type ON feedback(type);
CREATE INDEX idx_feedback_priority ON feedback(priority);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);
CREATE INDEX idx_feedback_updated_at ON feedback(updated_at);

-- 创建触发器自动更新 updated_at
CREATE TRIGGER update_feedback_updated_at 
    BEFORE UPDATE ON feedback 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) 策略
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- 允许匿名用户插入反馈（但不能查看）
CREATE POLICY "Allow anonymous feedback submissions" ON feedback
    FOR INSERT 
    WITH CHECK (true);

-- 只有认证用户可以查看反馈（用于管理员）
CREATE POLICY "Allow authenticated users to view feedback" ON feedback
    FOR SELECT 
    USING (auth.role() = 'authenticated');

-- 只有认证用户可以更新反馈状态（用于管理员）
CREATE POLICY "Allow authenticated users to update feedback" ON feedback
    FOR UPDATE 
    USING (auth.role() = 'authenticated');

-- 创建一个函数来获取反馈统计
CREATE OR REPLACE FUNCTION get_feedback_stats()
RETURNS JSON AS $$
BEGIN
  RETURN (
    SELECT json_build_object(
      'total', COUNT(*),
      'open', COUNT(*) FILTER (WHERE status = 'open'),
      'in_progress', COUNT(*) FILTER (WHERE status = 'in_progress'),
      'resolved', COUNT(*) FILTER (WHERE status = 'resolved'),
      'closed', COUNT(*) FILTER (WHERE status = 'closed'),
      'by_type', json_build_object(
        'bug', COUNT(*) FILTER (WHERE type = 'bug'),
        'feature', COUNT(*) FILTER (WHERE type = 'feature'),
        'improvement', COUNT(*) FILTER (WHERE type = 'improvement'),
        'other', COUNT(*) FILTER (WHERE type = 'other')
      ),
      'by_priority', json_build_object(
        'low', COUNT(*) FILTER (WHERE priority = 'low'),
        'normal', COUNT(*) FILTER (WHERE priority = 'normal'),
        'high', COUNT(*) FILTER (WHERE priority = 'high'),
        'urgent', COUNT(*) FILTER (WHERE priority = 'urgent')
      )
    )
    FROM feedback
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建反馈视图（包含统计信息）
CREATE VIEW feedback_with_stats AS
SELECT 
    f.*,
    CASE 
        WHEN f.created_at > NOW() - INTERVAL '1 hour' THEN 'recent'
        WHEN f.created_at > NOW() - INTERVAL '1 day' THEN 'today'
        WHEN f.created_at > NOW() - INTERVAL '1 week' THEN 'this_week'
        ELSE 'older'
    END as recency,
    CASE 
        WHEN f.status = 'open' AND f.priority IN ('high', 'urgent') THEN true
        ELSE false
    END as needs_attention
FROM feedback f
ORDER BY 
    CASE f.priority
        WHEN 'urgent' THEN 1
        WHEN 'high' THEN 2
        WHEN 'normal' THEN 3
        WHEN 'low' THEN 4
    END,
    f.created_at DESC;