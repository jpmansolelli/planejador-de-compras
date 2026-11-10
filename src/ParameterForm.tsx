import { useState } from 'react'
import type { Parameters } from './domain/plan'

interface Props {
  initial: Parameters
  apply: (p: Parameters) => void
  invalidate: () => void
}

const fields = [
  ['lead', 'Prazo de entrega', 0, 3650],
  ['review', 'Intervalo entre revisões', 1, 3650],
  ['safety', 'Dias extras de segurança', 0, 3650],
] as const

export function ParameterForm({ initial, apply, invalidate }: Props) {
  const [draft, setDraft] = useState(initial)

  function changeDate(key: 'ref' | 'start' | 'end', value: string) {
    const next = { ...draft, [key]: value, covered: false }
    if (key === 'ref' && value) {
      const start = new Date(value + 'T00:00:00Z')
      start.setUTCDate(start.getUTCDate() - 27)
      next.start = start.toISOString().slice(0, 10)
      next.end = value
    }
    setDraft(next)
    invalidate()
  }

  return (
    <form
      className="parameter-form"
      onSubmit={(event) => {
        event.preventDefault()
        apply(draft)
      }}
    >
      <div className="parameter-grid">
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
              onChange={(event) => changeDate(key, event.target.value)}
            />
          </label>
        ))}
        {fields.map(([key, label, min, max]) => (
          <label key={key}>
            {label} (dias)
            <input
              type="number"
              min={min}
              max={max}
              required
              value={draft[key]}
              onChange={(event) => {
                setDraft({ ...draft, [key]: event.target.valueAsNumber })
                invalidate()
              }}
            />
          </label>
        ))}
      </div>
      <label className="coverage-confirmation">
        <input
          type="checkbox"
          required
          checked={draft.covered}
          onChange={(event) => {
            setDraft({ ...draft, covered: event.target.checked })
            invalidate()
          }}
        />
        <span>
          Confirmo que o histórico cobre todo o intervalo. Dias sem registros
          contam como zero venda.
        </span>
      </label>
      <div className="parameter-footer">
        <p>
          A regra pressupõe saldo atualizado, sem reservas nem pedidos em
          trânsito. Pedidos pendentes podem duplicar a reposição.
        </p>
        <button className="primary-button">Aplicar período e parâmetros</button>
      </div>
    </form>
  )
}
