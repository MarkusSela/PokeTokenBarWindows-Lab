const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const main=fs.readFileSync(path.join(__dirname,'..','main.cjs'),'utf8');

const policy=fs.readFileSync(path.join(__dirname,'..','core','popover-focus-policy.cjs'),'utf8');

test('popover blur delegates closing to the outside-pointer policy',()=>{
  assert.match(main,/const diagnosticOpen\s*=/);
  assert.match(main,/shouldHidePopoverOnBlur/);
  assert.match(main,/screen\.getCursorScreenPoint\(\)/);
  assert.match(policy,/function shouldHidePopoverOnBlur/);
});
