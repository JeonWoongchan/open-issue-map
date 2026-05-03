import { neon } from '@neondatabase/serverless'
import { env } from '@/lib/env'

const sql = neon(env.DATABASE_URL)
export default sql