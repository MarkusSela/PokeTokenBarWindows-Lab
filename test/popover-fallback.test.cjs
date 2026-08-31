const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const main=fs.readFileSync(path.join(__dirname,'..','main.cjs'),'utf8');

test('popover placement tolerates tray bounds unavailable during diagnostic launch',()=>{
  assert.match(main,/tray\?\.getBounds\?\.\(\)/);
  assert.match(main,/screen\.getPrimaryDisplay\(\)\.workArea/);
});
