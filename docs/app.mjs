import {calculate,integer} from './plan.mjs'
import {readData,exportPlan} from './csv.mjs'

const el = id => document.getElementById(id)
const form = el('params'), field = name => form.elements.namedItem(name)
const num = value => value == null ? '—' : value.toLocaleString('pt-BR',{maximumFractionDigits:2})
const dateLabel = iso => iso.split('-').reverse().join('/')
const edits = new Map()
let data, plan, params, version = 0, demoFiles
function node(tag, text) {
  const element = document.createElement(tag)
  if (text !== undefined) element.textContent = text
  return element
}
function invalidate() {
  plan = null
  el('results').hidden = true
  el('message').textContent = ''
}
function compute() {
  invalidate()
  try {
    params = Object.fromEntries(new FormData(form))
    plan = calculate(data.stock,data.sales,params)
    el('results').hidden = false
    draw()
  } catch(e) { el('message').textContent = e.message }
}
function activate(next, demo) {
  invalidate()
  data = next
  edits.clear()
  form.reset()
  el('filter').value = 'all'
  el('workspace').hidden = false
  el('settings').open = !demo
  el('import').open = false
  el('demo').textContent = 'Restaurar demonstração'
  const dates = data.sales.map(s=>s.date).sort()
  el('source').textContent = (demo ? 'Demonstração · Papelaria fictícia' : 'Arquivos locais') + ' · ' + data.stock.length + ' produtos · ' + data.sales.length + ' registros de venda' + (dates.length ? ' · ' + dateLabel(dates[0]) + ' a ' + dateLabel(dates.at(-1)) : '')
  if (demo) {
    field('ref').value = field('end').value = '2026-10-28'
    field('start').value = '2026-10-01'
    field('covered').checked = true
    compute()
  } else el('message').textContent = 'Informe a data do saldo e confirme o histórico para calcular.'
}
function startLoad() {
  invalidate()
  el('workspace').hidden = true
  return ++version
}
el('demo').onclick = async () => {
  const current = startLoad()
  try {
    demoFiles ??= Promise.all(['estoque','vendas'].map(async name=>{
      const response = await fetch('./'+name+'.csv')
      if (!response.ok) throw Error('Falha ao abrir a demonstração.')
      return response.text()
    }))
    const texts = await demoFiles
    if (version === current) {el('upload').reset(); activate(readData(...texts),true)}
  } catch(e) {demoFiles = null; if (version === current) el('message').textContent = e.message}
}
el('upload').onchange = startLoad
el('upload').onsubmit = async event => {
  event.preventDefault()
  const current = startLoad()
  try {
    const files = ['stock','sales'].map(name=>el('upload').elements.namedItem(name).files[0])
    if (files.some(f=>f.size > 5000000)) throw Error('Cada arquivo deve ter até 5 MB.')
    const texts = await Promise.all(files.map(async file=>new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer())))
    if (version === current) activate(readData(...texts),false)
  } catch(e) { if (version === current) el('message').textContent = e.message }
}
form.oninput = event => {
  invalidate()
  if (['start','end','ref'].includes(event.target.name)) field('covered').checked = false
}
field('ref').onchange = () => {
  const ref = field('ref').value
  if (!ref) return
  field('end').value = ref
  const start = new Date(ref+'T00:00:00Z')
  start.setUTCDate(start.getUTCDate()-27)
  field('start').value = start.toISOString().slice(0,10)
}
form.onsubmit = event => {event.preventDefault(); compute()}
el('filter').onchange = draw
function draw() {
  const rows = plan.rows
  const buys = rows.filter(r=>r.sim?.buy > 0).length
  el('total').textContent = rows.length
  el('buys').textContent = buys
  el('alerts').textContent = rows.filter(r=>!r.sim || r.sim.risk).length
  el('period').textContent = 'Saldo em ' + dateLabel(params.ref) + ' · ' + plan.days + ' dias analisados · ' + plan.excluded + ' vendas fora do intervalo.' + (buys ? '' : ' Nenhuma compra automática sugerida.')
  const filtered = rows.filter(r=>({all:true,buy:r.sim?.buy > 0,risk:r.sim?.risk,missing:!r.sim})[el('filter').value])
  el('rows').replaceChildren(...filtered.map(product))
  if (!filtered.length) el('rows').append(node('p','Nenhum produto neste filtro.'))
}
function product(r) {
  const box = node('article')
  box.className = 'product'
  const identity = node('div')
  identity.append(node('strong',r.name),node('span',r.id + ' · ' + (!r.sim ? 'Sem histórico no período' : r.sim.risk ? 'Risco durante o prazo' : r.sim.buy ? 'Reposição sugerida' : 'Saldo suficiente')))
  box.append(identity)
  for (const [label,value] of [['Compra base',r.base?.buy],['No cenário',r.sim?.buy]]) {
    const cell = node('div')
    cell.append(node('span',label),node('b',value == null ? '—' : num(value)+' un.'))
    box.append(cell)
  }
  const label = node('label','Quantidade final')
  const input = node('input'), status = node('span')
  input.type = 'number'; input.min = '0'; input.max = '1000000000'; input.step = '1'
  const refresh = () => {
    input.value = edits.get(r.id) ?? r.sim?.buy ?? ''
    status.textContent = edits.has(r.id) ? 'Ajuste manual' : 'Sugestão do cenário'
  }
  refresh()
  input.oninput = () => {
    if (input.validity.badInput || !input.validity.valid) {
      status.textContent = 'Informe uma quantidade inteira válida.'
      return
    }
    if (input.value === '') { edits.delete(r.id); status.textContent = 'Usar sugestão do cenário' }
    else { edits.set(r.id,integer(input.valueAsNumber)); status.textContent = 'Ajuste manual' }
  }
  input.onblur = () => { if (input.validity.valid) refresh() }
  label.append(input,status)
  const detail = node('details')
  detail.append(node('summary','Memória de cálculo'))
  const description = r.base ? 'Foram vendidas ' + num(r.sold) + ' un. em ' + plan.days + ' dias. Média de ' + num(r.base.mean) + ' un./dia. Alvo base de ' + num(r.base.target) + ' un. menos saldo de ' + num(r.balance) + ' un. resulta em compra de ' + num(r.base.buy) + ' un. (mínimo zero). Cobertura base de ' + num(r.base.coverage) + ' dias. No cenário, média de ' + num(r.sim.mean) + ' un./dia e alvo de ' + num(r.sim.target) + ' un. Cobertura estimada no cenário: ' + (r.sim.coverage == null ? 'indisponível.' : num(r.sim.coverage) + ' dias.') : 'Saldo de ' + num(r.balance) + ' un. Sem vendas no período para estimar demanda ou cobertura. A quantidade final pode ser preenchida manualmente.'
  detail.append(node('p',description))
  box.append(label,detail)
  return box
}
el('export').onclick = () => {
  const invalid = el('rows').querySelector('input:invalid')
  if (invalid) {invalid.reportValidity(); return}
  const url = URL.createObjectURL(new Blob([exportPlan(plan,params,edits)],{type:'text/csv;charset=utf-8'}))
  const link = node('a')
  link.href = url; link.download = 'plano-de-compras-'+params.ref+'.csv'; link.click()
  setTimeout(()=>URL.revokeObjectURL(url),1000)
}
