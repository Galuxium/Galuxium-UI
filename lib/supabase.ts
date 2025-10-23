import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://yyajztqaudgsmiinqwnr.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5YWp6dHFhdWRnc21paW5xd25yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIxNDgxMjEsImV4cCI6MjA2NzcyNDEyMX0.H1jUjivpSkRCFhzZenwhdCZDdmmL19TIXPOch9zOTsk'

export const supabase = createClient(supabaseUrl, supabaseKey)