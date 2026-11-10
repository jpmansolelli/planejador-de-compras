import { useRef, useState, type FormEvent, type RefObject } from 'react'
import { readData, errorMessage } from './domain/csv'
import { calculate, type Parameters, type Plan } from './domain/plan'
import { Results } from './Results'
import { ParameterForm } from './ParameterForm'
import { Dashboard } from './Dashboard'
import { ScenarioPanel } from './ScenarioPanel'
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
export type Data = ReturnType<typeof readData>
export type Tab = 'overview' | 'plan' | 'data' | 'scenario'
const navigation: {id: Tab; label: string; icon: string}[] = [
  {id:'overview',label:'Visão geral',icon:'grid'},
  {id:'plan',label:'Plano de compras',icon:'list'},
  {id:'data',label:'Dados',icon:'database'},
  {id:'scenario',label:'Cenários',icon:'chart'},
]
const headings: Record<Tab, {title:string;subtitle:string}> = {
  overview:{title:'Visão geral',subtitle:'Resumo do estoque e das decisões pendentes.'},
  plan:{title:'Plano de compras',subtitle:'Revise as quantidades sugeridas para cada produto.'},
  data:{title:'Dados',subtitle:'Confira os arquivos, o período e a cobertura do histórico.'},
  scenario:{title:'Cenários',subtitle:'Compare o plano base com mudanças hipotéticas.'},
}
const dateLabel = (date: string) => date ? date.split('-').reverse().join('/') : '—'

function Icon({name}:{name:string}) {
  const shared={width:19,height:19,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const, 'aria-hidden':true as const}
  if(name==='grid') return <svg {...shared}><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>
  if(name==='list') return <svg {...shared}><path d="M9 6h12M9 12h12M9 18h12"/><path d="M3 6h.01M3 12h.01M3 18h.01"/></svg>
  if(name==='database') return <svg {...shared}><ellipse cx="12" cy="5" rx="8" ry="3"/><path d="M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3"/></svg>
  return <svg {...shared}><path d="M3 3v18h18"/><path d="m7 14 4-4 4 3 6-7"/></svg>
}

function UploadPanel({onImport,error,source,formRef}:{onImport:(event:FormEvent<HTMLFormElement>)=>void;error:string;source:Data|null;formRef?:RefObject<HTMLFormElement|null>}) {
  return <div className="data-grid">
    <section className="panel upload-panel">
      <div className="section-heading"><div><span className="eyebrow">ARQUIVOS LOCAIS</span><h2>Importar dados</h2><p>Os arquivos são processados neste navegador.</p></div></div>
      <div className="template-links"><a href={stockUrl} download="estoque.csv">Baixar modelo de estoque <span>↓</span></a><a href={salesUrl} download="vendas.csv">Baixar modelo de vendas <span>↓</span></a></div>
      <form ref={formRef} className="upload-form" onSubmit={onImport}>
        <label>Arquivo de estoque<input type="file" name="stock" required accept=".csv,text/csv"/></label>
        <label>Arquivo de vendas<input type="file" name="sales" required accept=".csv,text/csv"/></label>
        <p className="form-hint">CSV UTF-8 com vírgulas. Até 5 MB por arquivo.</p>
        <button className="primary-button">Validar e carregar arquivos</button>
      </form>
      {error&&<p className="error-message" role="alert">{error}</p>}
    </section>
    <section className="panel data-status">
      <span className="eyebrow">ESTADO DOS DADOS</span>
      <h2>{source?'Arquivos carregados':'Nenhum arquivo carregado'}</h2>
      {source?<><p>Os dados permanecem na memória até esta página ser recarregada.</p><dl><div><dt>Produtos no estoque</dt><dd>{source.stock.length}</dd></div><div><dt>Linhas de vendas</dt><dd>{source.sales.length}</dd></div></dl></>:<p>Importe estoque e vendas para revisar um plano com seus próprios dados. Você também pode usar a demonstração fictícia.</p>}
    </section>
  </div>
}

function Workspace({data,demo,tab,onTab,onReplace}:{data:Data;demo:boolean;tab:Tab;onTab:(tab:Tab)=>void;onReplace:()=>void}) {
  const initial=demo?defaults:{...defaults,ref:'',start:'',end:'',covered:false}
  const [params,setParams]=useState(initial)
  const [plan,setPlan]=useState<Plan|null>(()=>demo?calculate(data.stock,data.sales,initial):null)
  const [error,setError]=useState('')
  const [edits,setEdits]=useState(new Map<string,number>())
  function apply(next:Parameters) {
    try { setPlan(calculate(data.stock,data.sales,next));setParams(next);setError('') }
    catch(cause) {setPlan(null);setError(errorMessage(cause))}
  }
  function updateScenario(change:number,delay:number) {
    const next={...params,change,delay}
    try {setPlan(calculate(data.stock,data.sales,next));setParams(next);setError('')}
    catch(cause) {setError(errorMessage(cause))}
  }
  return <div className="workspace-content">
    {error&&<p className="error-message" role="alert">{error}</p>}
    {tab==='overview'&&<Dashboard data={data} plan={plan} demo={demo} onTab={onTab} reference={params.ref}/>}
    {tab==='plan'&&<section className="page-section">
      {plan?<Results plan={plan} params={params} edits={edits} onEdit={(id,value)=>setEdits(previous=>{const next=new Map(previous);if(value===null)next.delete(id);else next.set(id,value);return next})}/>:<div className="empty-state panel"><span className="empty-icon"><Icon name="list"/></span><h2>O plano aparece aqui</h2><p>Confirme o período do histórico e aplique os parâmetros para calcular as sugestões.</p><button className="primary-button" onClick={()=>onTab('data')}>Revisar dados e período <span>→</span></button></div>}
    </section>}
    {tab==='data'&&<section className="page-section">
      <div className="data-grid"><section className="panel data-status"><span className="eyebrow">ORIGEM</span><h2>{demo?'Demonstração fictícia':'Arquivos locais'}</h2><p>{data.stock.length} produtos no estoque e {data.sales.length} registros de vendas. Os dados ficam na memória do navegador até recarregar.</p><dl><div><dt>Data inicial disponível</dt><dd>{dateLabel(data.sales.map(s=>s.date).sort()[0]||'')}</dd></div><div><dt>Data final disponível</dt><dd>{dateLabel(data.sales.map(s=>s.date).sort().at(-1)||'')}</dd></div></dl><button className="secondary-button replace-button" onClick={onReplace}>Substituir arquivos</button></section><section className="panel period-panel"><span className="eyebrow">PERÍODO DE ANÁLISE</span><h2>Referência e cobertura</h2><p>Informe a referência do saldo e confirme que o histórico cobre todo o intervalo. Dias sem registros contam como zero vendas após essa confirmação.</p><ParameterForm initial={params} apply={apply} invalidate={()=>{setPlan(null);setError('')}}/></section></div>
    </section>}
    {tab==='scenario'&&<section className="page-section"><ScenarioPanel params={params} plan={plan} onApply={updateScenario} onGoToPlan={()=>onTab('plan')}/></section>}
    <div className="workspace-footnote">Cálculos determinísticos de reposição. Resultados ainda não validados com comerciantes.</div>
  </div>
}

export function App() {
  const version=useRef(0)
  const [source,setSource]=useState<{data:Data;demo:boolean;key:number}|null>(null)
  const [error,setError]=useState('')
  const [tab,setTab]=useState<Tab>('overview')
  const upload=useRef<HTMLFormElement>(null)
  function clear() {setSource(null);setError('');return ++version.current}
  function loadDemo() {
    const key=clear()
    upload.current?.reset()
    setSource({data:readData(exampleStock,exampleSales),demo:true,key})
    setTab('overview')
  }
  async function importFiles(event:FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const key=clear()
    const values=new FormData(event.currentTarget)
    try {
      const texts=await Promise.all(['stock','sales'].map(async name=>{
        const file=values.get(name)
        if(!(file instanceof File))throw Error('Selecione os dois arquivos.')
        if(file.size>5000000)throw Error('Cada arquivo deve ter até 5 MB.')
        return new TextDecoder('utf-8',{fatal:true}).decode(await file.arrayBuffer())
      }))
      if(key!==version.current)return
      setSource({data:readData(texts[0],texts[1]),demo:false,key})
      setError('')
    } catch(cause) {if(key===version.current)setError(errorMessage(cause))}
  }
  const heading=headings[tab]
  return <div className="app-shell">
    <aside className="sidebar">
      <a className="brand" href="#" onClick={e=>{e.preventDefault();setTab('overview')}}><span className="brand-mark">R</span><span>Reposição<small>PLANEJAMENTO DE ESTOQUE</small></span></a>
      <div className="sidebar-label">ESPAÇO DE TRABALHO</div>
      <nav aria-label="Navegação principal">{navigation.map(item=><button key={item.id} className={tab===item.id?'nav-item active':'nav-item'} aria-current={tab===item.id?'page':undefined} onClick={()=>setTab(item.id)}><Icon name={item.icon}/><span>{item.label}</span></button>)}</nav>
      <div className="sidebar-bottom"><span className={source?'status-led loaded':'status-led'}></span><span>{source?source.demo?'Demonstração fictícia':'Dados carregados':'Aguardando dados'}</span></div>
    </aside>
    <div className="main-area">
      <header className="topbar"><div><span className="eyebrow">PLANEJADOR DE COMPRAS</span><span className="topbar-context">{source?.demo?'Papelaria fictícia':source?'Arquivos locais':'Comece pela demonstração'}</span></div>{source?.demo&&<span className="demo-badge"><span/>Dados fictícios</span>}</header>
      <main className="main-content">
        <div className="page-heading"><div><h1>{heading.title}</h1><p>{heading.subtitle}</p></div>{tab==='overview'&&!source&&<button className="primary-button" onClick={loadDemo}>Experimentar demonstração</button>}{source?.demo&&<button className="secondary-button" onClick={loadDemo}>Restaurar demonstração</button>}</div>
        {!source&&tab==='overview'&&<div className="welcome-card"><div className="welcome-copy"><span className="eyebrow">PRÓXIMO PASSO</span><h2>Transforme vendas em um plano revisável.</h2><p>Carregue a demonstração ou importe estoque e vendas para começar.</p><div className="welcome-actions"><button className="primary-button" onClick={loadDemo}>Abrir demonstração <span>→</span></button><button className="secondary-button" onClick={()=>setTab('data')}>Importar arquivos</button></div></div><div className="welcome-illustration" aria-hidden="true"><div className="illustration-sheet"><i/><i/><i/><i/><i/><i/></div><div className="illustration-check">✓</div></div></div>}
        {!source&&tab==='data'&&<UploadPanel onImport={importFiles} error={error} source={null} formRef={upload}/>}
        {source&&<Workspace key={source.key} data={source.data} demo={source.demo} tab={tab} onTab={setTab} onReplace={()=>{clear();setTab('data')}}/>}
      </main>
    </div>
  </div>
}
