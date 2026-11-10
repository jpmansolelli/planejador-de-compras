import type { Data, Tab } from './App'
import type { Plan } from './domain/plan'

interface Props {
  data: Data
  plan: Plan | null
  demo: boolean
  reference: string
  onTab: (tab: Tab) => void
}

const dateLabel = (date: string) =>
  date ? date.split('-').reverse().join('/') : '—'

export function Dashboard({ data, plan, demo, reference, onTab }: Props) {
  const purchases = plan?.rows.filter((row) => (row.sim?.buy ?? 0) > 0) ?? []
  const risks = plan?.rows.filter((row) => row.sim?.risk) ?? []
  const missing = plan?.rows.filter((row) => !row.sim) ?? []
  const highlights = [...risks, ...purchases.filter((row) => !row.sim?.risk)].slice(0, 4)

  return (
    <section className="dashboard">
      <div className="dashboard-context">
        <div>
          <span className="eyebrow">{demo ? 'DADOS FICTÍCIOS' : 'DADOS LOCAIS'}</span>
          <p>
            {plan
              ? `Saldo em ${dateLabel(reference)} · ${plan.days} dias analisados`
              : 'Confirme o período e a cobertura do histórico para liberar o plano.'}
          </p>
        </div>
        <button
          className={plan ? 'secondary-button' : 'primary-button'}
          onClick={() => onTab(plan ? 'plan' : 'data')}
        >
          {plan ? 'Revisar plano de compras' : 'Completar dados'}
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="summary-grid">
        <article className="summary-card summary-card-primary">
          <div className="summary-icon icon-blue">↓</div>
          <div><span>Produtos com compra</span><strong>{plan ? purchases.length : '—'}</strong></div>
          <small>Produtos que precisam de revisão</small>
        </article>
        <article className="summary-card">
          <div className="summary-icon icon-orange">!</div>
          <div><span>Risco no prazo</span><strong>{plan ? risks.length : '—'}</strong></div>
          <small>O saldo pode acabar antes da reposição</small>
        </article>
        <article className="summary-card">
          <div className="summary-icon icon-pink">○</div>
          <div><span>Sem histórico</span><strong>{plan ? missing.length : '—'}</strong></div>
          <small>Sem sugestão automática de compra</small>
        </article>
        <article className="summary-card">
          <div className="summary-icon icon-green">▦</div>
          <div><span>Produtos analisados</span><strong>{plan ? plan.rows.length : data.stock.length}</strong></div>
          <small>{data.sales.length} registros de venda carregados</small>
        </article>
      </div>

      <div className="dashboard-columns">
        <section className="panel attention-panel">
          <div className="section-heading">
            <div><span className="eyebrow">REVISÃO PRIORITÁRIA</span><h2>Produtos para conferir</h2></div>
            {plan && <button className="text-button" onClick={() => onTab('plan')}>Ver plano <span>→</span></button>}
          </div>
          {!plan ? (
            <div className="inline-empty"><span className="empty-icon">⌁</span><p>Aplique o período de análise para ver os produtos que precisam de atenção.</p></div>
          ) : highlights.length ? (
            <div className="attention-list">{highlights.map((row) => <div className="attention-row" key={row.id}><div className="attention-product"><span className={row.sim?.risk?'status-dot warning':'status-dot purchase'}/><div><strong>{row.name}</strong><small>{row.id}</small></div></div><span className={row.sim?.risk?'status-label warning-label':'status-label purchase-label'}>{row.sim?.risk?'Risco no prazo':`Comprar ${row.sim?.buy} un.`}</span></div>)}</div>
          ) : <div className="inline-empty"><span className="empty-icon success">✓</span><p>Nenhuma compra automática sugerida para este período.</p></div>}
        </section>
        <section className="panel data-overview">
          <div className="section-heading"><div><span className="eyebrow">BASE DE ANÁLISE</span><h2>Dados carregados</h2></div><button className="icon-button" aria-label="Abrir dados" onClick={() => onTab('data')}>↗</button></div>
          <div className="data-overview-stats"><div><span>Produtos</span><strong>{data.stock.length}</strong></div><div><span>Registros de venda</span><strong>{data.sales.length}</strong></div></div>
          <div className="data-overview-note"><span className="status-dot purchase"/><p>{demo?'Conjunto fictício pronto para demonstração.':'Arquivos importados e processados neste navegador.'}</p></div>
          <button className="full-width-link" onClick={() => onTab('data')}>Conferir período e arquivos <span>→</span></button>
        </section>
      </div>
    </section>
  )
}
