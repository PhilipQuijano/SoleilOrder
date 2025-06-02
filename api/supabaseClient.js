import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://xixclrakkkxmcmpddkgk.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhpeGNscmFra2t4bWNtcGRka2drIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDcwNDM1ODUsImV4cCI6MjA2MjYxOTU4NX0.Q_DqJ7sXdqTb17C7cd1UOjk75jERR2TtOu7m0aC_y1c';

export const supabase = createClient(supabaseUrl, supabaseKey);