const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const html=fs.readFileSync(require('node:path').join(__dirname,'..','index.html'),'utf8');

test('Pokedex aggregates shiny ownership and raising state across records',()=>{
  assert.match(html,/current\.shiny\s*=\s*current\.shiny\|\|Boolean\(x\.shiny\)/);
  assert.match(html,/isRaising/);
});

test('rarity filters are interactive for dex and catch log views',()=>{
  assert.match(html,/dexRarityFilter/);
  assert.match(html,/logRarityFilter/);
  assert.match(html,/onclick=/);
  assert.match(html,/\$\{key\}='\$\{r\}'/);
  assert.match(html,/logRarityFilter/);
});
