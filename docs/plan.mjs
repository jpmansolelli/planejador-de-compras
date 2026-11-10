export function day(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw Error('Use datas no formato AAAA-MM-DD.')
  const time = Date.parse(value + 'T00:00:00Z')
  if (!Number.isFinite(time) || new Date(time).toISOString().slice(0,10) !== value) throw Error('Data inexistente: ' + value)
  return time / 86400000
}

export function integer(value, min = 0, max = 1e9) {
  if (!/^-?\d+$/.test(String(value)) || Number(value) < min || Number(value) > max) throw Error('Informe um inteiro entre ' + min + ' e ' + max + '.')
  return Number(value)
}

export function calculate(stock, sales, p) {
  const first = day(p.start), last = day(p.end), days = last - first + 1
  if (days < 1 || last > day(p.ref)) throw Error('Confira o intervalo. O fim deve estar entre o início e a referência.')
  if (!p.covered) throw Error('Confirme a cobertura do histórico para calcular.')
  const lead = integer(p.lead,0,3650), review = integer(p.review,1,3650), safety = integer(p.safety,0,3650)
  const change = integer(p.change,-100,1000), delay = integer(p.delay,0,3650)
  const totals = new Map()
  let excluded = 0
  for (const sale of sales) {
    if (sale.date < p.start || sale.date > p.end) { excluded++; continue }
    totals.set(sale.id,(totals.get(sale.id) || 0) + sale.qty)
  }
  // Inteiros até o teto final evitam arredondar a média fracionária.
  function scenario(sold, balance, percent, extra) {
    const rate = BigInt(sold) * BigInt(100 + percent)
    const denominator = BigInt(days) * 100n
    const target = Number((rate * BigInt(lead + extra + review + safety) + denominator - 1n) / denominator)
    if (!Number.isSafeInteger(target)) throw Error('Quantidade calculada excede o limite numérico.')
    const mean = Number(rate) / Number(denominator)
    return {mean, target, buy: Math.max(0,target-balance), coverage: mean ? balance/mean : null, risk: BigInt(balance)*denominator < rate*BigInt(lead+extra)}
  }
  return {days, excluded, rows: stock.map(item => {
    const sold = totals.get(item.id) || 0
    return {...item, sold, base: sold ? scenario(sold,item.balance,0,0) : null, sim: sold ? scenario(sold,item.balance,change,delay) : null}
  })}
}
