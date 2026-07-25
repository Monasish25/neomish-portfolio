-- Allow anyone to read feedback messages so they can be displayed as testimonials
CREATE POLICY "Allow public feedback reads" 
ON messages 
FOR SELECT 
USING (project_type = 'Feedback');
