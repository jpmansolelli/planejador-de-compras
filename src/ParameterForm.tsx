import { useState } from 'react'
import type { Parameters } from './domain/plan'

const fields = [
  ['lead', 'Prazo de entrega (dias)', 0, 3650],
  ['review', 'Intervalo entre compras (dias)', 1, 3650],
  ['safety', 'Dias extras de segurança', 0, 3650],
  ['change', 'Simular demanda (%)', -100, 1000],
  ['delay', 'Simular atraso (dias)', 0, 3650],
] as const

interface Props {
  initial: Parameters
  apply: (p: Parameters) => void
  invalidate: () => void
}
export function ParameterForm({ initial, apply, invalidate }: Props) {
  const [draft, setDraft] = useState(initial)
  function dateChange(key: 'start' | 'ref' | 'end', value: string) {
    const next = { ...draft, [key]: value, covered: false }
    if (key === 'ref' && value) {
      const start = new Date(value + 'T00:00:00Z')
      start.setUTCDate(start.getUTCDate() - 27)
      next.start = start.toISOString().slice(0, 10)
      next.end = value
    }
    setDraft(next)
  }
  return (
    <details open={!initial.covered || undefined}>
      <summary>Período e parâmetros de reposição</summary>
      <form
        onChange={invalidate}
        onSubmit={(e) => {
          e.preventDefault()
          apply(draft)
        }}
      >
        {(
          [
            ['ref', 'Referência do saldo'],
            ['start', 'Início das vendas'],
            ['end', 'Fim das vendas'],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            {label}
            <input
              type="date"
              required
              value={draft[key]}
              onChange={(e) => dateChange(key, e.target.value)}
            />
          </label>
        ))}
        {fields.map(([key, label, min, max]) => (
          <label key={key}>
            {label}
            <input
              type="number"
              min={min}
              max={max}
              required
              defaultValue={initial[key]}
              onChange={(e) =>
                setDraft({ ...draft, [key]: e.target.valueAsNumber })
              }
            />
          </label>
        ))}
        <label className="wide">
          <input
            type="checkbox"
            required
            checked={draft.covered}
            onChange={(e) => setDraft({ ...draft, covered: e.target.checked })}
          />{' '}
          Confirmo que o histórico cobre todo o intervalo. Dias sem registros
          contam como zero venda.
        </label>
        <p className="wide">
          O prazo é contado em dias corridos. A regra pressupõe saldo
          atualizado, sem reservas nem pedidos em trânsito. Pedidos pendentes
          podem duplicar a reposição.
        </p>
        <button>Aplicar e calcular</button>
      </form>
    </details>
  )
}
