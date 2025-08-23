-- 创建简单的管理员表
CREATE TABLE admins (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 插入管理员账户 (用户名: admin, 密码: Coolhao.12345)
-- 密码哈希是用 bcrypt 生成的
INSERT INTO admins (username, password_hash) VALUES 
('admin', '$2b$10$ved6mcbDeTkICcAU.blop.tPwfQ6p8dd2QsIYAhsC0.U4WOciX3ey');

-- 或者使用邮箱作为用户名
INSERT INTO admins (username, password_hash) VALUES 
('neverlookback20@163.com', '$2b$10$ved6mcbDeTkICcAU.blop.tPwfQ6p8dd2QsIYAhsC0.U4WOciX3ey');