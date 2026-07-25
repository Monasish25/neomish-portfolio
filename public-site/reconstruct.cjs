const fs = require('fs');
const readline = require('readline');
const path = 'C:\\Users\\monas\\.gemini\\antigravity-ide\\brain\\c77932eb-26e9-4896-8750-efcc6afd9b64\\.system_generated\\logs\\transcript_full.jsonl';

async function main() {
  const rl = readline.createInterface({ input: fs.createReadStream(path) });
  const allSteps = [];
  for await (const line of rl) {
    try {
      allSteps.push(JSON.parse(line));
    } catch(e) {}
  }
  
  // Step 1: Get initial file content from step 5 (VIEW_FILE showing lines 1-800)
  // and any other VIEW_FILE steps that show remaining lines
  let fileLines = [];
  
  // Find all VIEW_FILE entries for Portfolio.jsx
  const viewSteps = allSteps.filter(s => s.type === 'VIEW_FILE' && s.content && s.content.includes('Portfolio.jsx'));
  
  console.log('Found ' + viewSteps.length + ' VIEW_FILE entries');
  
  // Step 5 has lines 1-800 (initial file, 963 lines total)
  const step5 = viewSteps.find(s => s.step_index === 5);
  if (step5) {
    const lines = step5.content.split('\n');
    for (const l of lines) {
      const match = l.match(/^(\d+): (.*)$/);
      if (match) {
        const lineNum = parseInt(match[1]);
        fileLines[lineNum - 1] = match[2];
      }
    }
    console.log('After step 5: ' + fileLines.length + ' lines populated');
  }
  
  // We need lines 801-963 from other views or from the code itself
  // Look for views that showed lines beyond 800
  for (const v of viewSteps) {
    if (v.step_index === 5) continue;
    const lines = v.content.split('\n');
    for (const l of lines) {
      const match = l.match(/^(\d+): (.*)$/);
      if (match) {
        const lineNum = parseInt(match[1]);
        if (lineNum > fileLines.length || !fileLines[lineNum - 1]) {
          while (fileLines.length < lineNum) fileLines.push('');
          fileLines[lineNum - 1] = match[2];
        }
      }
    }
  }
  
  console.log('After all views: ' + fileLines.length + ' lines');
  
  // Now apply diffs in order
  // Find all CODE_ACTION steps with diff content for Portfolio.jsx
  const diffSteps = allSteps.filter(s => 
    s.type === 'CODE_ACTION' && 
    s.content && 
    s.content.includes('diff_block_start') && 
    s.content.includes('Portfolio.jsx')
  ).sort((a, b) => a.step_index - b.step_index);
  
  console.log('Found ' + diffSteps.length + ' diff steps');
  
  for (const ds of diffSteps) {
    // Skip step 124 which is the failed/empty edit
    if (ds.step_index >= 123) {
      console.log('Skipping step ' + ds.step_index + ' (destructive edit)');
      continue;
    }
    
    const diffContent = ds.content;
    // Parse unified diff
    const diffMatch = diffContent.match(/\[diff_block_start\]([\s\S]*?)\[diff_block_end\]/);
    if (!diffMatch) continue;
    
    const diff = diffMatch[1];
    const hunks = diff.split(/^@@/m).slice(1);
    
    console.log('Step ' + ds.step_index + ': ' + hunks.length + ' hunks');
    
    // Apply hunks in reverse order to maintain line numbers
    const hunkData = [];
    for (const hunk of hunks) {
      const headerMatch = hunk.match(/\s*-(\d+),?\d*\s*\+(\d+),?\d*\s*@@/);
      if (!headerMatch) continue;
      
      const oldStart = parseInt(headerMatch[1]);
      const lines = hunk.split('\n').slice(1); // skip header
      
      const removedLines = [];
      const addedLines = [];
      let contextBefore = 0;
      let seenChange = false;
      
      for (const l of lines) {
        if (l.startsWith('-')) {
          seenChange = true;
          removedLines.push(l.substring(1));
        } else if (l.startsWith('+')) {
          seenChange = true;
          addedLines.push(l.substring(1));
        } else if (l.startsWith(' ')) {
          if (!seenChange) contextBefore++;
        }
      }
      
      hunkData.push({
        startLine: oldStart + contextBefore - 1, // 0-indexed
        removedLines,
        addedLines
      });
    }
    
    // Apply in reverse to preserve line numbers
    hunkData.sort((a, b) => b.startLine - a.startLine);
    for (const h of hunkData) {
      fileLines.splice(h.startLine, h.removedLines.length, ...h.addedLines);
    }
    
    console.log('After step ' + ds.step_index + ': ' + fileLines.length + ' lines');
  }
  
  // Save result
  const output = fileLines.join('\n');
  fs.writeFileSync('C:\\Users\\monas\\portfolio_recovered.jsx', output);
  console.log('Final file: ' + fileLines.length + ' lines, ' + output.length + ' bytes');
}

main().catch(console.error);
