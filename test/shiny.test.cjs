const test=require('node:test');
const assert=require('node:assert/strict');
const {Game}=require('../core/game.cjs');
const line={baseId:543,pathIds:[543,544,545],rarity:'common',names:{543:'Venipede',544:'Whirlipede',545:'Scolipede'}};
test('shiny hatch uses 1/64 odds normally and 1/48 with Shiny Charm',()=>{
  const normal=new Game({rng:()=>0.02,state:{eggUsage:5_000_000}});assert.equal(normal.hatchLine(line),true);assert.equal(normal.state.active.shiny,false);
  const boosted=new Game({rng:()=>0.02,state:{eggUsage:5_000_000,inventory:{shinyCharm:1}}});assert.equal(boosted.hatchLine(line),true);assert.equal(boosted.state.active.shiny,true);
});

test('rare egg candidate pool admits legendary lines',()=>{
  const legendary={baseId:150,pathIds:[150],rarity:'legendary',names:{150:'Mewtwo'}};
  const game=new Game({
    rng:()=>0,
    catalog:[{id:150,captureRate:3,line:legendary}],
    state:{eggTier:'rare',eggUsage:5_000_000},
  });
  assert.equal(game.chooseBase().line.rarity,'legendary');
  assert.equal(game.hatch(),true);
  assert.equal(game.state.active.rarity,'legendary');
});
