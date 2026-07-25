const url = 'https://dpqvnbgwjltkfwzbuoet.supabase.co/rest/v1/projects?select=id,title';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRwcXZuYmd3amx0a2Z3emJ1b2V0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ2MTcyNjYsImV4cCI6MjEwMDE5MzI2Nn0.PPGo4a1PrsTeJXzO1RlicIeK7R5h74MAifTGbg1v20Y';
fetch(url, { headers: { 'apikey': key, 'Authorization': `Bearer ${key}` }})
  .then(r => r.text())
  .then(console.log)
  .catch(console.error);
