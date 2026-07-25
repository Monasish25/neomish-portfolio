import { createClient } from '@supabase/supabase-js';

const url = 'https://dpqvnbgwjltkfwzbuoet.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXZuYmd3amx0a2Z3emJ1b2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTcyNjYsImV4cCI6MjEwMDE5MzI2Nn0.PPGo4a1PrsTeJXzO1RlicIeK7R5h74MAifTGbg1v20Y';
const supabase = createClient(url, key);

console.log("Connecting...");
supabase.channel('test-channel')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'settings' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe((status) => console.log('Subscribed:', status));

setTimeout(() => { console.log("Timeout"); process.exit(0); }, 15000);
