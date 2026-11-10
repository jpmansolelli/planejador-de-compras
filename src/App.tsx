import { useRef, useState, type FormEvent } from 'react'
import { readData, errorMessage } from './domain/csv'
import { calculate, type Parameters, type Plan } from './domain/plan'
import { Results } from './Results'
import { ParameterForm } from './ParameterForm'
import exampleStock from '../examples/estoque.csv?raw'
import exampleSales from '../examples/vendas.csv?raw'
import stockUrl from '../examples/estoque.csv?url'
import salesUrl from '../examples/vendas.csv?url'

const defaults: Parameters = {
  ref: '2026-10-28',
  start: '2026-10-01',
  end: '2026-10-28',
  covered: true,
  lead: 3,
  review: 7,
  safety: 2,
  change: 0,
  delay: 0,
}
type Data = ReturnType<typeof readData>
const dateLabel = (date: string) => date.split('-').reverse().join('/')

function Workspace({ data, demo }: { data: Data; demo: boolean }) {
  const initial = demo
    ? defaults
    : { ...defaults, ref: '', start: '', end: '', covered: false }
  const [params, setParams] = useState(initial)
  const [plan, setPlan] = useState<Plan | null>(() =>
    demo ? calculate(data.stock, data.sales, initial) : null,
  )
  const [error, setError] = useState('')
  const [edits, setEdits] = useState(new Map<string, number>())
  const bounds = data.sales.reduce(
    (range, sale) => ({
      first: !range.first || sale.date < range.first ? sale.date : range.first,
      last: sale.date > range.last ? sale.date : range.last,
    }),
    { first: '', last: '' },
  )

  function apply(next: Parameters) {
    try {
      setPlan(calculate(data.stock, data.sales, next))
      setParams(next)
      setError('')
    } catch (cause) {
      setPlan(null)
      setError(errorMessage(cause))
    }
  }
  return (
    <section>
      <p>
        {demo ? 'Demonstração · Papelaria fictícia' : 'Arquivos locais'} ·{' '}
        {data.stock.length} produtos · {data.sales.length} registros de venda{' '}
        {bounds.first &&
          '· ' + dateLabel(bounds.first) + ' a ' + dateLabel(bounds.last)}
      </p>
      <ParameterForm
        initial={initial}
        apply={apply}
        invalidate={() => {
          setPlan(null)
          setError('')
        }}
      />
      {error && <p role="alert">{error}</p>}
      {plan && (
        <Results
          plan={plan}
          params={params}
          edits={edits}
          onEdit={(id, value) => {
            setEdits((previous) => {
              const next = new Map(previous)
              if (value === null) next.delete(id)
              else next.set(id, value)
              return next
            })
          }}
        />
      )}
    </section>
  )
}

export function App() {
  const version = useRef(0)
  const [source, setSource] = useState<{
    data: Data
    demo: boolean
    key: number
  } | null>(null)
  const [error, setError] = useState('')
  const [importOpen, setImportOpen] = useState(false)
  const upload = useRef<HTMLFormElement>(null)
  function clear() {
    setSource(null)
    setError('')
    return ++version.current
  }
  function demo() {
    const key = clear()
    upload.current?.reset()
    setImportOpen(false)
    setSource({ data: readData(exampleStock, exampleSales), demo: true, key })
  }
  async function importFiles(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const key = clear()
    const values = new FormData(event.currentTarget)
    try {
      const texts = await Promise.all(
        ['stock', 'sales'].map(async (name) => {
          const file = values.get(name)
          if (!(file instanceof File))
            throw Error('Selecione os dois arquivos.')
          if (file.size > 5000000)
            throw Error('Cada arquivo deve ter até 5 MB.')
          return new TextDecoder('utf-8', { fatal: true }).decode(
            await file.arrayBuffer(),
          )
        }),
      )
      if (key !== version.current) return
      setSource({ data: readData(texts[0], texts[1]), demo: false, key })
      setImportOpen(false)
    } catch (cause) {
      if (key === version.current) setError(errorMessage(cause))
    }
  }
  return (
    <>
      <header>
        <b className="brand">▤ &nbsp;Reposição</b>
      </header>
      <main>
        <section className="intro">
          <div>
            <small>PLANEJAMENTO DE ESTOQUE</small>
            <h1>Plano de compras</h1>
            <p>
              Revise o que comprar, confira as quantidades e simule mudanças na
              demanda.
            </p>
          </div>
          <button onClick={demo}>
            {source ? 'Restaurar demonstração' : 'Experimentar demonstração'}
          </button>
        </section>
        <details
          open={importOpen}
          onToggle={(e) => setImportOpen(e.currentTarget.open)}
        >
          <summary>Importar meus arquivos</summary>
          <p>
            CSV UTF-8 com vírgula, até 5 MB por arquivo. Os dados ficam na
            memória do navegador até recarregar a página.
          </p>
          <p>
            <a href={stockUrl} download="estoque.csv">
              Modelo de estoque
            </a>{' '}
            ·{' '}
            <a href={salesUrl} download="vendas.csv">
              Modelo de vendas
            </a>
          </p>
          <form ref={upload} onSubmit={importFiles} onChange={clear}>
            <label>
              Estoque
              <input type="file" name="stock" required accept=".csv,text/csv" />
            </label>
            <label>
              Vendas
              <input type="file" name="sales" required accept=".csv,text/csv" />
            </label>
            <button>Conferir arquivos</button>
          </form>
        </details>
        {error && (
          <p id="message" role="alert">
            {error}
          </p>
        )}
        {source && (
          <Workspace key={source.key} data={source.data} demo={source.demo} />
        )}
        <footer>
          Cálculos determinísticos de reposição. Resultados ainda não validados
          com comerciantes.
        </footer>
      </main>
    </>
  )
}
