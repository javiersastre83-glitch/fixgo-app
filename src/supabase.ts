import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://kvemmluxgdlhandjpbfn.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZW1tbHV4Z2RsaGFuZGpwYmZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk4NTM3MjcsImV4cCI6MjA5NTQyOTcyN30.3lAmFsL12eCFz159F3PseXGAvydPFxpc5edI5LWIA7E'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
