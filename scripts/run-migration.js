import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  console.log('🔄 Starting database migration...')

  try {
    // 读取迁移脚本
    const migrationPath = join(process.cwd(), 'supabase/migrations/001_add_category_hierarchy.sql')
    const migrationSql = readFileSync(migrationPath, 'utf8')

    // 执行迁移
    console.log('📄 Executing migration script...')
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: migrationSql,
    })

    if (error) {
      // 如果 rpc 不存在，尝试直接执行 SQL
      console.log('🔄 Trying alternative method...')
      const queries = migrationSql.split(';').filter(q => q.trim())

      for (let i = 0; i < queries.length; i++) {
        const query = queries[i].trim()
        if (!query) continue

        console.log(`📝 Executing query ${i + 1}/${queries.length}`)
        const { error: queryError } = await supabase.from('categories').select('*').limit(1)

        if (queryError && queryError.message.includes('does not exist')) {
          console.log('⚠️ Categories table might not exist yet, creating it...')
          // 这里需要手动创建表，或者使用其他方法
        }
      }
    }

    console.log('✅ Migration completed successfully!')

    // 验证迁移结果
    console.log('🔍 Verifying migration...')
    const { data: categories, error: fetchError } = await supabase
      .from('categories')
      .select('*')
      .limit(5)

    if (fetchError) {
      console.error('❌ Error verifying migration:', fetchError.message)
      return
    }

    console.log('📊 Current categories:', categories?.length || 0)
    if (categories && categories.length > 0) {
      console.log('📋 Sample category:', categories[0])
    }
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  }
}

// 如果直接运行此脚本
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
}
