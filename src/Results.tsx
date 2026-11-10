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
  edit,
  onEdit,
}: {
  row: Row
  days: number
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
        <summary>Memória de cálculo</summary>
        {r.base && r.sim ? (
          <p>
            {format(r.sold)} un. vendidas em {days} dias. Média de{' '}
            {format(r.base.mean)} un./dia. Alvo base de {units(r.base.target)} e
            saldo de {units(r.balance)}. Cobertura base de{' '}
            {format(r.base.coverage!)} dias. No cenário, média de{' '}
            {format(r.sim.mean)} un./dia, alvo de {units(r.sim.target)} e
            cobertura{' '}
            {r.sim.coverage === null
              ? 'indisponível'
              : 'de ' + format(r.sim.coverage) + ' dias'}
            .
          </p>
        ) : (
          <p>
            Saldo de {units(r.balance)}. Sem vendas no período para estimar a
            demanda. A quantidade final pode ser preenchida manualmente.
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
        <button onClick={download}>Exportar plano CSV</button>
      </div>
      <label>
        Exibir
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
      </label>
      {visible.map((r) => (
        <Product
          key={r.id}
          row={r}
          days={plan.days}
          edit={edits.get(r.id)}
          onEdit={onEdit}
        />
      ))}
      {!visible.length && <p>Nenhum produto neste filtro.</p>}
    </section>
  )
}
