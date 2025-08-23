-- 创建用于调用 Edge Function 的触发器

-- 创建触发器函数
CREATE OR REPLACE FUNCTION notify_submission_change()
RETURNS TRIGGER AS $$
DECLARE
  payload JSONB;
  function_url TEXT;
BEGIN
  -- 构建 payload
  payload := jsonb_build_object(
    'record', row_to_json(NEW),
    'type', TG_OP,
    'table', TG_TABLE_NAME
  );
  
  -- Edge Function URL (需要替换为你的实际 URL)
  function_url := 'https://your-project-id.supabase.co/functions/v1/send-notification';
  
  -- 异步调用 Edge Function
  PERFORM net.http_post(
    url := function_url,
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := payload::text
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器 - 新投稿时发送通知
CREATE TRIGGER trigger_notify_new_submission
  AFTER INSERT ON submissions
  FOR EACH ROW
  EXECUTE FUNCTION notify_submission_change();

-- 可选：状态更新时发送通知
-- CREATE TRIGGER trigger_notify_submission_update
--   AFTER UPDATE ON submissions
--   FOR EACH ROW
--   WHEN (OLD.status IS DISTINCT FROM NEW.status)
--   EXECUTE FUNCTION notify_submission_change();

-- 为了安全，创建一个存储服务密钥的设置
-- 在 Supabase Dashboard 中执行：
-- SELECT vault.create_secret('supabase-service-key', 'your-service-role-key-here', 'Edge Function Service Key');