const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const { PokeApi }=require('../core/pokeapi.cjs');
const main=fs.readFileSync(path.join(__dirname,'..','main.cjs'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');

test('Gen 5 fallback lines exclude post-Gen 5 evolutions',async()=>{
  const api=new PokeApi(path.join(__dirname,'..','assets','.test-cache'));
  const line=await api.line(56);
  assert.equal(line.pathOptions.some(p=>p.includes(979)),false);
});

test('shiny sprites use the PokéAPI animated shiny path',()=>{
  assert.match(html,/animated\/\$\{[^}]*\?['"]shiny\/['"]:['"]['"]\}/);
  assert.doesNotMatch(html,/animated\/\$\{[^}]*\?['"]-shiny['"]:/);
});
