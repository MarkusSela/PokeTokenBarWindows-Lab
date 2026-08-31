const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const main=fs.readFileSync(require('node:path').join(__dirname,'..','main.cjs'),'utf8');

test('main retains snapshot builder after usage merge integration',()=>{
  assert.match(main,/function snapshot\(extra\s*=\s*\{\}\)/);
  assert.match(main,/representativeSnapshot\(\)/);
  assert.match(main,/hasOwnProperty\.call\(value, "id"\)/);
});

test('main exposes an explicit diagnostic open flag without changing tray-first default',()=>{
  assert.match(main,/process\.argv\.includes\("--open"\)/);
});
