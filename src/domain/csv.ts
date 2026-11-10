import {day,integer} from './plan.ts'
import type {Plan, Parameters} from './plan.ts'

export const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error)

function parse(text: string) {
  text = text.replace(/^\uFEFF/,'').replace(/\r\n?/g,'\n')
  const rows = []
  let cells: string[] = [], value = '', quoted = false, closed = false, line = 1, start = 1
  for (let i=0; i<=text.length; i++) {
    const c = text[i]
    if (quoted) {
      if (c === undefined) throw Error('Linha ' + start + ': aspas sem fechamento.')
      if (c === '"' && text[i+1] === '"') { value += '"'; i++ }
      else if (c === '"') { quoted = false; closed = true }
      else { value += c; if (c === '\n') line++ }
    } else if (c === ',' || c === '\n' || c === undefined) {
      cells.push(value)
      value = ''; closed = false
      if (c !== ',') {
        if (cells.length > 1 || cells[0] !== '') rows.push({cells,line:start})
        cells = []; start = ++line
      }
    } else if (c === '"' && !value && !closed) quoted = true
    else if (closed || c === '"') throw Error('Linha ' + line + ': aspas inválidas.')
    else value += c
  }
  return rows
}
export function readData(stockText: string, salesText: string) {
  const ids = new Set<string>(), missing = new Set<string>(), errors: string[] = []
  function read<T>(text: string, label: string, headers: string, convert: (a: string, b: string, c: string) => T) {
    const [header,...rows] = parse(text)
    if (!header || header.cells.join(',') !== headers || header.cells.length !== 3) throw Error(label + ': cabeçalho esperado ' + headers)
    const result = []
    for (const {cells,line} of rows) {
      try {
        if (cells.length !== 3) throw Error('Esperadas três colunas.')
        result.push(convert(cells[0].trim(), cells[1].trim(), cells[2].trim()))
      } catch (e) { if (errors.length < 25) errors.push(label + ', linha ' + line + ': ' + errorMessage(e)) }
    }
    return result
  }
  const stock = read(stockText,'Estoque','produto_id,produto_nome,estoque_atual',(id,name,value)=>{
    if (!id || !name) throw Error('Preencha produto_id e produto_nome.')
    if (ids.has(id)) throw Error('produto_id repetido: ' + id)
    ids.add(id)
    try { return {id,name,balance:integer(value)} } catch(e) {throw Error('estoque_atual: ' + errorMessage(e))}
  })
  const sales = read(salesText,'Vendas','data,produto_id,quantidade',(date,id,value)=>{
    try { day(date) } catch(e) { throw Error('data: ' + errorMessage(e)) }
    if (!ids.has(id)) missing.add(id || '(vazio)')
    try { return {date,id,qty:integer(value,1)} } catch(e) {throw Error('quantidade: ' + errorMessage(e))}
  })
  if (missing.size) errors.push('produto_id ausente no estoque: ' + [...missing].join(', '))
  if (!stock.length) errors.push('O estoque precisa de pelo menos um produto.')
  if (errors.length) throw Error(errors.join('\n'))
  return {stock,sales}
}
export function exportPlan(plan: Plan, params: Parameters, edits: ReadonlyMap<string,number>) {
  function quote(cell: string | number | undefined) {
    let value = String(cell ?? '')
    if (typeof cell === 'string' && /^\s*[=+@\-\t\r\n]/.test(value)) value = "'" + value
    return '"' + value.replaceAll('"','""') + '"'
  }
  const keys = ['referencia','inicio','fim','prazo','revisao','seguranca','demanda_pct','atraso']
  const rows: (string | number | undefined)[][] = [['produto_id','produto_nome','estoque_atual','vendas','sugestao_original','sugestao_cenario','quantidade_aprovada','ajuste_manual',...keys]]
  for (const r of plan.rows) rows.push([r.id,r.name,r.balance,r.sold,r.base?.buy,r.sim?.buy,edits.get(r.id) ?? r.sim?.buy,edits.has(r.id)?'sim':'não',params.ref,params.start,params.end,+params.lead,+params.review,+params.safety,+params.change,+params.delay])
  return '\uFEFF' + rows.map(row=>row.map(quote).join(',')).join('\r\n')
}
