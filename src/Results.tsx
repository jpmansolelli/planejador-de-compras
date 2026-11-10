import { useState } from 'react'
import type { Plan, Parameters } from './domain/plan'
import { exportPlan } from './domain/csv'

type Row = Plan['rows'][number]
type Edit = (id: string, value: number | null) => void
const format = (n: number) =>
  n.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
const units = (n?: number) => (n === undefined ? '—' : format(n) + ' un.')
const filters = [
  { label: 'Todos os produtos', match: (_: Row) => true },
  { label: 'Com compra sugerida', match: (r: Row) => (r.sim?.buy ?? 0) > 0 },
  { label: 'Risco durante o prazo', match: (r: Row) => r.sim?.risk },
  { label: 'Sem histórico', match: (r: Row) => !r.sim },
]

function Product({
  row: r,
  days,
  params,
  edit,
  onEdit,
}: {
  row: Row
  days: number
  params: Parameters
  edit?: number
  onEdit: Edit
}) {
  const [draft, setDraft] = useState<string | null>(null)
  const suggested = r.sim?.buy
  const status = !r.sim
    ? 'Sem histórico no período'
    : r.sim.risk
      ? 'Risco durante o prazo'
      : suggested
        ? 'Reposição sugerida'
        : 'Saldo suficiente'
  return (
    <article className="product">
      <div>
        <strong>{r.name}</strong>
        <span>
          {r.id} · {status}
        </span>
      </div>
      <div>
        <span>Compra base</span>
        <b>{units(r.base?.buy)}</b>
      </div>
      <div>
        <span>No cenário</span>
        <b>{units(suggested)}</b>
      </div>
      <label>
        Quantidade final
        <input
          aria-label={'Quantidade final de ' + r.name}
          type="number"
          min="0"
          max={Number.MAX_SAFE_INTEGER}
          step="1"
          value={draft ?? edit ?? suggested ?? ''}
          onChange={(e) => {
            setDraft(e.target.value)
            if (e.target.validity.valid)
              onEdit(
                r.id,
                e.target.value === '' ? null : e.target.valueAsNumber,
              )
          }}
          onBlur={() => setDraft(null)}
        />
        <span>
          {edit === undefined ? 'Sugestão do cenário' : 'Ajuste manual'}
        </span>
      </label>
      <details>
        <summary>Como chegamos à sugestão?</summary>
        {r.base && r.sim ? (
          <div className="calculation-details">
            <p className="calculation-intro">
              A conta estima quanto manter em estoque para cobrir o prazo de
              entrega, a próxima revisão e a margem de segurança. O cenário
              atual {params.change === 0
                ? 'mantém a demanda observada'
                : `altera a demanda em ${params.change}%`}
              {params.delay > 0
                ? ` e acrescenta ${params.delay} dias de atraso`
                : ' e não inclui atraso adicional'}.
            </p>
            <ol className="calculation-steps">
              <li>
                <span>1</span>
                <p>
                  <strong>Ritmo de vendas</strong>
                  <small>
                    {format(r.sold)} un. vendidas em {days} dias. Neste cenário,
                    isso equivale a {format(r.sim.mean)} un. por dia.
                  </small>
                </p>
              </li>
              <li>
                <span>2</span>
                <p>
                  <strong>Estoque para cobrir o período</strong>
                  <small>
                    A meta é {units(r.sim.target)} para cobrir {params.lead}{' '}
                    dias de entrega, {params.review} dias até a próxima revisão
                    e {params.safety} dias extras de segurança
                    {params.delay > 0
                      ? `, mais ${params.delay} dias de atraso simulado`
                      : ''}. Arredondamos para cima.
                  </small>
                </p>
              </li>
              <li>
                <span>3</span>
                <p>
                  <strong>Desconto do saldo atual</strong>
                  <small>
                    A meta é {units(r.sim.target)} e há {units(r.balance)} em
                    estoque. {r.sim.buy > 0
                      ? `Sugerimos comprar ${format(r.sim.buy)} unidades.`
                      : 'O saldo já cobre a meta; nenhuma compra é sugerida.'}
                  </small>
                </p>
              </li>
            </ol>
            <div className="calculation-comparison">
              <span>Comparação</span>
              <p>
                Plano base: <strong>{units(r.base.buy)}</strong>
                <span aria-hidden="true"> · </span>
                Cenário atual: <strong>{units(r.sim.buy)}</strong>
              </p>
            </div>
            {r.sim.risk && (
              <p className="calculation-warning">
                Com o saldo atual, este produto pode acabar antes da reposição.
                Confira o prazo com o fornecedor.
              </p>
            )}
          </div>
        ) : (
          <p className="calculation-intro">
            Não há vendas registradas para este produto no período analisado.
            Sem esse histórico, não dá para estimar um ritmo de vendas nem
            calcular uma compra sugerida. Você pode informar a quantidade final
            manualmente.
          </p>
        )}
      </details>
    </article>
  )
}

interface Props {
  plan: Plan
  params: Parameters
  edits: ReadonlyMap<string, number>
  onEdit: Edit
}
export function Results({ plan, params, edits, onEdit }: Props) {
  const [filter, setFilter] = useState(0)
  const buys = plan.rows.filter(filters[1].match).length
  const visible = plan.rows.filter(filters[filter].match)
  function download() {
    const url = URL.createObjectURL(
      new Blob([exportPlan(plan, params, edits)], {
        type: 'text/csv;charset=utf-8',
      }),
    )
    const link = document.createElement('a')
    link.href = url
    link.download = 'plano-de-compras-' + params.ref + '.csv'
    link.click()
    setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  return (
    <section>
      <div className="metrics">
        <article>
          Produtos analisados<strong>{plan.rows.length}</strong>
        </article>
        <article>
          Com compra no cenário<strong>{buys}</strong>
        </article>
        <article>
          Com alerta no cenário
          <strong>
            {plan.rows.filter((r) => !r.sim || r.sim.risk).length}
          </strong>
        </article>
      </div>
      <div className="bar">
        <div>
          <h2>Revisão por produto</h2>
          <p>
            Saldo em {params.ref.split('-').reverse().join('/')} · {plan.days}{' '}
            dias analisados · {plan.excluded} vendas fora do intervalo.{' '}
            {buys === 0 && 'Nenhuma compra automática sugerida.'}
          </p>
        </div>
        <button className="secondary-button export-button" onClick={download}>
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
            <path d="M10 2.5v9m0 0 3.5-3.5M10 11.5 6.5 8M3.5 12.5v3A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5v-3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Exportar plano CSV
        </button>
      </div>
      <label className="filter-control" htmlFor="filter">
        <span>Exibir</span>
        <span className="select-wrap">
        <select
          id="filter"
          value={filter}
          onChange={(e) => setFilter(Number(e.target.value))}
        >
          {filters.map((f, i) => (
            <option key={f.label} value={i}>
              {f.label}
            </option>
          ))}
        </select>
        <svg aria-hidden="true" viewBox="0 0 16 16" fill="none">
          <path d="m4 6 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        </span>
      </label>
      {visible.map((r) => (
        <Product
          key={r.id}
          row={r}
          days={plan.days}
          params={params}
          edit={edits.get(r.id)}
          onEdit={onEdit}
        />
      ))}
      {!visible.length && <p>Nenhum produto neste filtro.</p>}
    </section>
  )
}
