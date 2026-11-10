import test from 'node:test'
import assert from 'node:assert/strict'
import {readFileSync} from 'node:fs'
import {calculate} from '../src/domain/plan.ts'
import {readData,exportPlan} from '../src/domain/csv.ts'
const file = n=>readFileSync(new URL('../examples/'+n+'.csv',import.meta.url),'utf8')
const stock=file('estoque'), sales=file('vendas'), data=readData(stock,sales)
const defaults={start:'2026-10-01',end:'2026-10-28',ref:'2026-10-28',covered:true,lead:3,review:7,safety:2,change:20,delay:2}
const run = p=>calculate(data.stock,data.sales,{...defaults,...p})
test('Exemplo do briefing e estados de estoque',()=>{
 const [caderno,,bloco,,pasta]=run().rows
 assert.deepEqual([caderno.base.buy,caderno.sim.buy,caderno.base.coverage],[40,64,4])
 assert.equal(bloco.base.buy,0)
 assert.equal(pasta.sim,null)
 assert.equal(caderno.id,'001')
 assert.equal(run({change:-100}).rows[0].sim.coverage,null)
 assert.equal(run({change:-100}).rows[0].sim.buy,0)
})
test('Datas inclusivas, confirmação e arredondamento',()=>{
 assert.equal(run({start:defaults.end}).days,1)
 assert.throws(()=>run({covered:false}))
 assert.throws(()=>run({start:'2026-11-01'}))
 assert.throws(()=>run({ref:'2026-02-30'}))
 const p=calculate(data.stock,[{id:'001',qty:1,date:defaults.start}],defaults)
 assert.equal(p.rows[0].base.target,1)
})
test('Importação e erros acionáveis',()=>{
 assert.equal(readData('\uFEFF'+stock.replaceAll('\n','\r\n').replace('Caderno pontilhado','"Caderno, azul"'),sales).stock[0].name,'Caderno, azul')
 assert.throws(()=>readData(stock+'\n001,X,0',sales),/repetido/)
 assert.throws(()=>readData(stock,sales+'\n2026-10-01,999,1'),/999/)
 assert.throws(()=>readData(stock,sales+'\n2026-10-01,001,1.5'),/quantidade/)
})
test('Exportação mantém originais e protege campos textuais',()=>{
 const p=run()
 p.rows[0].name='=1+1'
 const csv=exportPlan(p,defaults,new Map([['001',50]]))
 assert.ok(csv.includes('"001","\'=1+1","20","140","40","64","50","sim"'))
})
