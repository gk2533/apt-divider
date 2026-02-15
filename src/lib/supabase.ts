import { createClient } from "@supabase/supabase-js";

// Server-side only Supabase client.
// These env vars are NOT prefixed with NEXT_PUBLIC_ so they are
// never bundled into the client-side JavaScript.
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);
