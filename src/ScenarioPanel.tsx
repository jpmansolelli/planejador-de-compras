import { useState, type FormEvent } from 'react'
import type { Parameters, Plan } from './domain/plan'

interface Props {
  params: Parameters
  plan: Plan | null
  onApply: (change: number, delay: number) => void
  onGoToPlan: () => void
}

const quantity = (value?: number) =>
  value === undefined ? '—' : value.toLocaleString('pt-BR') + ' un.'

export function ScenarioPanel({ params, plan, onApply, onGoToPlan }: Props) {
  const [change, setChange] = useState(params.change)
  const [delay, setDelay] = useState(params.delay)
  const purchaseCount = plan?.rows.filter((row) => (row.sim?.buy ?? 0) > 0).length ?? 0
  const baseCount = plan?.rows.filter((row) => (row.base?.buy ?? 0) > 0).length ?? 0

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    onApply(change, delay)
  }

  if (!plan) {
    return (
      <div className="scenario-empty panel">
        <span className="empty-icon">⌁</span>
        <h2>Prepare o plano base antes de simular</h2>
        <p>Confirme o período de análise e os dados para comparar um cenário com a sugestão original.</p>
        <button className="primary-button" onClick={onGoToPlan}>Ir ao plano de compras <span>→</span></button>
      </div>
    )
  }

  return (
    <div className="scenario-layout">
      <section className="panel scenario-controls">
        <span className="eyebrow">SIMULAÇÃO</span>
        <h2>Altere as condições de reposição</h2>
        <p>O cenário recalcula a quantidade sugerida sem alterar as vendas importadas.</p>
        <form onSubmit={submit}>
          <label>
            Variação da demanda (%)
            <input type="number" min="-100" max="1000" step="1" value={change} onChange={(event) => setChange(event.target.valueAsNumber)} required/>
            <small>Use −100% para demanda nula ou um valor positivo para simular aumento.</small>
          </label>
          <label>
            Atraso adicional (dias)
            <input type="number" min="0" max="3650" step="1" value={delay} onChange={(event) => setDelay(event.target.valueAsNumber)} required/>
            <small>Somado ao prazo de reposição definido no plano.</small>
          </label>
          <button className="primary-button">Atualizar cenário</button>
        </form>
      </section>
      <section className="scenario-results">
        <div className="scenario-note"><span>i</span><p>Este é um cenário hipotético, não uma previsão. O plano base permanece disponível para comparação.</p></div>
        <div className="summary-grid scenario-metrics">
          <article className="summary-card"><span>Produtos com compra no plano base</span><strong>{baseCount}</strong></article>
          <article className="summary-card summary-card-primary"><span>Produtos com compra neste cenário</span><strong>{purchaseCount}</strong></article>
        </div>
        <section className="panel comparison-panel">
          <div className="section-heading"><div><span className="eyebrow">COMPARAÇÃO</span><h2>Quantidade por produto</h2></div></div>
          <div className="comparison-list">{plan.rows.map((row) => <div className="comparison-row" key={row.id}><div><strong>{row.name}</strong><small>{row.id}</small></div><div><span>Plano base</span><b>{quantity(row.base?.buy)}</b></div><div><span>No cenário</span><b>{quantity(row.sim?.buy)}</b></div></div>)}</div>
        </section>
      </section>
    </div>
  )
}
