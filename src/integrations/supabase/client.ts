// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://iivoxaqqamovmagbwmeh.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlpdm94YXFxYW1vdm1hZ2J3bWVoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ0NDE1MDcsImV4cCI6MjA2MDAxNzUwN30.vMo5vSZ74tU8XfoaeZKJeJ_eQ3ilAdLX05w_qawTW2U";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);