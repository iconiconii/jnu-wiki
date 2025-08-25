-- 创建管理员表
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 示例管理员账户（请在实际使用时修改用户名和密码）
-- 使用 bcrypt 生成密码哈希
-- INSERT INTO admins (username, password_hash) VALUES 
-- ('your_admin_username', 'your_bcrypt_hashed_password_here');

-- 注意：请勿在生产环境中使用默认凭据
-- 建议通过环境变量或安全的方式配置管理员账户