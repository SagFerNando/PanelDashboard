import { createClient } from "@supabase/supabase-js";
import { CONFIG } from "../config/config";

export const supabase = createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
