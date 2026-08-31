const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const main=fs.readFileSync(path.join(__dirname,'..','main.cjs'),'utf8');

test('diagnostic open still supports both launch triggers without disabling blur',()=>{
  assert.match(main,/process\.argv\.includes\("--open"\)/);
  assert.match(main,/process\.env\.PTB_OPEN\s*===\s*"1"/);
  assert.doesNotMatch(main,/if \(diagnosticOpen\) return;/);
});
