import React, { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { api, clearToken, getToken, setToken } from './api'
import {
  LayoutDashboard, CalendarClock, FileText, ShieldCheck,
  Smartphone, LogOut, Plus, Search, Copy, RefreshCw,
  Users, Bell, Settings, ChevronRight, Wifi, WifiOff, Loader2,
  X, MessageSquareReply, Phone, UserPlus, Calendar, Clock, ToggleLeft, ToggleRight,
  Trash2, Pencil, ClipboardCopy, Mic
} from 'lucide-react'

// ── Constantes ───────────────────────────────────────────────────
const tzOptions = [
  'America/Sao_Paulo','America/Fortaleza','America/Manaus',
  'UTC','Europe/Lisbon','Europe/Berlin','America/New_York'
]
const labels = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']

function cls(...c){ return c.filter(Boolean).join(' ') }

// ══════════════════════════════════════════════════════════════════
// COMPONENTE: PhoneAutocomplete
// Autocompleta números com contatos do WhatsApp conectado
// ══════════════════════════════════════════════════════════════════
// PhoneAutocomplete — lógica simples: digita → API → mostra
// Baseado na versão que funcionava corretamente
// ══════════════════════════════════════════════════════════════════
function PhoneAutocomplete({ value, onChange, onSelect, placeholder = 'Ex: 5511999999999', className }) {
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef(null)
  const wrapRef = useRef(null)

  // Fechar ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function fetchSuggestions(q) {
    setLoading(true)
    try {
      const data = await api(`whatsapp/contacts?q=${encodeURIComponent(q)}&limit=8`)
      setSuggestions(Array.isArray(data) ? data : [])
      setOpen(true)
    } catch { setSuggestions([]) }
    finally { setLoading(false) }
  }

  function handleInput(e) {
    const v = e.target.value
    onChange(v)
    clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 280)
  }

  function pick(contact) {
    onChange(contact.phone)
    if (onSelect) onSelect(contact)
    setSuggestions([])
    setOpen(false)
  }

  return (
    <div ref={wrapRef} className='relative'>
      <div className='relative'>
        <input
          className={className || inputCls}
          value={value}
          onChange={handleInput}
          onFocus={() => fetchSuggestions(value)}
          placeholder={placeholder}
          autoComplete='off'
        />
        {loading && (
          <Loader2 className='absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-slate-400'/>
        )}
      </div>

      {open && suggestions.length > 0 && (
        <div className='absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden'>
          {suggestions.map(c => (
            <button
              key={c.id}
              type='button'
              onMouseDown={() => pick(c)}
              className='w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 transition-colors text-left'
            >
              <div className='w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 rounded-full flex items-center justify-center flex-shrink-0'>
                <Phone className='h-3.5 w-3.5 text-indigo-400'/>
              </div>
              <div className='min-w-0'>
                {c.name && <div className='text-sm font-medium text-white truncate'>{c.name}</div>}
                <div className={`text-xs ${c.name ? 'text-slate-400' : 'text-white text-sm font-medium'}`}>{c.phone}</div>
              </div>
            </button>
          ))}
          <div className='px-3 py-2 border-t border-slate-700 text-xs text-slate-500'>
            Contatos do WhatsApp conectado
          </div>
        </div>
      )}
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// COMPONENTE: ContactSelect
// Dropdown de seleção de contato para "Cliente Específico"
// ══════════════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════════════
// COMPONENTE: ContactSelect
// Dropdown de seleção de contato para "Cliente Específico"
// ══════════════════════════════════════════════════════════════════
function ContactSelect({ value, onChange, placeholder = 'Todos os contatos', className }) {
  const [contacts, setContacts] = useState([])
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef(null)

  // Fechar ao clicar fora
  useEffect(() => {
    function handler(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  async function loadContacts(q = '') {
    setLoading(true)
    try {
      const data = await api(`whatsapp/contacts?q=${encodeURIComponent(q)}&limit=500`)
      setContacts(Array.isArray(data) ? data : [])
    } catch(e) {
      console.error('[ContactSelect] Erro ao buscar contatos:', e.message)
      setContacts([])
    }
    finally { setLoading(false) }
  }

  function handleOpen() {
    setOpen(true)
    loadContacts(search)
  }

  function handleSearch(e) {
    setSearch(e.target.value)
    loadContacts(e.target.value)
  }

  function pick(contact) {
    onChange(contact ? contact.phone : '')
    setOpen(false)
    setSearch('')
  }

  const selected = contacts.find(c => c.phone === value)
  const displayValue = selected ? (selected.name || selected.phone) : value || ''

  return (
    <div ref={wrapRef} className='relative'>
      <button
        type='button'
        onClick={handleOpen}
        className={cls(className || selectCls, 'text-left flex items-center justify-between')}
      >
        <span className={displayValue ? 'text-white' : 'text-slate-500'}>
          {displayValue || placeholder}
        </span>
        <Phone className='h-3.5 w-3.5 text-slate-400 flex-shrink-0'/>
      </button>

      {open && (
        <div className='absolute z-50 left-0 right-0 mt-1 bg-slate-800 border border-slate-600 rounded-xl shadow-xl overflow-hidden'>
          {/* Search */}
          <div className='p-2 border-b border-slate-700'>
            <div className='relative'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400'/>
              <input
                autoFocus
                className='w-full bg-slate-700 border border-slate-600 text-white rounded-lg pl-8 pr-3 py-1.5 text-sm focus:outline-none focus:border-indigo-500'
                placeholder='Buscar contato...'
                value={search}
                onChange={handleSearch}
              />
            </div>
          </div>

          {/* Opção: todos */}
          <button
            type='button'
            onMouseDown={() => pick(null)}
            className='w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 transition-colors text-left border-b border-slate-700/50'
          >
            <div className='w-8 h-8 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0'>
              <Users className='h-3.5 w-3.5 text-slate-400'/>
            </div>
            <span className='text-sm text-slate-400 italic'>{placeholder}</span>
          </button>

          <div className='max-h-48 overflow-y-auto'>
            {loading && (
              <div className='flex items-center justify-center py-4'>
                <Loader2 className='h-4 w-4 animate-spin text-slate-400'/>
              </div>
            )}
            {!loading && contacts.map(c => (
              <button
                key={c.id}
                type='button'
                onMouseDown={() => pick(c)}
                className={cls(
                  'w-full flex items-center gap-3 px-3 py-2.5 hover:bg-slate-700 transition-colors text-left',
                  c.phone === value && 'bg-indigo-600/20'
                )}
              >
                <div className='w-8 h-8 bg-indigo-600/20 border border-indigo-500/30 rounded-full flex items-center justify-center flex-shrink-0'>
                  <Phone className='h-3.5 w-3.5 text-indigo-400'/>
                </div>
                <div className='min-w-0'>
                  {c.name && <div className='text-sm font-medium text-white truncate'>{c.name}</div>}
                  <div className={`text-xs ${c.name ? 'text-slate-400' : 'text-white text-sm font-medium'}`}>{c.phone}</div>
                </div>
                {c.phone === value && <div className='ml-auto text-indigo-400 text-xs'>✓</div>}
              </button>
            ))}
            {!loading && contacts.length === 0 && (
              <div className='px-3 py-4 text-center text-sm text-slate-500'>
                {search ? 'Nenhum contato encontrado' : 'Conecte o WhatsApp para ver contatos'}
              </div>
            )}
          </div>
          <div className='px-3 py-2 border-t border-slate-700 text-xs text-slate-500'>
            Contatos do WhatsApp conectado
          </div>
        </div>
      )}
    </div>
  )
}

// ── Badge de status ──────────────────────────────────────────────
function StatusBadge({ status }){
  const map = {
    connected:    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
    qr:           'bg-amber-500/20  text-amber-400  border border-amber-500/30',
    disconnected: 'bg-red-500/20    text-red-400    border border-red-500/30',
    starting:     'bg-slate-500/20  text-slate-400  border border-slate-500/30',
  }
  const dot = {
    connected: 'bg-emerald-400', qr: 'bg-amber-400',
    disconnected: 'bg-red-400',  starting: 'bg-slate-400',
  }
  return (
    <span className={cls('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', map[status]||map.starting)}>
      <span className={cls('w-1.5 h-1.5 rounded-full', dot[status]||dot.starting)}/>
      {status || 'starting'}
    </span>
  )
}

// ── Pill genérico ────────────────────────────────────────────────
function Pill({ tone='slate', children }){
  const map = {
    slate:  'bg-slate-700 text-slate-300',
    green:  'bg-emerald-500/20 text-emerald-400',
    red:    'bg-red-500/20    text-red-400',
    blue:   'bg-indigo-500/20 text-indigo-400',
    amber:  'bg-amber-500/20  text-amber-400',
  }
  return <span className={cls('px-2 py-0.5 rounded-full text-xs font-medium', map[tone])}>{children}</span>
}

// ── Item da sidebar ──────────────────────────────────────────────
function SidebarItem({ icon: Icon, label, active, onClick, badge }){
  return (
    <button onClick={onClick} className={cls(
      'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-150',
      active
        ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    )}>
      <Icon className='h-4 w-4 flex-shrink-0' />
      <span className='text-sm font-medium flex-1'>{label}</span>
      {badge != null && (
        <span className='text-xs bg-indigo-500 text-white px-1.5 py-0.5 rounded-full'>{badge}</span>
      )}
    </button>
  )
}

// ── Card de stat ────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color = 'indigo' }){
  const colors = {
    indigo: 'text-indigo-400 bg-indigo-500/10',
    emerald:'text-emerald-400 bg-emerald-500/10',
    amber:  'text-amber-400  bg-amber-500/10',
    slate:  'text-slate-400  bg-slate-500/10',
  }
  return (
    <div className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5 flex items-center gap-4'>
      <div className={cls('p-3 rounded-xl', colors[color])}>
        <Icon className={cls('h-5 w-5', colors[color].split(' ')[0])} />
      </div>
      <div>
        <div className='text-2xl font-bold text-white'>{value}</div>
        <div className='text-xs text-slate-500 mt-0.5'>{label}</div>
      </div>
    </div>
  )
}

// ── Modal ────────────────────────────────────────────────────────
function Modal({ open, title, children, onClose }){
  if(!open) return null
  return (
    <div className='fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50'>
      <div className='w-full max-w-5xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto'>
        <div className='p-5 flex items-center justify-between border-b border-slate-700 sticky top-0 bg-slate-900'>
          <div className='font-semibold text-white'>{title}</div>
          <button className='text-slate-500 hover:text-white transition-colors text-xl leading-none' onClick={onClose}>✕</button>
        </div>
        <div className='p-5'>{children}</div>
      </div>
    </div>
  )
}

// ── Campo de input dark ──────────────────────────────────────────
function Field({ label, children }){
  return (
    <div>
      <div className='text-xs font-medium text-slate-400 mb-1.5'>{label}</div>
      {children}
    </div>
  )
}

const inputCls = 'w-full bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/50 transition-all'
const selectCls = inputCls

// ── Build cron ───────────────────────────────────────────────────
function buildCron(d){
  const [hh='09', mm='00'] = String(d.time||'09:00').split(':')
  const H = String(parseInt(hh,10)||0)
  const M = String(parseInt(mm,10)||0)
  if (d.repeatKind==='daily') return `${M} ${H} * * *`
  if (d.repeatKind==='weekly'){
    const days=(d.weeklyDays?.length?d.weeklyDays:[1]).slice().sort((a,b)=>a-b)
    return `${M} ${H} * * ${days.join(',')}`
  }
  if (d.repeatKind==='monthly'){
    const day=Math.min(31,Math.max(1,parseInt(d.monthlyDay,10)||1))
    return `${M} ${H} ${day} * *`
  }
  const every=Math.max(1,parseInt(d.intervalEvery,10)||1)
  if (d.intervalUnit==='hours') return `${M} */${every} * * *`
  return `*/${every} * * * *`
}

// ── Login ────────────────────────────────────────────────────────
function Login({ onLogged }){
  const [email,setEmail]=useState('admin@admin.com')
  const [password,setPassword]=useState('Admin#123456')
  const [err,setErr]=useState('')
  const [loading,setLoading]=useState(false)

  async function submit(e){
    e.preventDefault(); setErr(''); setLoading(true)
    try{
      const r=await api('auth/login',{method:'POST',body:{email,password}})
      setToken(r.token); onLogged(r.user)
    }catch{ setErr('Credenciais inválidas') }
    finally{ setLoading(false) }
  }

  return (
    <div className='min-h-screen bg-slate-950 flex items-center justify-center p-6'>
      <div className='absolute inset-0 overflow-hidden pointer-events-none'>
        <div className='absolute top-1/4 left-1/3 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl'/>
        <div className='absolute bottom-1/4 right-1/3 w-72 h-72 bg-purple-600/10 rounded-full blur-3xl'/>
      </div>
      <div className='relative w-full max-w-sm'>
        <div className='text-center mb-8'>
          <div className='inline-flex items-center justify-center w-14 h-14 bg-indigo-600 rounded-2xl mb-4 shadow-lg shadow-indigo-500/30'>
            <Smartphone className='h-7 w-7 text-white'/>
          </div>
          <h1 className='text-2xl font-bold text-white'>AutoFlow</h1>
          <p className='text-slate-500 text-sm mt-1'>Painel WhatsApp</p>
        </div>

        <div className='bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl'>
          <form onSubmit={submit} className='space-y-4'>
            <Field label='E-mail'>
              <input className={inputCls} value={email} onChange={e=>setEmail(e.target.value)} autoComplete='email'/>
            </Field>
            <Field label='Senha'>
              <input type='password' className={inputCls} value={password} onChange={e=>setPassword(e.target.value)} autoComplete='current-password'/>
            </Field>
            {err && <div className='text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2'>{err}</div>}
            <button disabled={loading} className='w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 font-medium flex items-center justify-center gap-2 transition-colors'>
              {loading ? <Loader2 className='h-4 w-4 animate-spin'/> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// APP PRINCIPAL
// ══════════════════════════════════════════════════════════════════
export default function App(){
  const [user,setUser]       = useState(null)
  const [checking,setChecking] = useState(true)  // validando token
  const [view,setView]       = useState('dashboard')
  const [dashboard,setDashboard] = useState({recurringActive:0,contacts:0,templates:0})
  const [recurring,setRecurring] = useState([])
  const [templates,setTemplates] = useState([])
  const [audit,setAudit]     = useState([])
  const [whats,setWhats]     = useState({status:'starting',qr:null})
  const [q,setQ]             = useState('')
  const [createOpen,setCreateOpen] = useState(false)
  const [refreshing,setRefreshing] = useState(false)
  const [toast, setToast] = useState(null)

  function showToast(msg, type='indigo'){
    setToast({msg, type})
    setTimeout(()=>setToast(null), 3000)
  }

  const [draft,setDraft] = useState({
    name:'', targetType:'tag', targetValue:'clientes', templateId:'',
    tz:'America/Sao_Paulo', cronMode:'builder', repeatKind:'weekly',
    time:'09:00', weeklyDays:[1,2,3,4,5], monthlyDay:1,
    intervalEvery:15, intervalUnit:'minutes',
    throttlePerMinute:10, quietHours:{start:'21:00',end:'08:00'}, enabled:true, pattern:''
  })

  const builtCron = useMemo(()=>buildCron(draft),[draft])

  const filteredRecurring = useMemo(()=>{
    const s=q.trim().toLowerCase(); if(!s) return recurring
    return recurring.filter(r=>[r.name,r.pattern,r.tz,r.targetType,r.targetValue].join(' ').toLowerCase().includes(s))
  },[recurring,q])

  const loadAll = useCallback(async ()=>{
    try {
      const [dash,rec,tpl,aud]=await Promise.all([
        api('dashboard'), api('recurring'), api('templates'), api('audit')
      ])
      setDashboard(dash); setRecurring(rec); setTemplates(tpl); setAudit(aud)
    } catch(e) {
      if (String(e.message).includes('401') || String(e.message).includes('unauthorized') || String(e.message).includes('invalid_token')) {
        clearToken(); setUser(null)
      }
    }
    try{
      const [st,qr]=await Promise.all([api('whatsapp/status'), api('whatsapp/qr')])
      setWhats({status:st.status, qr:qr.qr})
    }catch{}
  },[])

  // Auth SÍNCRONA — sem async no startup, sem flicker
  useEffect(()=>{
    if (getToken()) setUser({email:'admin', role:'admin'})
    setChecking(false)
  },[])
  useEffect(()=>{ if(user) loadAll().catch(()=>{}) },[user, loadAll])

  // Auto-refresh QR a cada 5s quando estiver na view whatsapp
  useEffect(()=>{
    if(!user || view !== 'whatsapp') return
    const id = setInterval(async ()=>{
      try{
        const [st,qr]=await Promise.all([api('whatsapp/status'), api('whatsapp/qr')])
        setWhats({status:st.status, qr:qr.qr})
      }catch{}
    }, 5000)
    return ()=>clearInterval(id)
  },[user, view])

  if(checking) return (
    <div className='min-h-screen bg-slate-950 flex items-center justify-center'>
      <div className='flex flex-col items-center gap-4'>
        <div className='w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center'>
          <Smartphone className='h-6 w-6 text-white'/>
        </div>
        <Loader2 className='h-6 w-6 text-indigo-400 animate-spin'/>
        <span className='text-slate-500 text-sm'>Carregando...</span>
      </div>
    </div>
  )

  if(!user) return <Login onLogged={u=>setUser(u)}/>

  async function handleRefresh(){
    setRefreshing(true)
    await loadAll().catch(()=>{})
    setRefreshing(false)
  }

  async function pauseResume(item){
    if(item.enabled) await api(`recurring/${item._id}/pause`,{method:'POST'})
    else await api(`recurring/${item._id}/resume`,{method:'POST'})
    await loadAll()
  }

  async function cloneRecurring(id){
    await api(`recurring/${id}/clone`,{method:'POST'})
    showToast('Automação clonada! Ela começa pausada para revisão.','indigo')
    await loadAll()
    setView('recurring')
  }

  async function deleteRecurring(id){
    if(!confirm('Deletar esta automação? Esta ação não pode ser desfeita.')) return
    await api(`recurring/${id}`,{method:'DELETE'})
    showToast('Automação deletada.','slate')
    await loadAll()
  }

  async function createRecurring(){
    const finalPattern = draft.cronMode==='builder' ? builtCron : (draft.pattern||builtCron)
    await api('recurring',{method:'POST',body:{
      name: draft.name||'(Sem nome)', enabled: draft.enabled,
      targetType: draft.targetType, targetValue: draft.targetValue,
      templateId: draft.templateId, pattern: finalPattern, tz: draft.tz,
      throttlePerMinute: Number(draft.throttlePerMinute||10),
      quietHours: draft.quietHours,
    }})
    setCreateOpen(false); await loadAll()
  }

  // ── Layout ────────────────────────────────────────────────────
  return (
    <div className='min-h-screen bg-slate-950 text-white flex'>

      {/* Toast */}
      {toast && (
        <div className={cls(
          'fixed top-4 right-4 z-[100] px-4 py-3 rounded-xl text-sm font-medium shadow-xl flex items-center gap-2 transition-all',
          toast.type==='indigo' ? 'bg-indigo-600 text-white' :
          toast.type==='red'    ? 'bg-red-600 text-white' :
          'bg-slate-700 text-white'
        )}>
          {toast.msg}
          <button onClick={()=>setToast(null)} className='ml-2 opacity-70 hover:opacity-100'>✕</button>
        </div>
      )}

      {/* Sidebar */}
      <aside className='w-60 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col'>
        {/* Logo */}
        <div className='p-5 border-b border-slate-800'>
          <div className='flex items-center gap-3'>
            <div className='w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20'>
              <Smartphone className='h-5 w-5 text-white'/>
            </div>
            <div>
              <div className='font-bold text-white text-sm'>AutoFlow</div>
              <div className='text-xs text-slate-500'>WhatsApp Manager</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className='flex-1 p-3 space-y-1'>
          <SidebarItem icon={LayoutDashboard} label='Visão Geral'  active={view==='dashboard'} onClick={()=>setView('dashboard')}/>
          <SidebarItem icon={Users}           label='Clientes'     active={view==='contacts'}  onClick={()=>setView('contacts')}/>
          <SidebarItem icon={CalendarClock}   label='Esteira'      active={view==='pipeline'}  onClick={()=>setView('pipeline')} badge={dashboard.pipelineActive||null}/>
          <SidebarItem icon={Bell}            label='Automações'   active={view==='recurring'} onClick={()=>setView('recurring')} badge={dashboard.recurringActive||null}/>
          <SidebarItem icon={MessageSquareReply} label='Respostas Auto' active={view==='autoReply'} onClick={()=>setView('autoReply')}/>
          <SidebarItem icon={CalendarClock}   label='Agendamentos' active={view==='templates'} onClick={()=>setView('templates')}/>
          <SidebarItem icon={FileText}        label='Templates'    active={view==='tpl'}       onClick={()=>setView('tpl')}/>
          <SidebarItem icon={ShieldCheck}     label='Auditoria'    active={view==='audit'}     onClick={()=>setView('audit')}/>
          <SidebarItem icon={Calendar}        label='Assinaturas'  active={view==='subs'}      onClick={()=>setView('subs')}/>
          <SidebarItem icon={Smartphone}      label='WhatsApp'     active={view==='whatsapp'}  onClick={()=>setView('whatsapp')}/>
        </nav>

        {/* Footer sidebar */}
        <div className='p-3 border-t border-slate-800 space-y-2'>
          {/* Status WA */}
          <div className='bg-slate-800/60 rounded-xl px-3 py-2 flex items-center justify-between'>
            <div>
              <div className='text-xs text-slate-500'>WhatsApp</div>
              <div className='text-xs font-medium text-slate-300 mt-0.5'>Instância default</div>
            </div>
            <StatusBadge status={whats.status}/>
          </div>
          {/* User */}
          <div className='bg-slate-800/60 rounded-xl px-3 py-2'>
            <div className='text-xs text-slate-500'>Logado como</div>
            <div className='text-xs font-medium text-slate-300 mt-0.5 truncate'>{user.email}</div>
          </div>
          <button onClick={()=>{ clearToken(); setUser(null) }}
            className='w-full flex items-center justify-center gap-2 rounded-xl bg-slate-800 hover:bg-red-500/10 hover:text-red-400 text-slate-400 text-sm py-2 transition-colors'>
            <LogOut className='h-4 w-4'/> Sair
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className='flex-1 overflow-auto'>

        {/* ── VISÃO GERAL ── */}
        {view==='dashboard' && (
          <div className='p-6 space-y-5'>
            <div className='flex items-center justify-between'>
              <h1 className='text-xl font-bold text-white'>Visão Geral</h1>
              <div className='flex gap-2'>
                <button onClick={handleRefresh} className='flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors'>
                  <RefreshCw className={cls('h-4 w-4', refreshing && 'animate-spin')}/> Atualizar
                </button>
                <button onClick={()=>{setView('recurring');setCreateOpen(true)}} className='flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors'>
                  <Plus className='h-4 w-4'/> Nova automação
                </button>
              </div>
            </div>

            {/* Cards de status dos serviços */}
            <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
              {/* WhatsApp — compacto */}
              <div className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4'>
                <div className='w-12 h-12 bg-emerald-500/15 border border-emerald-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl'>📱</div>
                <div className='min-w-0 flex-1'>
                  <div className='text-sm font-semibold text-white'>WhatsApp</div>
                  <div className='flex items-center gap-1.5 mt-1'>
                    <span className={cls('w-2 h-2 rounded-full flex-shrink-0',
                      whats.status==='connected' ? 'bg-emerald-400 animate-pulse' :
                      whats.status==='qr'        ? 'bg-amber-400 animate-pulse' : 'bg-slate-500'
                    )}/>
                    <span className={cls('text-xs font-medium',
                      whats.status==='connected' ? 'text-emerald-400' :
                      whats.status==='qr'        ? 'text-amber-400' : 'text-slate-400'
                    )}>
                      {whats.status==='connected' ? 'Conectado' : whats.status==='qr' ? 'Aguardando QR' : 'Desconectado'}
                    </span>
                  </div>
                </div>
                {whats.status !== 'connected' && (
                  <button onClick={()=>setView('whatsapp')} className='flex-shrink-0 text-xs px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors'>
                    Conectar
                  </button>
                )}
              </div>

              {/* Automações */}
              <div className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4'>
                <div className='w-12 h-12 bg-indigo-500/15 border border-indigo-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl'>🤖</div>
                <div className='min-w-0 flex-1'>
                  <div className='text-sm font-semibold text-white'>Automações</div>
                  <div className='flex items-center gap-1.5 mt-1'>
                    <span className='w-2 h-2 rounded-full flex-shrink-0 bg-indigo-400'/>
                    <span className='text-xs font-medium text-indigo-400'>{dashboard.recurringActive||0} Regras Ativas</span>
                  </div>
                </div>
                <button onClick={()=>setView('recurring')} className='flex-shrink-0'>
                  <RefreshCw className='h-4 w-4 text-slate-500 hover:text-slate-300 transition-colors'/>
                </button>
              </div>

              {/* MongoDB */}
              <div className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 flex items-center gap-4'>
                <div className='w-12 h-12 bg-blue-500/15 border border-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0 text-2xl'>🗄️</div>
                <div className='min-w-0 flex-1'>
                  <div className='text-sm font-semibold text-white'>MongoDB</div>
                  <div className='flex items-center gap-1.5 mt-1'>
                    <span className='w-2 h-2 rounded-full flex-shrink-0 bg-emerald-400'/>
                    <span className='text-xs font-medium text-emerald-400'>Conectado</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Métricas de Assinaturas */}
            <SubsMetricsWidget onNavigate={()=>setView('contacts')}/>

            {/* Próximas execuções + Auditoria */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              <div className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5'>
                <div className='font-semibold text-white flex items-center gap-2 mb-4'>
                  <Clock className='h-4 w-4 text-slate-400'/> Próximas execuções
                </div>
                {(dashboard.upcoming||[]).length === 0 ? (
                  <div className='text-slate-500 text-sm'>Nenhuma automação ativa</div>
                ) : (
                  <div className='space-y-2'>
                    {(dashboard.upcoming||[]).map((u, i) => (
                      <div key={i} className='flex items-start justify-between gap-3 py-1.5 border-b border-slate-700/50 last:border-0'>
                        <div className='min-w-0'>
                          <div className='text-sm font-medium text-white truncate'>{u.name}</div>
                          <div className='text-xs text-slate-500'>{u.templateName}</div>
                        </div>
                        <div className='text-right flex-shrink-0'>
                          <div className='text-xs text-indigo-300 font-mono'>{new Date(u.next).toLocaleDateString('pt-BR',{day:'2-digit',month:'2-digit'})}</div>
                          <div className='text-xs text-slate-400 font-mono'>{new Date(u.next).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='font-semibold text-white flex items-center gap-2'>
                    <ShieldCheck className='h-4 w-4 text-slate-400'/> Atividade recente
                  </div>
                  <button onClick={()=>setView('audit')} className='text-xs text-indigo-400 hover:underline'>Ver tudo →</button>
                </div>
                {(dashboard.recentAudit||[]).length === 0 ? (
                  <div className='text-slate-500 text-sm'>Nenhuma atividade</div>
                ) : (
                  <div className='space-y-2'>
                    {(dashboard.recentAudit||[]).map((x, i) => (
                      <div key={i} className='flex items-center gap-3 py-1.5 border-b border-slate-700/50 last:border-0'>
                        <div className={cls('w-2 h-2 rounded-full flex-shrink-0', x.ok ? 'bg-emerald-400' : 'bg-red-400')}/>
                        <div className='flex-1 min-w-0'>
                          <div className='text-sm text-white font-medium'>{x.action.replace(/_/g,' ').toLowerCase()}</div>
                          <div className='text-xs text-slate-500 truncate'>{x.detail}</div>
                        </div>
                        <div className='text-xs text-slate-500 flex-shrink-0'>{new Date(x.at).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── WHATSAPP ── */}
        {view==='whatsapp' && (
          <div className='p-6 space-y-6'>
            <div className='flex items-center justify-between'>
              <div>
                <h1 className='text-xl font-bold text-white'>Conexão WhatsApp</h1>
                <p className='text-sm text-slate-500 mt-0.5'>Status e QR Code de conexão</p>
              </div>
              <button onClick={handleRefresh} className='flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors'>
                <RefreshCw className={cls('h-4 w-4', refreshing && 'animate-spin')}/> Atualizar
              </button>
            </div>

            <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
              {/* Status */}
              <div className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5'>
                <div className='flex items-center justify-between mb-4'>
                  <div className='font-semibold text-white'>Status da Conexão</div>
                  <StatusBadge status={whats.status}/>
                </div>
                {whats.status === 'connected' && (
                  <div className='flex items-center gap-2 text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3'>
                    <Wifi className='h-5 w-5 flex-shrink-0'/>
                    <span className='text-sm font-medium'>WhatsApp conectado! Pronto para enviar mensagens.</span>
                  </div>
                )}
                {whats.status === 'qr' && (
                  <div className='flex items-center gap-2 text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3'>
                    <Smartphone className='h-5 w-5 flex-shrink-0'/>
                    <span className='text-sm font-medium'>QR Code disponível ao lado. Escaneie com o WhatsApp.</span>
                  </div>
                )}
                {(whats.status === 'disconnected' || whats.status === 'starting') && (
                  <div className='flex items-center gap-2 text-slate-400 bg-slate-700/50 rounded-xl px-4 py-3'>
                    <Loader2 className='h-5 w-5 flex-shrink-0 animate-spin'/>
                    <span className='text-sm'>Inicializando gateway... aguarde alguns segundos.</span>
                  </div>
                )}
                <p className='text-xs text-slate-500 mt-4'>Atualiza automaticamente a cada 5 segundos</p>
              </div>

              {/* QR Code */}
              <div className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5'>
                <div className='font-semibold text-white mb-4'>QR Code</div>
                <div className='bg-white rounded-2xl flex items-center justify-center aspect-square max-w-[260px] mx-auto overflow-hidden'>
                  {whats.qr
                    ? <img src={whats.qr} alt='QR Code' className='w-full h-full object-contain'/>
                    : (
                      <div className='text-center text-slate-300 p-6'>
                        {whats.status === 'connected'
                          ? <><Wifi className='h-10 w-10 mx-auto mb-2 text-emerald-500'/><div className='text-sm text-slate-600'>Conectado!</div></>
                          : <><Loader2 className='h-10 w-10 mx-auto mb-2 animate-spin text-slate-300'/><div className='text-sm text-slate-400'>Aguardando QR...</div></>
                        }
                      </div>
                    )
                  }
                </div>
                <p className='text-xs text-slate-500 mt-3 text-center'>WhatsApp → Dispositivos conectados → Conectar dispositivo</p>
              </div>
            </div>
          </div>
        )}

        {/* ── AUTOMAÇÕES (RECURRING) ── */}
        {view==='recurring' && (
          <div className='p-6 space-y-5'>
            <div className='flex items-center justify-between gap-3'>
              <div>
                <h1 className='text-xl font-bold text-white'>Automações</h1>
                <p className='text-sm text-slate-500 mt-0.5'>Mensagens recorrentes com cron + timezone</p>
              </div>
              <div className='flex gap-2'>
                <div className='relative'>
                  <Search className='h-4 w-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2'/>
                  <input className='pl-9 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 w-64 text-sm focus:outline-none focus:border-indigo-500'
                    placeholder='Buscar...' value={q} onChange={e=>setQ(e.target.value)}/>
                </div>
                <button onClick={()=>setCreateOpen(true)}
                  className='flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors'>
                  <Plus className='h-4 w-4'/> Nova
                </button>
              </div>
            </div>

            <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
              <div className='grid grid-cols-12 bg-slate-800/50 text-xs font-semibold text-slate-400 border-b border-slate-700 px-4 py-3'>
                <div className='col-span-4'>Nome</div>
                <div className='col-span-3'>Cron / TZ</div>
                <div className='col-span-2'>Alvo</div>
                <div className='col-span-1'>Status</div>
                <div className='col-span-2'>Ações</div>
              </div>
              {filteredRecurring.length === 0 && (
                <div className='px-4 py-8 text-center text-slate-500 text-sm'>Nenhuma automação encontrada</div>
              )}
              {filteredRecurring.map(r => (
                <div key={r._id} className='grid grid-cols-12 border-b border-slate-800 px-4 py-3 text-sm hover:bg-slate-800/30 transition-colors'>
                  <div className='col-span-4'>
                    <div className='font-medium text-white'>{r.name}</div>
                    <div className='text-xs text-slate-500 mt-0.5'>Template: {r.templateId?.name||'—'}</div>
                    {r.quietHours?.start && (
                      <div className='text-xs text-slate-600 mt-0.5'>Silêncio: {r.quietHours.start}–{r.quietHours.end}</div>
                    )}
                  </div>
                  <div className='col-span-3'>
                    <div className='font-mono text-slate-300 text-xs'>{r.pattern}</div>
                    <div className='text-xs text-slate-500 mt-0.5'>{r.tz}</div>
                  </div>
                  <div className='col-span-2 text-slate-400 text-xs self-center'>{r.targetType}:{r.targetValue}</div>
                  <div className='col-span-1 self-center'><Pill tone={r.enabled?'green':'slate'}>{r.enabled?'Ativo':'Pausado'}</Pill></div>
                  <div className='col-span-2 self-center flex gap-1 flex-wrap'>
                    <button onClick={()=>pauseResume(r)} title={r.enabled?'Pausar':'Retomar'}
                      className='text-xs px-2 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-300 transition-colors'>
                      {r.enabled?'⏸':'▶'}
                    </button>
                    <button onClick={()=>cloneRecurring(r._id)} title='Clonar regra'
                      className='text-xs px-2 py-1.5 rounded-lg border border-slate-700 hover:bg-indigo-600/30 hover:border-indigo-500 text-slate-300 transition-colors'>
                      <ClipboardCopy className='h-3.5 w-3.5'/>
                    </button>
                    <button onClick={()=>deleteRecurring(r._id)} title='Deletar'
                      className='text-xs px-2 py-1.5 rounded-lg border border-red-900/50 hover:bg-red-500/10 text-red-500 transition-colors'>
                      <Trash2 className='h-3.5 w-3.5'/>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── TEMPLATES ── */}
        {view==='tpl' && <TemplatesView templates={templates} onReload={loadAll} showToast={showToast}/>}

        {/* ── AUDITORIA ── */}
        {view==='audit' && (
          <div className='p-6 space-y-5'>
            <div>
              <h1 className='text-xl font-bold text-white'>Auditoria</h1>
              <p className='text-sm text-slate-500 mt-0.5'>Histórico de eventos do sistema</p>
            </div>
            <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
              {audit.length === 0 && <div className='px-4 py-8 text-center text-slate-500 text-sm'>Nenhum evento registrado</div>}
              {audit.map(x => (
                <div key={x._id} className='p-4 border-b border-slate-800 flex items-start justify-between gap-3 hover:bg-slate-800/30 transition-colors'>
                  <div>
                    <div className='text-xs text-slate-500'>{new Date(x.at).toLocaleString('pt-BR')} • {x.who}</div>
                    <div className='text-sm font-semibold text-white mt-0.5'>{x.action}</div>
                    <div className='text-xs text-slate-400 mt-0.5'>{x.detail}</div>
                  </div>
                  <Pill tone={x.ok?'green':'red'}>{x.ok?'OK':'ERRO'}</Pill>
                </div>
              ))}
            </div>
          </div>
        )}

        {view==='contacts'  && <ClientsView />}
        {view==='pipeline'  && <PipelineView />}
        {view==='autoReply' && <AutoReplyView />}
        {view==='templates' && <ScheduledView templates={templates}/> }
        {view==='subs'      && <SubscriptionsView /> }
      </main>

      {/* ── MODAL Nova Recorrência ── */}
      <Modal open={createOpen} title='Nova automação recorrente' onClose={()=>setCreateOpen(false)}>
        <div className='grid grid-cols-1 lg:grid-cols-3 gap-5'>
          <div className='lg:col-span-2 space-y-4'>

            {/* Detalhes */}
            <div className='bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3'>
              <div className='text-sm font-semibold text-white'>Detalhes</div>
              <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                <Field label='Nome'>
                  <input className={inputCls} value={draft.name} onChange={e=>setDraft(p=>({...p,name:e.target.value}))} placeholder='Minha automação'/>
                </Field>
                <Field label='Template'>
                  <select className={selectCls} value={draft.templateId} onChange={e=>setDraft(p=>({...p,templateId:e.target.value}))}>
                    <option value=''>Selecione...</option>
                    {templates.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
                  </select>
                </Field>
                <Field label='Tipo de alvo'>
                  <select className={selectCls} value={draft.targetType} onChange={e=>setDraft(p=>({...p,targetType:e.target.value}))}>
                    <option value='tag'>Tag</option>
                    <option value='phone'>Número</option>
                    <option value='contact'>Contato</option>
                  </select>
                </Field>
                <Field label='Valor do alvo'>
                  <input className={inputCls} value={draft.targetValue} onChange={e=>setDraft(p=>({...p,targetValue:e.target.value}))} placeholder='clientes'/>
                </Field>
              </div>
            </div>

            {/* Cron */}
            <div className='bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3'>
              <div className='flex items-center justify-between'>
                <div>
                  <div className='text-sm font-semibold text-white'>Agendamento (Cron)</div>
                  <div className='text-xs text-slate-500'>Construtor visual ou cron manual</div>
                </div>
                <div className='flex gap-2'>
                  {['builder','manual'].map(m=>(
                    <button key={m} type='button' onClick={()=>setDraft(p=>({...p,cronMode:m,pattern:builtCron}))}
                      className={cls('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
                        draft.cronMode===m ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 text-slate-400 hover:bg-slate-700')}>
                      {m==='builder'?'Construtor':'Manual'}
                    </button>
                  ))}
                </div>
              </div>

              {draft.cronMode==='builder' ? (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  <Field label='Frequência'>
                    <select className={selectCls} value={draft.repeatKind} onChange={e=>setDraft(p=>({...p,repeatKind:e.target.value}))}>
                      <option value='interval'>A cada intervalo</option>
                      <option value='daily'>Diário</option>
                      <option value='weekly'>Semanal</option>
                      <option value='monthly'>Mensal</option>
                    </select>
                  </Field>
                  <Field label='Timezone'>
                    <select className={selectCls} value={draft.tz} onChange={e=>setDraft(p=>({...p,tz:e.target.value}))}>
                      {tzOptions.map(tz=><option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </Field>

                  {draft.repeatKind!=='interval' ? (
                    <Field label='Horário'>
                      <input type='time' className={inputCls} value={draft.time} onChange={e=>setDraft(p=>({...p,time:e.target.value}))}/>
                    </Field>
                  ) : (
                    <Field label='Intervalo'>
                      <div className='flex gap-2'>
                        <input type='number' className={inputCls} value={draft.intervalEvery} onChange={e=>setDraft(p=>({...p,intervalEvery:e.target.value}))}/>
                        <select className='bg-slate-800 border border-slate-600 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500' value={draft.intervalUnit} onChange={e=>setDraft(p=>({...p,intervalUnit:e.target.value}))}>
                          <option value='minutes'>min</option>
                          <option value='hours'>horas</option>
                        </select>
                      </div>
                    </Field>
                  )}

                  {draft.repeatKind==='weekly' && (
                    <div className='md:col-span-2'>
                      <div className='text-xs font-medium text-slate-400 mb-1.5'>Dias da semana</div>
                      <div className='flex flex-wrap gap-2'>
                        {[0,1,2,3,4,5,6].map(d=>{
                          const active=(draft.weeklyDays||[]).includes(d)
                          return (
                            <button key={d} type='button' onClick={()=>setDraft(p=>{
                              const set=new Set(p.weeklyDays||[]); if(set.has(d)) set.delete(d); else set.add(d)
                              return {...p,weeklyDays:Array.from(set).sort((a,b)=>a-b)}
                            })}
                              className={cls('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
                                active?'bg-indigo-600 border-indigo-500 text-white':'border-slate-600 text-slate-400 hover:bg-slate-700')}>
                              {labels[d]}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {draft.repeatKind==='monthly' && (
                    <Field label='Dia do mês'>
                      <input type='number' className={inputCls} min={1} max={31} value={draft.monthlyDay} onChange={e=>setDraft(p=>({...p,monthlyDay:e.target.value}))}/>
                    </Field>
                  )}

                  <div className='md:col-span-2'>
                    <div className='text-xs font-medium text-slate-400 mb-1.5'>Cron gerado</div>
                    <div className='flex gap-2'>
                      <input readOnly value={builtCron} className={cls(inputCls,'font-mono bg-slate-900 cursor-default')}/>
                      <button type='button' onClick={()=>navigator.clipboard?.writeText(builtCron)}
                        className='px-3 py-2 rounded-xl border border-slate-600 text-slate-400 hover:bg-slate-700 transition-colors'>
                        <Copy className='h-4 w-4'/>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className='grid grid-cols-1 md:grid-cols-2 gap-3'>
                  <Field label='Expressão Cron'>
                    <input className={cls(inputCls,'font-mono')} value={draft.pattern||builtCron} onChange={e=>setDraft(p=>({...p,pattern:e.target.value}))} placeholder='0 9 * * 1-5'/>
                  </Field>
                  <Field label='Timezone'>
                    <select className={selectCls} value={draft.tz} onChange={e=>setDraft(p=>({...p,tz:e.target.value}))}>
                      {tzOptions.map(tz=><option key={tz} value={tz}>{tz}</option>)}
                    </select>
                  </Field>
                </div>
              )}
            </div>
          </div>

          {/* Resumo + Salvar */}
          <div className='space-y-4'>
            <div className='bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-2'>
              <div className='text-sm font-semibold text-white'>Resumo</div>
              <div className='text-xs text-slate-400 space-y-1'>
                <div>Nome: <span className='text-slate-200'>{draft.name||'—'}</span></div>
                <div>Cron: <span className='text-slate-200 font-mono'>{draft.cronMode==='builder'?builtCron:(draft.pattern||builtCron)}</span></div>
                <div>TZ: <span className='text-slate-200'>{draft.tz}</span></div>
                <div>Alvo: <span className='text-slate-200'>{draft.targetType}:{draft.targetValue}</span></div>
              </div>
            </div>
            <button onClick={createRecurring}
              className='w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 font-medium text-sm transition-colors'>
              Salvar automação
            </button>
            <button onClick={()=>setCreateOpen(false)}
              className='w-full rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 py-2.5 text-sm transition-colors'>
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════

// VIEW: AutoReplyView — Cards + toggle + copiar + editar + deletar
// ══════════════════════════════════════════════════════════════════
function AutoReplyView() {
  const [rules, setRules]           = useState([])
  const [q, setQ]                   = useState('')
  const [modalOpen, setModalOpen]   = useState(false)
  const [editingId, setEditingId]   = useState(null)
  const [saving, setSaving]         = useState(false)
  const [loading, setLoading]       = useState(false)
  const [clientMode, setClientMode] = useState('all')
  const [migratedCount, setMigratedCount] = useState(0)
  const [testOpen, setTestOpen]     = useState(false)
  const [testForm, setTestForm]     = useState({ phone: '', text: '' })
  const [testResult, setTestResult] = useState(null)
  const [testing, setTesting]       = useState(false)

  const emptyForm = { keyword:'', targetPhone:'', reply:'', startTime:'00:00', endTime:'23:59', active:true }
  const [form, setForm] = useState(emptyForm)

  // ── Carregar regras da API ──────────────────────────────────────
  async function loadRules() {
    setLoading(true)
    try {
      const serverRules = await api('auto-reply')

      // ── Migração automática: localStorage → MongoDB ─────────────
      // Se há regras no localStorage mas não no banco, migrar automaticamente
      const localRaw = localStorage.getItem('autoflow_autoreplies')
      if (localRaw) {
        try {
          const localRules = JSON.parse(localRaw)
          if (localRules.length > 0 && serverRules.length === 0) {
            console.log(`🔄 Migrando ${localRules.length} regras do localStorage para o MongoDB...`)
            for (const r of localRules) {
              try {
                await api('auto-reply', {
                  method: 'POST',
                  body: {
                    keyword:    r.keyword,
                    reply:      r.reply,
                    targetPhone: r.targetPhone || '',
                    startTime:  r.startTime  || '00:00',
                    endTime:    r.endTime    || '23:59',
                    active:     r.active !== false,
                  }
                })
              } catch(e) { console.warn('Falha ao migrar regra:', r.keyword, e.message) }
            }
            localStorage.removeItem('autoflow_autoreplies')
            console.log('✅ Migração concluída! localStorage limpo.')
            // Recarregar do banco após migração
            const migrated = await api('auto-reply')
            setRules(migrated)
            setMigratedCount(localRules.length)
            return
          } else if (serverRules.length > 0) {
            // Já tem regras no banco — limpar localStorage antigo
            localStorage.removeItem('autoflow_autoreplies')
          }
        } catch(e) { console.warn('Erro na migração:', e) }
      }

      setRules(serverRules)
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { loadRules() }, [])

  function openNew() {
    setEditingId(null); setForm(emptyForm); setClientMode('all'); setModalOpen(true)
  }

  function openEdit(r) {
    setEditingId(r._id)
    setForm({ keyword:r.keyword, targetPhone:r.targetPhone||'', reply:r.reply, startTime:r.startTime||'00:00', endTime:r.endTime||'23:59', active:r.active })
    setClientMode(r.targetPhone ? 'specific' : 'all')
    setModalOpen(true)
  }

  async function save() {
    if (!form.keyword || !form.reply) return
    setSaving(true)
    try {
      const phone = clientMode === 'all' ? '' : form.targetPhone
      const body = { ...form, targetPhone: phone }
      if (editingId) await api(`auto-reply/${editingId}`, { method: 'PUT', body })
      else           await api('auto-reply', { method: 'POST', body })
      setModalOpen(false); setForm(emptyForm)
      await loadRules()
    } catch(e) { alert('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  async function toggleRule(id) {
    const rule = rules.find(r => r._id === id)
    if (!rule) return
    await api(`auto-reply/${id}`, { method: 'PUT', body: { ...rule, active: !rule.active } })
    await loadRules()
  }

  async function cloneRule(id) {
    await api(`auto-reply/${id}/clone`, { method: 'POST' })
    await loadRules()
  }

  async function deleteRule(id) {
    if (!confirm('Excluir esta regra?')) return
    await api(`auto-reply/${id}`, { method: 'DELETE' })
    await loadRules()
  }

  const filtered = q.trim()
    ? rules.filter(r => r.keyword.toLowerCase().includes(q.toLowerCase()) || r.reply.toLowerCase().includes(q.toLowerCase()))
    : rules

  async function runTest() {
    if (!testForm.phone || !testForm.text) return
    setTesting(true)
    try {
      const result = await api('auto-reply/test', {
        method: 'POST',
        body: { phone: testForm.phone.replace(/\D/g,''), text: testForm.text }
      })
      setTestResult(result)
    } catch(e) { setTestResult({ error: e.message }) }
    finally { setTesting(false) }
  }

  return (
    <div className='p-6 space-y-5'>

      {/* Banner de migração automática */}
      {migratedCount > 0 && (
        <div className='flex items-start gap-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3'>
          <span className='text-emerald-400 text-lg flex-shrink-0'>✅</span>
          <div>
            <div className='text-sm font-medium text-emerald-400'>
              {migratedCount} regra{migratedCount!==1?'s':''} migrada{migratedCount!==1?'s':''} automaticamente para o banco de dados!
            </div>
            <div className='text-xs text-slate-400 mt-1'>
              As regras agora estão no MongoDB e o auto-reply vai funcionar em tempo real.
            </div>
          </div>
          <button onClick={()=>setMigratedCount(0)} className='ml-auto text-slate-500 hover:text-slate-300 text-lg leading-none'>✕</button>
        </div>
      )}

      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold text-white'>Respostas Automáticas</h1>
          <p className='text-sm text-slate-500 mt-0.5'>Regras de resposta por palavra-chave</p>
        </div>
        <button onClick={openNew}
          className='flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors shadow-lg shadow-indigo-500/20'>
          <Plus className='h-4 w-4'/> Nova Regra
        </button>
      </div>

      <div className='flex items-center gap-3'>
        <div className='relative flex-1 max-w-sm'>
          <Search className='h-4 w-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2'/>
          <input className='w-full pl-11 bg-slate-800/80 border border-slate-700 text-white rounded-2xl px-4 py-2.5 text-sm focus:outline-none focus:border-indigo-500 transition-colors'
            placeholder='Buscar regra por palavra-chave...' value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
        <button onClick={()=>setTestOpen(true)}
          className='flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors border border-slate-700'>
          🧪 Testar
        </button>
      </div>

      {filtered.length === 0 && (
        <div className='py-16 text-center text-slate-500 text-sm'>
          {q ? 'Nenhuma regra encontrada' : 'Nenhuma regra criada ainda'}
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {filtered.map(r => (
          <div key={r._id||r.id} className={cls('bg-slate-800/60 border rounded-2xl p-5 flex flex-col gap-4 transition-all', r.active ? 'border-slate-700/80' : 'border-slate-800 opacity-70')}>

            <div className='flex items-start justify-between gap-3'>
              <div className='flex items-center gap-2'>
                <span className='text-indigo-400 text-lg'>⚡</span>
                <span className='font-mono font-semibold text-white text-base'>&quot;{r.keyword}&quot;</span>
              </div>
              <button onClick={() => toggleRule(r._id||r.id)} title={r.active ? 'Desativar' : 'Ativar'}
                className={cls('relative w-12 h-6 rounded-full transition-colors flex-shrink-0 mt-0.5', r.active ? 'bg-indigo-600' : 'bg-slate-600')}>
                <span className={cls('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm', r.active ? 'left-7' : 'left-1')}/>
              </button>
            </div>

            <div className='bg-slate-900/60 rounded-xl p-3 text-sm text-slate-300 leading-relaxed min-h-[56px]'>{r.reply}</div>

            <div className='flex items-center gap-4 text-xs text-slate-500 flex-wrap'>
              <span className='flex items-center gap-1.5'><Users className='h-3.5 w-3.5'/>{r.targetPhone ? r.targetPhone : 'Todos os clientes'}</span>
              <span className='flex items-center gap-1.5'><Clock className='h-3.5 w-3.5'/>{r.startTime||'00:00'} - {r.endTime||'23:59'}</span>
              <span className={cls('flex items-center gap-1 font-medium', r.active ? 'text-emerald-400' : 'text-slate-500')}>
                <span className={cls('w-1.5 h-1.5 rounded-full', r.active ? 'bg-emerald-400' : 'bg-slate-600')}/>
                {r.active ? 'Ativo' : 'Inativo'}
              </span>
            </div>

            <div className='grid grid-cols-3 gap-2 pt-1 border-t border-slate-700/50'>
              <button onClick={() => cloneRule(r._id||r.id)}
                className='flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors'>
                <ClipboardCopy className='h-3.5 w-3.5'/> Copiar
              </button>
              <button onClick={() => openEdit(r)}
                className='flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-indigo-600/30 hover:text-indigo-300 text-slate-300 text-xs font-medium transition-colors'>
                <Pencil className='h-3.5 w-3.5'/> Editar
              </button>
              <button onClick={() => deleteRule(r._id||r.id)}
                className='flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-700/50 hover:bg-red-500/20 hover:text-red-400 text-slate-400 text-xs font-medium transition-colors'>
                <Trash2 className='h-3.5 w-3.5'/>
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal open={modalOpen} title={editingId ? 'Editar Resposta Automática' : 'Criar Resposta Automática'} onClose={()=>setModalOpen(false)}>
        <div className='space-y-4 max-w-lg'>
          <div className='grid grid-cols-2 gap-4'>
            <Field label='Palavra-chave ou Mensagem Exata *'>
              <input className={inputCls} value={form.keyword} onChange={e=>setForm(p=>({...p,keyword:e.target.value}))} placeholder='Ex: como pode me ajudar'/>
            </Field>

            <Field label='Cliente Específico'>
              <div className='flex gap-2 mb-2'>
                <button type='button' onClick={()=>{ setClientMode('all'); setForm(p=>({...p,targetPhone:''})) }}
                  className={cls('flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                    clientMode==='all' ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-slate-600 text-slate-400 hover:bg-slate-700')}>
                  Todos os clientes
                </button>
                <button type='button' onClick={()=>setClientMode('specific')}
                  className={cls('flex-1 py-1.5 rounded-lg text-xs font-medium border transition-colors flex items-center justify-center gap-1',
                    clientMode==='specific' ? 'bg-emerald-600 border-emerald-500 text-white' : 'border-slate-600 text-slate-400 hover:bg-slate-700')}>
                  <Phone className='h-3 w-3'/> Puxar
                </button>
              </div>
              {clientMode === 'specific' ? (
                <PhoneAutocomplete value={form.targetPhone} onChange={v=>setForm(p=>({...p,targetPhone:v}))} placeholder='Buscar contato do WhatsApp...'/>
              ) : (
                <div className='bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-500 italic'>Responde a todos os contatos</div>
              )}
            </Field>
          </div>

          <Field label='Mensagem de Resposta *'>
            <textarea className={cls(inputCls, 'min-h-[100px] resize-y')} value={form.reply} onChange={e=>setForm(p=>({...p,reply:e.target.value}))} placeholder='Ex: Olá! Posso ajudar com...'/>
          </Field>

          <div className='grid grid-cols-2 gap-4'>
            <Field label='Horário Início'>
              <input type='time' className={inputCls} value={form.startTime} onChange={e=>setForm(p=>({...p,startTime:e.target.value}))}/>
            </Field>
            <Field label='Horário Fim'>
              <input type='time' className={inputCls} value={form.endTime} onChange={e=>setForm(p=>({...p,endTime:e.target.value}))}/>
            </Field>
          </div>

          <div className='flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3'>
            <div>
              <div className='text-sm font-medium text-white'>Ativar Regra</div>
              <div className='text-xs text-slate-500'>Deixa a resposta automática funcionando imediatamente.</div>
            </div>
            <button type='button' onClick={()=>setForm(p=>({...p,active:!p.active}))}
              className={cls('relative w-12 h-6 rounded-full transition-colors', form.active ? 'bg-indigo-600' : 'bg-slate-600')}>
              <span className={cls('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow', form.active ? 'left-7' : 'left-1')}/>
            </button>
          </div>

          <div className='flex gap-3 pt-1'>
            <button onClick={save} disabled={saving||!form.keyword||!form.reply||(clientMode==='specific'&&!form.targetPhone)}
              className='flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 font-medium text-sm flex items-center justify-center gap-2 transition-colors'>
              {saving ? <Loader2 className='h-4 w-4 animate-spin'/> : <MessageSquareReply className='h-4 w-4'/>}
              {editingId ? 'Salvar alterações' : 'Salvar Regra'}
            </button>
            <button onClick={()=>setModalOpen(false)}
              className='px-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm transition-colors'>
              Cancelar
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal de Diagnóstico / Teste */}
      <Modal open={testOpen} title='🧪 Testar Auto-Reply' onClose={()=>{setTestOpen(false);setTestResult(null)}}>
        <div className='space-y-4 max-w-lg'>
          <p className='text-sm text-slate-400'>Simula uma mensagem recebida e mostra qual regra seria ativada — sem enviar mensagem real.</p>

          <div className='grid grid-cols-2 gap-3'>
            <Field label='Número (remetente)'>
              <PhoneAutocomplete value={testForm.phone} onChange={v=>setTestForm(p=>({...p,phone:v}))} placeholder='5511999999999'/>
            </Field>
            <Field label='Texto da mensagem'>
              <input className={inputCls} value={testForm.text} onChange={e=>setTestForm(p=>({...p,text:e.target.value}))} placeholder='estou bem'/>
            </Field>
          </div>

          <button onClick={runTest} disabled={testing||!testForm.phone||!testForm.text}
            className='w-full rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 font-medium text-sm flex items-center justify-center gap-2'>
            {testing ? <Loader2 className='h-4 w-4 animate-spin'/> : '🧪'} Simular mensagem
          </button>

          {testResult && (
            <div className='space-y-3'>
              {testResult.error ? (
                <div className='bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-sm text-red-400'>
                  Erro: {testResult.error}
                </div>
              ) : (
                <>
                  {/* Resultado */}
                  {testResult.matched ? (
                    <div className='bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-3'>
                      <div className='text-emerald-400 font-medium text-sm'>✅ Regra encontrada!</div>
                      <div className='text-xs text-slate-300 mt-1'>Keyword: <code className='bg-slate-700 px-1 rounded'>{testResult.matched.keyword}</code></div>
                      <div className='text-xs text-slate-400 mt-1'>Resposta: {testResult.matched.reply}</div>
                    </div>
                  ) : (
                    <div className='bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3'>
                      <div className='text-amber-400 font-medium text-sm'>⚠️ Nenhuma regra ativada</div>
                      <div className='text-xs text-slate-400 mt-1'>Total de regras verificadas: {testResult.total_rules}</div>
                    </div>
                  )}

                  {/* Detalhes por regra */}
                  {testResult.checked?.length > 0 && (
                    <div>
                      <div className='text-xs font-medium text-slate-400 mb-2'>Detalhes por regra:</div>
                      <div className='space-y-1'>
                        {testResult.checked.map((c, i) => (
                          <div key={i} className={cls(
                            'flex items-center justify-between px-3 py-2 rounded-lg text-xs',
                            c.skip_reason ? 'bg-slate-800/50 text-slate-500' : 'bg-emerald-500/10 text-emerald-400'
                          )}>
                            <span className='font-mono'>{c.keyword}</span>
                            <span>{c.skip_reason
                              ? { numero_diferente: '⛔ Número diferente', fora_horario: '⏰ Fora do horário', keyword_nao_encontrada: '🔍 Keyword não encontrada' }[c.skip_reason] || c.skip_reason
                              : '✅ Ativada'
                            }</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}
// ══════════════════════════════════════════════════════════════════
function TemplatesView({ templates, onReload, showToast }) {
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState(null) // null = novo, objeto = editar
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ name: '', body: '', vars: '' })

  function openNew() {
    setEditing(null)
    setForm({ name: '', body: '', vars: '' })
    setModalOpen(true)
  }

  function openEdit(t) {
    setEditing(t)
    setForm({ name: t.name, body: t.body, vars: (t.vars||[]).join(', ') })
    setModalOpen(true)
  }

  // Detectar variáveis automaticamente ao digitar o body
  function handleBodyChange(v) {
    const detected = [...v.matchAll(/\{\{(\w+)\}\}/g)].map(m=>m[1])
    const unique = [...new Set(detected)]
    setForm(p=>({ ...p, body: v, vars: unique.join(', ') }))
  }

  async function save() {
    if (!form.name || !form.body) return
    setSaving(true)
    try {
      const vars = form.vars ? form.vars.split(',').map(v=>v.trim()).filter(Boolean) : []
      if (editing) {
        await api(`templates/${editing._id}`, { method: 'PUT', body: { name: form.name, body: form.body, vars } })
        showToast('Template atualizado!', 'indigo')
      } else {
        await api('templates', { method: 'POST', body: { name: form.name, body: form.body, vars } })
        showToast('Template criado!', 'indigo')
      }
      setModalOpen(false)
      await onReload()
    } catch(e) { showToast('Erro ao salvar: ' + e.message, 'red') }
    finally { setSaving(false) }
  }

  async function handleClone(id) {
    try {
      await api(`templates/${id}/clone`, { method: 'POST' })
      showToast('Template clonado!', 'indigo')
      await onReload()
    } catch(e) { showToast('Erro ao clonar', 'red') }
  }

  async function handleDelete(t) {
    if (!confirm(`Deletar template "${t.name}"? Esta ação não pode ser desfeita.`)) return
    try {
      await api(`templates/${t._id}`, { method: 'DELETE' })
      showToast('Template deletado.', 'slate')
      await onReload()
    } catch(e) { showToast('Erro ao deletar', 'red') }
  }

  return (
    <div className='p-6 space-y-5'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold text-white'>Templates</h1>
          <p className='text-sm text-slate-500 mt-0.5'>Mensagens reutilizáveis com variáveis dinâmicas</p>
        </div>
        <button onClick={openNew}
          className='flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors'>
          <Plus className='h-4 w-4'/> Novo template
        </button>
      </div>

      {templates.length === 0 && (
        <div className='bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-500 text-sm'>
          Nenhum template criado ainda
        </div>
      )}

      <div className='grid grid-cols-1 lg:grid-cols-2 gap-4'>
        {templates.map(t => (
          <div key={t._id} className='bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-3'>
            {/* Header */}
            <div className='flex items-start justify-between gap-2'>
              <div className='min-w-0'>
                <div className='font-semibold text-white truncate'>{t.name}</div>
                <div className='text-xs text-slate-500 mt-0.5'>
                  Variáveis: {(t.vars||[]).length > 0
                    ? (t.vars||[]).map(v=>(
                        <code key={v} className='mx-0.5 px-1.5 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs'>{'{{'+v+'}}'}</code>
                      ))
                    : <span className='text-slate-600'>nenhuma</span>
                  }
                </div>
              </div>
              {/* Ações */}
              <div className='flex gap-1 flex-shrink-0'>
                <button onClick={()=>openEdit(t)} title='Editar'
                  className='p-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-400 transition-colors'>
                  <Pencil className='h-3.5 w-3.5'/>
                </button>
                <button onClick={()=>handleClone(t._id)} title='Clonar'
                  className='p-1.5 rounded-lg border border-slate-700 hover:bg-indigo-600/30 hover:border-indigo-500 text-slate-400 transition-colors'>
                  <ClipboardCopy className='h-3.5 w-3.5'/>
                </button>
                <button onClick={()=>handleDelete(t)} title='Deletar'
                  className='p-1.5 rounded-lg border border-red-900/50 hover:bg-red-500/10 text-red-500 transition-colors'>
                  <Trash2 className='h-3.5 w-3.5'/>
                </button>
              </div>
            </div>

            {/* Preview do body */}
            <pre className='text-sm bg-slate-800 text-slate-300 rounded-xl p-3 whitespace-pre-wrap font-sans flex-1 min-h-[60px]'>{t.body}</pre>

            <div className='text-xs text-slate-600'>
              Criado: {new Date(t.createdAt).toLocaleDateString('pt-BR')}
            </div>
          </div>
        ))}
      </div>

      {/* Modal Criar/Editar */}
      <Modal
        open={modalOpen}
        title={editing ? `Editar: ${editing.name}` : 'Novo template'}
        onClose={()=>setModalOpen(false)}
      >
        <div className='space-y-4 max-w-2xl'>
          <Field label='Nome do template *'>
            <input className={inputCls} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder='Ex: Confirmação de pedido'/>
          </Field>

          <Field label='Mensagem *'>
            <textarea
              className={cls(inputCls, 'min-h-[140px] resize-y font-mono text-sm')}
              value={form.body}
              onChange={e=>handleBodyChange(e.target.value)}
              placeholder={'Olá {{nome}}! Seu pedido {{codigo}} foi confirmado. ✅'}
            />
            <p className='text-xs text-slate-500 mt-1'>
              Use <code className='px-1 bg-slate-700 rounded'>{'{{variavel}}'}</code> para inserir dados dinâmicos. As variáveis são detectadas automaticamente.
            </p>
          </Field>

          <Field label='Variáveis detectadas'>
            <div className='flex flex-wrap gap-2 min-h-[32px] bg-slate-800/50 border border-slate-700 rounded-xl px-3 py-2'>
              {form.vars
                ? form.vars.split(',').map(v=>v.trim()).filter(Boolean).map(v=>(
                    <span key={v} className='px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs font-mono'>
                      {'{{'+v+'}}'}
                    </span>
                  ))
                : <span className='text-slate-600 text-xs italic'>nenhuma variável detectada</span>
              }
            </div>
          </Field>

          <div className='flex gap-3 pt-2'>
            <button onClick={save} disabled={saving||!form.name||!form.body}
              className='flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 font-medium text-sm flex items-center justify-center gap-2 transition-colors'>
              {saving ? <Loader2 className='h-4 w-4 animate-spin'/> : <FileText className='h-4 w-4'/>}
              {editing ? 'Salvar alterações' : 'Criar template'}
            </button>
            <button onClick={()=>setModalOpen(false)}
              className='px-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm transition-colors'>
              Cancelar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}


// ══════════════════════════════════════════════════════════════════
// VIEW: ScheduledView — Mensagens Agendadas (envio único)
// ══════════════════════════════════════════════════════════════════
function ScheduledView({ templates }) {
  const [messages, setMessages] = useState([])
  const [loading, setLoading]   = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving]     = useState(false)
  const [filter, setFilter]     = useState('all')
  const [form, setForm]         = useState({ phone:'', contactName:'', message:'', templateId:'', scheduledDate:'', scheduledTime:'', name:'' })

  async function load(f) {
    setLoading(true)
    try {
      const status = (f||filter) !== 'all' ? `?status=${f||filter}` : ''
      const data = await api(`scheduled${status}`)
      setMessages(Array.isArray(data) ? data : [])
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load(filter) }, [filter])

  function handleTemplateChange(id) {
    const tpl = templates.find(t => t._id === id)
    setForm(p => ({ ...p, templateId: id, message: tpl ? tpl.body : p.message }))
  }

  async function save() {
    if (!form.phone || !form.message || !form.scheduledDate || !form.scheduledTime) return
    setSaving(true)
    try {
      const scheduledAt = new Date(`${form.scheduledDate}T${form.scheduledTime}:00`).toISOString()
      await api('scheduled', { method:'POST', body:{ phoneE164: form.phone.replace(/\D/g,''), contactName: form.contactName, message: form.message, templateId: form.templateId||undefined, scheduledAt, name: form.name } })
      setModalOpen(false); setForm({ phone:'', contactName:'', message:'', templateId:'', scheduledDate:'', scheduledTime:'', name:'' }); load(filter)
    } catch(e) { alert('Erro: ' + e.message) } finally { setSaving(false) }
  }

  async function handleCancel(id) {
    if (!confirm('Cancelar?')) return
    try { await api(`scheduled/${id}/cancel`, { method:'POST' }); load(filter) } catch(e) { alert(e.message) }
  }

  async function handleDelete(id) {
    if (!confirm('Remover?')) return
    try { await api(`scheduled/${id}`, { method:'DELETE' }); load(filter) } catch(e) { alert(e.message) }
  }

  const now = new Date()
  const minDate = now.toISOString().split('T')[0]
  const STATUS_MAP = {
    pending:   { cls:'bg-slate-700 text-slate-400',        label:'Pendente'  },
    queued:    { cls:'bg-indigo-500/20 text-indigo-400',   label:'Agendado'  },
    sent:      { cls:'bg-emerald-500/20 text-emerald-400', label:'Enviado'   },
    failed:    { cls:'bg-red-500/20 text-red-400',         label:'Falhou'    },
    cancelled: { cls:'bg-slate-700 text-slate-500',        label:'Cancelado' },
  }
  function timeUntil(date) {
    const diff = new Date(date) - new Date()
    if (diff <= 0) return 'Agora'
    const mins = Math.floor(diff/60000); if(mins<60) return `em ${mins}min`
    const hrs = Math.floor(mins/60); if(hrs<24) return `em ${hrs}h`
    return `em ${Math.floor(hrs/24)}d`
  }
  const counts = messages.reduce((acc,m)=>{acc[m.status]=(acc[m.status]||0)+1;return acc},{})

  return (
    <div className='p-6 space-y-5'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold text-white'>Agendamentos</h1>
          <p className='text-sm text-slate-500 mt-0.5'>Mensagens únicas em data e hora específica</p>
        </div>
        <button onClick={()=>setModalOpen(true)} className='flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors'>
          <Plus className='h-4 w-4'/> Novo agendamento
        </button>
      </div>

      <div className='flex gap-2 flex-wrap'>
        {[{key:'all',label:'Todos',count:messages.length},{key:'queued',label:'Aguardando',count:counts.queued||0},{key:'sent',label:'Enviados',count:counts.sent||0},{key:'failed',label:'Falhou',count:counts.failed||0},{key:'cancelled',label:'Cancelados',count:counts.cancelled||0}].map(f=>(
          <button key={f.key} onClick={()=>setFilter(f.key)}
            className={cls('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors', filter===f.key?'bg-indigo-600 border-indigo-500 text-white':'border-slate-700 text-slate-400 hover:bg-slate-800')}>
            {f.label}{f.count>0&&<span className='ml-1.5 bg-black/20 px-1.5 py-0.5 rounded-full'>{f.count}</span>}
          </button>
        ))}
        <button onClick={()=>load(filter)} className='ml-auto px-3 py-1.5 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-xs flex items-center gap-1.5'>
          <RefreshCw className={cls('h-3.5 w-3.5',loading&&'animate-spin')}/> Atualizar
        </button>
      </div>

      <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
        <div className='grid grid-cols-12 bg-slate-800/50 text-xs font-semibold text-slate-400 border-b border-slate-700 px-4 py-3'>
          <div className='col-span-3'>Destinatário</div><div className='col-span-4'>Mensagem</div><div className='col-span-2'>Data / Hora</div><div className='col-span-1'>Status</div><div className='col-span-2'>Ações</div>
        </div>
        {loading && <div className='flex items-center justify-center py-10 gap-2 text-slate-500 text-sm'><Loader2 className='h-4 w-4 animate-spin'/>Carregando...</div>}
        {!loading && messages.length===0 && <div className='px-4 py-10 text-center text-slate-500 text-sm'>Nenhum agendamento criado</div>}
        {!loading && messages.map(m=>{
          const st = STATUS_MAP[m.status]||STATUS_MAP.pending
          return (
            <div key={m._id} className='grid grid-cols-12 border-b border-slate-800 px-4 py-3 text-sm hover:bg-slate-800/20 transition-colors items-center'>
              <div className='col-span-3'>
                <div className='font-medium text-white'>{m.contactName||m.phoneE164}</div>
                {m.contactName&&<div className='text-xs text-slate-500 font-mono'>{m.phoneE164}</div>}
                {m.name&&<div className='text-xs text-indigo-400 mt-0.5'>{m.name}</div>}
              </div>
              <div className='col-span-4 text-slate-400 text-xs pr-3 line-clamp-2'>{m.message}</div>
              <div className='col-span-2'>
                <div className='text-sm text-white font-mono'>{new Date(m.scheduledAt).toLocaleDateString('pt-BR')}</div>
                <div className='text-xs text-slate-400'>{new Date(m.scheduledAt).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}{m.status==='queued'&&<span className='ml-1 text-indigo-300'>· {timeUntil(m.scheduledAt)}</span>}</div>
              </div>
              <div className='col-span-1'><span className={cls('px-2 py-1 rounded-full text-xs font-medium',st.cls)}>{st.label}</span></div>
              <div className='col-span-2 flex gap-1'>
                {(m.status==='pending'||m.status==='queued')&&<button onClick={()=>handleCancel(m._id)} title='Cancelar' className='p-1.5 rounded-lg border border-amber-900/50 hover:bg-amber-500/10 text-amber-600 hover:text-amber-400 transition-colors'><X className='h-3.5 w-3.5'/></button>}
                <button onClick={()=>handleDelete(m._id)} title='Remover' className='p-1.5 rounded-lg border border-red-900/50 hover:bg-red-500/10 text-red-600 hover:text-red-400 transition-colors'><Trash2 className='h-3.5 w-3.5'/></button>
              </div>
            </div>
          )
        })}
      </div>

      <Modal open={modalOpen} title='Novo Agendamento' onClose={()=>setModalOpen(false)}>
        <div className='grid grid-cols-1 lg:grid-cols-2 gap-5 max-w-3xl'>
          <div className='space-y-4'>
            <Field label='Destinatário *'>
              <PhoneAutocomplete
                value={form.phone}
                onChange={v=>setForm(p=>({...p,phone:v}))}
                onSelect={c => {
                  if (!form.contactName && c.name) {
                    setForm(p => ({ ...p, contactName: c.name }))
                  }
                }}
                placeholder='Ex: 5511999999999'
              />
            </Field>
            <Field label='Descrição (opcional)'><input className={inputCls} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder='Ex: Lembrete para João'/></Field>
            <Field label='Template (opcional)'>
              <select className={selectCls} value={form.templateId} onChange={e=>handleTemplateChange(e.target.value)}>
                <option value=''>Digitar mensagem manualmente</option>
                {templates.map(t=><option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </Field>
            <Field label='Mensagem *'><textarea className={cls(inputCls,'min-h-[100px] resize-y')} value={form.message} onChange={e=>setForm(p=>({...p,message:e.target.value}))} placeholder='Mensagem que será enviada...'/></Field>
          </div>
          <div className='space-y-4'>
            <div className='bg-slate-800/50 border border-slate-700 rounded-2xl p-4 space-y-3'>
              <div className='text-sm font-semibold text-white flex items-center gap-2'><Clock className='h-4 w-4 text-indigo-400'/> Data e Hora</div>
              <Field label='Data *'><input type='date' className={inputCls} min={minDate} value={form.scheduledDate} onChange={e=>setForm(p=>({...p,scheduledDate:e.target.value}))}/></Field>
              <Field label='Hora *'><input type='time' className={inputCls} value={form.scheduledTime} onChange={e=>setForm(p=>({...p,scheduledTime:e.target.value}))}/></Field>
              {form.scheduledDate&&form.scheduledTime&&(
                <div className='bg-indigo-500/10 border border-indigo-500/20 rounded-xl px-3 py-2'>
                  <div className='text-xs text-slate-400'>Será enviado em:</div>
                  <div className='text-sm font-medium text-indigo-300 mt-0.5'>{new Date(`${form.scheduledDate}T${form.scheduledTime}:00`).toLocaleString('pt-BR')}</div>
                  <div className='text-xs text-indigo-400 mt-0.5'>{timeUntil(`${form.scheduledDate}T${form.scheduledTime}:00`)}</div>
                </div>
              )}
            </div>
            <div className='flex gap-3'>
              <button onClick={save} disabled={saving||!form.phone||!form.message||!form.scheduledDate||!form.scheduledTime}
                className='flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 font-medium text-sm flex items-center justify-center gap-2 transition-colors'>
                {saving?<Loader2 className='h-4 w-4 animate-spin'/>:<Calendar className='h-4 w-4'/>} Agendar envio
              </button>
              <button onClick={()=>setModalOpen(false)} className='px-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm'>Cancelar</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// WIDGET: SubsMetricsWidget — métricas de assinatura no dashboard
// ══════════════════════════════════════════════════════════════════
function SubsMetricsWidget({ onNavigate }) {
  const [metrics, setMetrics] = useState(null)

  useEffect(() => {
    api('subscriptions/metrics').then(setMetrics).catch(()=>{})
  }, [])

  if (!metrics) return null

  return (
    <div className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-5'>
      <div className='flex items-center justify-between mb-4'>
        <div className='font-semibold text-white flex items-center gap-2'>
          <Bell className='h-4 w-4 text-slate-400'/> Métricas de Assinaturas
        </div>
        <button onClick={onNavigate} className='text-xs text-indigo-400 hover:underline'>Gerenciar →</button>
      </div>
      <div className='grid grid-cols-3 gap-4'>
        {[
          { label:'Clientes Ativos',    value: metrics.active,             color:'bg-indigo-400' },
          { label:'Vencendo em 7 dias', value: metrics.expiring7dCount,    color:'bg-amber-400'  },
          { label:'Vencendo Hoje',      value: metrics.expiringTodayCount, color:'bg-red-400'    },
        ].map(s => (
          <div key={s.label} className='text-center'>
            <div className={cls('h-1 rounded-full mx-auto mb-2 w-8', s.color)}/>
            <div className='text-2xl font-bold text-white'>{s.value ?? 0}</div>
            <div className='text-xs text-slate-500 mt-0.5'>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// VIEW: ClientsView COMPLETA — Gestão + ciclo de assinatura mensal
// ══════════════════════════════════════════════════════════════════
function ClientsView() {
  const [contacts, setContacts] = useState([])
  const [modalOpen, setModalOpen] = useState(false)
  const [notifModal, setNotifModal] = useState(false)
  const [editTarget, setEditTarget] = useState(null) // null=novo, obj=editar
  const [saving, setSaving] = useState(false)
  const [q, setQ] = useState('')
  const [stageFilter, setStageFilter] = useState('all')

  // Mensagens de notificação editáveis (localStorage para simplicidade)
  const [notifTexts, setNotifTexts] = useState(() => {
    const defaultTexts = {
      msg7d: 'Olá {{nome}}! Sua assinatura vence em 7 dias. Deseja renovar?',
      msgToday: 'Olá {{nome}}! Sua assinatura expira hoje. Entre em contato para renovar.',
    };
    try {
      const saved = localStorage.getItem('autoflow_notif_texts');
      return saved ? { ...defaultTexts, ...JSON.parse(saved) } : defaultTexts;
    } catch {
      return defaultTexts;
    }
  });

  const [notifForm, setNotifForm] = useState(notifTexts);
  useEffect(() => { setNotifForm(notifTexts) }, [notifTexts]);

  const emptyForm = { phone: '', name: '', tags: '', startDate: '', endDate: '' }
  const [form, setForm] = useState(emptyForm)

  async function load() {
    try { const d = await api('contacts'); setContacts(d) } catch {}
  }

  useEffect(() => { load() }, [])

  // Calcular etapa de cada contato
  function getStage(c) {
    if (!c.subscriptionEnd) return 'no_sub'
    const now   = new Date(); now.setHours(0,0,0,0)
    const end   = new Date(c.subscriptionEnd); end.setHours(0,0,0,0)
    const diff  = Math.ceil((end - now) / 864e5)
    if (diff < 0)  return 'expired'
    if (diff === 0) return 'today'
    if (diff <= 7)  return 'warning'
    return 'active'
  }

  const STAGES = {
    all:     { label: 'Todos',          color: 'border-slate-700 text-slate-400' },
    active:  { label: 'Ativos',         color: 'border-emerald-500/50 text-emerald-400 bg-emerald-500/10' },
    warning: { label: 'Vencendo 7d',    color: 'border-amber-500/50 text-amber-400 bg-amber-500/10' },
    today:   { label: 'Vence Hoje',     color: 'border-red-500/50 text-red-400 bg-red-500/10' },
    expired: { label: 'Encerrados',     color: 'border-slate-600 text-slate-500 bg-slate-800' },
    no_sub:  { label: 'Sem assinatura', color: 'border-slate-700 text-slate-500' },
  }

  const STAGE_BADGE = {
    active:  'bg-emerald-500/20 text-emerald-400',
    warning: 'bg-amber-500/20  text-amber-400',
    today:   'bg-red-500/20    text-red-400',
    expired: 'bg-slate-700     text-slate-500',
    no_sub:  'bg-slate-800     text-slate-600',
  }
  const STAGE_LABEL = {
    active:'Ativo', warning:'Vencendo', today:'Vence hoje', expired:'Encerrado', no_sub:'Sem plano'
  }

  const stageCounts = contacts.reduce((acc, c) => {
    const s = getStage(c); acc[s] = (acc[s]||0)+1; return acc
  }, {})

  const filtered = contacts.filter(c => {
    const matchStage = stageFilter === 'all' || getStage(c) === stageFilter
    const matchQ = !q.trim() ||
      (c.name||'').toLowerCase().includes(q.toLowerCase()) ||
      (c.phoneE164||'').includes(q)
    return matchStage && matchQ
  })

  function openNew() { setEditTarget(null); setForm(emptyForm); setModalOpen(true) }
  function openEdit(c) {
    setEditTarget(c)
    setForm({
      phone: c.phoneE164||'',
      name: c.name||'',
      tags: (c.tags||[]).join(', '),
      startDate: c.subscriptionStart ? c.subscriptionStart.split('T')[0] : '',
      endDate:   c.subscriptionEnd   ? c.subscriptionEnd.split('T')[0]   : '',
    })
    setModalOpen(true)
  }

  async function save() {
    if (!form.phone) return
    setSaving(true)
    try {
      const tags = form.tags ? form.tags.split(',').map(t=>t.trim()).filter(Boolean) : []
      const body = {
        phoneE164: form.phone.replace(/\D/g,''),
        name: form.name || undefined,
        tags,
        subscriptionStart: form.startDate || null,
        subscriptionEnd:   form.endDate   || null,
      }
      if (editTarget) await api(`contacts/${editTarget._id}`, { method:'PUT', body })
      else            await api('contacts', { method:'POST', body })
      setModalOpen(false); setForm(emptyForm); await load()
    } catch(e) { alert('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  async function deleteContact(id) {
    if (!confirm('Remover este cliente?')) return
    try { await api(`contacts/${id}`, { method:'DELETE' }); await load() } catch(e) { alert(e.message) }
  }

  async function renewContact(c) {
    // Renovar: nova data_inicio = hoje, data_fim = hoje + 30 dias
    const start = new Date(); start.setHours(0,0,0,0)
    const end   = new Date(start); end.setDate(end.getDate() + 30)
    try {
      await api(`contacts/${c._id}`, {
        method:'PUT',
        body: {
          ...c,
          subscriptionStart: start.toISOString(),
          subscriptionEnd:   end.toISOString(),
        }
      })
      await load()
    } catch(e) { alert(e.message) }
  }

  function saveNotifTexts() {
    localStorage.setItem('autoflow_notif_texts', JSON.stringify(notifForm))
    setNotifTexts(notifForm)
    setNotifModal(false)
  }

  function daysLabel(c) {
    if (!c.subscriptionEnd) return null
    const now = new Date(); now.setHours(0,0,0,0)
    const end = new Date(c.subscriptionEnd); end.setHours(0,0,0,0)
    const diff = Math.ceil((end - now) / 864e5)
    if (diff < 0)   return <span className='text-red-400'>Encerrado há {Math.abs(diff)}d</span>
    if (diff === 0) return <span className='text-red-400 font-medium'>Vence hoje!</span>
    if (diff <= 7)  return <span className='text-amber-400'>Vence em {diff}d</span>
    return <span className='text-slate-400'>Vence em {diff}d</span>
  }

  return (
    <div className='p-6 space-y-5'>
      {/* Header */}
      <div className='flex items-center justify-between gap-3'>
        <div>
          <h1 className='text-xl font-bold text-white'>Gestão de Clientes</h1>
          <p className='text-sm text-slate-500 mt-0.5'>{contacts.length} cliente{contacts.length!==1?'s':''} cadastrado{contacts.length!==1?'s':''}</p>
        </div>
        <div className='flex gap-2'>
          <button onClick={()=>setNotifModal(true)}
            className='flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm transition-colors'>
            <Bell className='h-4 w-4'/> Textos de Aviso
          </button>
          <button onClick={openNew}
            className='flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm transition-colors'>
            <UserPlus className='h-4 w-4'/> Novo Cliente
          </button>
        </div>
      </div>

      {/* Filtros de estágio */}
      <div className='flex gap-2 flex-wrap'>
        {Object.entries(STAGES).map(([key, s]) => (
          <button key={key} onClick={()=>setStageFilter(key)}
            className={cls('px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors',
              stageFilter===key ? s.color : 'border-slate-700 text-slate-500 hover:bg-slate-800')}>
            {s.label}
            {key!=='all' && stageCounts[key] > 0 && (
              <span className='ml-1.5 opacity-80'>({stageCounts[key]})</span>
            )}
            {key==='all' && <span className='ml-1.5 opacity-80'>({contacts.length})</span>}
          </button>
        ))}
        <div className='relative ml-auto'>
          <Search className='absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400'/>
          <input className='pl-9 bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-1.5 w-48 text-sm focus:outline-none focus:border-indigo-500'
            placeholder='Buscar...' value={q} onChange={e=>setQ(e.target.value)}/>
        </div>
      </div>

      {/* Tabela */}
      <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
        <div className='grid grid-cols-12 bg-slate-800/50 text-xs font-semibold text-slate-400 border-b border-slate-700 px-4 py-3'>
          <div className='col-span-3'>Nome</div>
          <div className='col-span-3'>WhatsApp</div>
          <div className='col-span-2'>Início</div>
          <div className='col-span-2'>Vencimento</div>
          <div className='col-span-1'>Etapa</div>
          <div className='col-span-1'>Ações</div>
        </div>
        {filtered.length === 0 && (
          <div className='px-4 py-10 text-center text-slate-500 text-sm'>
            {q || stageFilter!=='all' ? 'Nenhum resultado' : 'Nenhum cliente cadastrado'}
          </div>
        )}
        {filtered.map(c => {
          const stage = getStage(c)
          return (
            <div key={c._id} className={cls(
              'grid grid-cols-12 border-b border-slate-800 px-4 py-3 text-sm hover:bg-slate-800/20 transition-colors items-center',
              stage==='expired' && 'opacity-70',
              stage==='today'   && 'bg-red-500/5',
              stage==='warning' && 'bg-amber-500/5',
            )}>
              <div className='col-span-3'>
                <div className='font-medium text-white'>{c.name || <span className='text-slate-500 italic'>Sem nome</span>}</div>
                {(c.tags||[]).length>0 && (
                  <div className='flex gap-1 mt-1 flex-wrap'>
                    {c.tags.slice(0,3).map(t=><span key={t} className='px-1.5 py-0.5 bg-slate-700 text-slate-400 rounded text-xs'>{t}</span>)}
                  </div>
                )}
              </div>
              <div className='col-span-3 text-slate-400 font-mono text-xs'>{c.phoneE164}</div>
              <div className='col-span-2 text-xs text-slate-500'>
                {c.subscriptionStart ? new Date(c.subscriptionStart).toLocaleDateString('pt-BR') : '—'}
              </div>
              <div className='col-span-2 text-xs'>
                {c.subscriptionEnd
                  ? <div><div className='text-slate-300'>{new Date(c.subscriptionEnd).toLocaleDateString('pt-BR')}</div><div className='mt-0.5'>{daysLabel(c)}</div></div>
                  : <span className='text-slate-600'>—</span>
                }
              </div>
              <div className='col-span-1'>
                <span className={cls('px-2 py-1 rounded-full text-xs font-medium', STAGE_BADGE[stage]||STAGE_BADGE.no_sub)}>
                  {STAGE_LABEL[stage]||stage}
                </span>
              </div>
              <div className='col-span-1 flex gap-1'>
                <button onClick={()=>openEdit(c)} title='Editar' className='p-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 text-slate-400 transition-colors'>
                  <Pencil className='h-3.5 w-3.5'/>
                </button>
                {(stage==='expired'||stage==='today') && (
                  <button onClick={()=>renewContact(c)} title='Renovar (+30 dias)' className='p-1.5 rounded-lg border border-emerald-900/50 hover:bg-emerald-500/10 text-emerald-600 hover:text-emerald-400 transition-colors text-xs'>
                    ↻
                  </button>
                )}
                <button onClick={()=>deleteContact(c._id)} title='Remover' className='p-1.5 rounded-lg border border-red-900/50 hover:bg-red-500/10 text-red-600 hover:text-red-400 transition-colors'>
                  <Trash2 className='h-3.5 w-3.5'/>
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {/* Modal Novo/Editar Cliente */}
      <Modal open={modalOpen} title={editTarget ? 'Editar Cliente' : 'Adicionar Novo Cliente'} onClose={()=>setModalOpen(false)}>
        <div className='space-y-4 max-w-md'>
          <Field label='Número de WhatsApp *'>
            <PhoneAutocomplete
              value={form.phone}
              onChange={v=>setForm(p=>({...p,phone:v}))}
              onSelect={c => {
                if (!form.name && c.name) {
                  const firstName = c.name.split(' ')[0]
                  setForm(p => ({ ...p, name: firstName }))
                }
              }}
              placeholder='Ex: 5511999999999'
            />
            <p className='text-xs text-slate-500 mt-1'>Digite ou selecione um contato do WhatsApp conectado</p>
          </Field>
          <Field label='Nome (opcional)'>
            <input className={inputCls} value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder='Nome do cliente'/>
          </Field>
          <Field label='Tags (separadas por vírgula)'>
            <input className={inputCls} value={form.tags} onChange={e=>setForm(p=>({...p,tags:e.target.value}))} placeholder='clientes, vip, mensal'/>
          </Field>
          <div className='grid grid-cols-2 gap-3'>
            <Field label='Data Início'>
              <input type='date' className={inputCls} value={form.startDate} onChange={e=>setForm(p=>({...p,startDate:e.target.value}))}/>
            </Field>
            <Field label='Data Fim (30 dias)'>
              <input type='date' className={inputCls} value={form.endDate} onChange={e=>setForm(p=>({...p,endDate:e.target.value}))}/>
            </Field>
          </div>
          {/* Atalho: preencher endDate automaticamente +30 dias */}
          {form.startDate && !form.endDate && (
            <button type='button' onClick={()=>{
              const d = new Date(form.startDate); d.setDate(d.getDate()+30)
              setForm(p=>({...p, endDate: d.toISOString().split('T')[0]}))
            }} className='text-xs text-indigo-400 hover:underline'>
              ↳ Preencher automaticamente +30 dias
            </button>
          )}
          <div className='flex gap-3 pt-2'>
            <button onClick={save} disabled={saving||!form.phone}
              className='flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white py-2.5 font-medium text-sm flex items-center justify-center gap-2 transition-colors'>
              {saving?<Loader2 className='h-4 w-4 animate-spin'/>:<UserPlus className='h-4 w-4'/>}
              {editTarget ? 'Salvar alterações' : 'Salvar Cliente'}
            </button>
            <button onClick={()=>setModalOpen(false)} className='px-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm'>Cancelar</button>
          </div>
        </div>
      </Modal>

      {/* Modal Textos de Aviso */}
      <Modal open={notifModal} title='Textos de Aviso de Vencimento' onClose={()=>setNotifModal(false)}>
        <div className='space-y-4 max-w-lg'>
          <p className='text-sm text-slate-400'>Estas mensagens serão enviadas automaticamente quando a assinatura do cliente estiver vencendo. Use <code className='px-1 bg-slate-700 rounded text-xs'>{"{{nome}}"}</code> para o nome do cliente.</p>
          <Field label='⚠️ Aviso de Última Semana (Faltam 7 dias)'>
            <textarea className={cls(inputCls,'min-h-[80px] resize-y')} value={notifForm.msg7d} onChange={e=>setNotifForm(p=>({...p,msg7d:e.target.value}))}/>
          </Field>
          <Field label='🚨 Aviso de Último Dia (Falta 1 dia)'>
            <textarea className={cls(inputCls,'min-h-[80px] resize-y')} value={notifForm.msgToday} onChange={e=>setNotifForm(p=>({...p,msgToday:e.target.value}))}/>
          </Field>
          <div className='flex gap-3'>
            <button onClick={saveNotifTexts} className='flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white py-2.5 font-medium text-sm'>Salvar Textos</button>
            <button onClick={()=>setNotifModal(false)} className='px-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm'>Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// VIEW: SubscriptionsView — redirect para Clientes filtrado
// ══════════════════════════════════════════════════════════════════
function SubscriptionsView() {
  const [metrics, setMetrics] = useState(null)
  const [expiring, setExpiring] = useState([])
  const [expired, setExpired]   = useState([])
  const [tab, setTab]           = useState('expiring')
  const [loading, setLoading]   = useState(false)

  async function load() {
    setLoading(true)
    try {
      const [m, exp, exd] = await Promise.all([
        api('subscriptions/metrics'),
        api('subscriptions/expiring?days=30'),
        api('subscriptions/expired'),
      ])
      setMetrics(m); setExpiring(exp); setExpired(exd)
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const list = tab === 'expiring' ? expiring : expired

  function daysInfo(dateStr) {
    const diff = Math.ceil((new Date(dateStr) - new Date()) / 864e5)
    if (diff <= 0) return <span className='text-red-400'>Venceu há {Math.abs(diff)}d</span>
    if (diff === 0) return <span className='text-red-400 font-medium'>Vence hoje</span>
    if (diff <= 7)  return <span className='text-amber-400'>Vence em {diff}d</span>
    return <span className='text-slate-400'>Vence em {diff}d</span>
  }

  return (
    <div className='p-6 space-y-5'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold text-white'>Assinaturas</h1>
          <p className='text-sm text-slate-500 mt-0.5'>Métricas de vencimento</p>
        </div>
        <button onClick={load} className='flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm'>
          <RefreshCw className={cls('h-4 w-4', loading&&'animate-spin')}/> Atualizar
        </button>
      </div>

      {metrics && (
        <div className='grid grid-cols-2 lg:grid-cols-5 gap-3'>
          {[
            { label:'Total',            value: metrics.total,              color:'text-white'        },
            { label:'Ativos',           value: metrics.active,             color:'text-emerald-400'  },
            { label:'Vencendo em 7d',   value: metrics.expiring7dCount,    color:'text-amber-400'    },
            { label:'Vencendo hoje',    value: metrics.expiringTodayCount, color:'text-red-400'      },
            { label:'Vencidos',         value: metrics.expired,            color:'text-slate-500'    },
          ].map(s => (
            <div key={s.label} className='bg-slate-800/60 border border-slate-700/50 rounded-2xl p-4 text-center'>
              <div className={cls('text-2xl font-bold', s.color)}>{s.value ?? 0}</div>
              <div className='text-xs text-slate-500 mt-1'>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      <div className='flex gap-2'>
        <button onClick={()=>setTab('expiring')}
          className={cls('px-4 py-2 rounded-xl text-sm border transition-colors', tab==='expiring'?'bg-amber-600/20 border-amber-500 text-amber-400':'border-slate-700 text-slate-400 hover:bg-slate-800')}>
          Vencendo em 30d ({expiring.length})
        </button>
        <button onClick={()=>setTab('expired')}
          className={cls('px-4 py-2 rounded-xl text-sm border transition-colors', tab==='expired'?'bg-red-600/20 border-red-500 text-red-400':'border-slate-700 text-slate-400 hover:bg-slate-800')}>
          Vencidos ({expired.length})
        </button>
      </div>

      <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
        <div className='grid grid-cols-12 bg-slate-800/50 text-xs font-semibold text-slate-400 border-b border-slate-700 px-4 py-3'>
          <div className='col-span-4'>Cliente</div>
          <div className='col-span-3'>WhatsApp</div>
          <div className='col-span-3'>Vencimento</div>
          <div className='col-span-2'>Status</div>
        </div>
        {loading && <div className='py-10 text-center text-slate-500 text-sm flex items-center justify-center gap-2'><Loader2 className='h-4 w-4 animate-spin'/>Carregando...</div>}
        {!loading && list.length === 0 && <div className='py-10 text-center text-slate-500 text-sm'>Nenhum resultado</div>}
        {!loading && list.map(c => (
          <div key={c._id} className='grid grid-cols-12 border-b border-slate-800 px-4 py-3 text-sm hover:bg-slate-800/20 transition-colors items-center'>
            <div className='col-span-4 font-medium text-white'>{c.name || <span className='text-slate-500 italic'>Sem nome</span>}</div>
            <div className='col-span-3 text-slate-400 text-xs font-mono'>{c.phoneE164}</div>
            <div className='col-span-3 text-xs'>{new Date(c.subscriptionEnd).toLocaleDateString('pt-BR')}</div>
            <div className='col-span-2 text-xs'>{daysInfo(c.subscriptionEnd)}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════════
// VIEW: PipelineView — Esteira de Produção
// Onboarding 30min → Semana 1 → Semana 2 → Semana 3 → Dia 30
// ══════════════════════════════════════════════════════════════════
function PipelineView() {
  const [tab, setTab]             = useState('clients')  // clients | config | onboarding
  const [metrics, setMetrics]     = useState({})
  const [clients, setClients]     = useState([])
  const [pipelineCfg, setPipelineCfg] = useState(null)
  const [onboardCfg, setOnboardCfg]   = useState(null)
  const [loading, setLoading]     = useState(false)
  const [saving, setSaving]       = useState(false)
  const [addModal, setAddModal]   = useState(false)
  const [addForm, setAddForm]     = useState({ phone: '', name: '' })
  const [statusFilter, setStatusFilter] = useState('all')

  async function load() {
    setLoading(true)
    try {
      const [m, c, pc, oc] = await Promise.all([
        api('pipeline/metrics'),
        api('pipeline/contacts'),
        api('pipeline/config'),
        api('onboarding/config'),
      ])
      setMetrics(m); setClients(c); setPipelineCfg(pc); setOnboardCfg(oc)
    } catch(e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  async function savePipelineCfg() {
    setSaving(true)
    try { await api('pipeline/config', { method: 'PUT', body: pipelineCfg }); alert('Salvo!') }
    catch(e) { alert('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  async function saveOnboardCfg() {
    setSaving(true)
    try { await api('onboarding/config', { method: 'PUT', body: onboardCfg }); alert('Salvo!') }
    catch(e) { alert('Erro: ' + e.message) }
    finally { setSaving(false) }
  }

  async function addClient() {
    if (!addForm.phone) return
    try {
      await api('pipeline/contacts', { method:'POST', body:{ phoneE164: addForm.phone.replace(/\D/g,''), name: addForm.name } })
      setAddModal(false); setAddForm({ phone:'', name:'' }); load()
    } catch(e) { alert('Erro: ' + e.message) }
  }

  async function renewClient(id) {
    if (!confirm('Renovar cliente? Ele reinicia a esteira do início.')) return
    try { await api(`pipeline/contacts/${id}/renew`, { method:'POST' }); load() }
    catch(e) { alert(e.message) }
  }

  async function endClient(id) {
    if (!confirm('Encerrar este cliente na esteira?')) return
    try { await api(`pipeline/contacts/${id}/end`, { method:'POST' }); load() }
    catch(e) { alert(e.message) }
  }

  const STATUS_INFO = {
    onboarding: { label:'Boas-vindas', color:'bg-purple-500/20 text-purple-400', dot:'bg-purple-400' },
    week1:      { label:'Semana 1',   color:'bg-blue-500/20 text-blue-400',     dot:'bg-blue-400' },
    week2:      { label:'Semana 2',   color:'bg-indigo-500/20 text-indigo-400', dot:'bg-indigo-400' },
    week3:      { label:'Semana 3',   color:'bg-amber-500/20 text-amber-400',   dot:'bg-amber-400' },
    renewed:    { label:'Renovado',   color:'bg-emerald-500/20 text-emerald-400',dot:'bg-emerald-400' },
    ended:      { label:'Encerrado',  color:'bg-slate-700 text-slate-500',       dot:'bg-slate-500' },
  }

  function daysInPipeline(enteredAt) {
    return Math.floor((new Date() - new Date(enteredAt)) / 864e5)
  }

  const filtered = statusFilter === 'all' ? clients : clients.filter(c => c.status === statusFilter)

  return (
    <div className='p-6 space-y-5'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-xl font-bold text-white'>Esteira de Produção</h1>
          <p className='text-sm text-slate-500 mt-0.5'>Boas-vindas → Semana 1 → 2 → 3 → Dia 30</p>
        </div>
        <div className='flex gap-2'>
          <button onClick={load} className='flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm'>
            <RefreshCw className={cls('h-4 w-4', loading&&'animate-spin')}/>
          </button>
          <button onClick={()=>setAddModal(true)} className='flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm'>
            <UserPlus className='h-4 w-4'/> Novo cliente
          </button>
        </div>
      </div>

      {/* Métricas da esteira */}
      <div className='grid grid-cols-3 lg:grid-cols-6 gap-3'>
        {[
      { key:'onboarding', label:'Boas-vindas', val: metrics.onboarding||0 },
          { key:'week1',      label:'Semana 1',   val: metrics.week1||0 },
          { key:'week2',      label:'Semana 2',   val: metrics.week2||0 },
          { key:'week3',      label:'Semana 3',   val: metrics.week3||0 },
          { key:'renewed',    label:'Renovados',  val: metrics.renewed||0 },
          { key:'ended',      label:'Encerrados', val: metrics.ended||0 },
        ].map(s => {
          const si = STATUS_INFO[s.key] || {}
          return (
            <button key={s.key} onClick={()=>setStatusFilter(statusFilter===s.key?'all':s.key)}
              className={cls('bg-slate-800/60 border rounded-2xl p-3 text-center transition-all',
                statusFilter===s.key ? 'border-indigo-500/50' : 'border-slate-700/50 hover:border-slate-600')}>
              <div className='text-xl font-bold text-white'>{s.val}</div>
              <div className='text-xs text-slate-500 mt-0.5'>{s.label}</div>
            </button>
          )
        })}
      </div>

      {/* Tabs */}
      <div className='flex gap-2 border-b border-slate-800 pb-2'>
        {[['clients','Clientes'],['config','Mensagens das Semanas'],['onboarding','Boas-vindas']].map(([k,l]) => (
          <button key={k} onClick={()=>setTab(k)}
            className={cls('px-4 py-2 rounded-xl text-sm font-medium transition-colors',
              tab===k ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white')}>
            {l}
          </button>
        ))}
      </div>

      {/* ── ABA CLIENTES ── */}
      {tab==='clients' && (
        <div className='bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden'>
          <div className='grid grid-cols-12 bg-slate-800/50 text-xs font-semibold text-slate-400 border-b border-slate-700 px-4 py-3'>
            <div className='col-span-3'>Cliente</div>
            <div className='col-span-2'>WhatsApp</div>
            <div className='col-span-2'>Entrou</div>
            <div className='col-span-1'>Dias</div>
            <div className='col-span-2'>Etapa</div>
            <div className='col-span-2'>Ações</div>
          </div>
          {loading && <div className='py-10 text-center text-slate-500 text-sm flex items-center justify-center gap-2'><Loader2 className='h-4 w-4 animate-spin'/>Carregando...</div>}
          {!loading && filtered.length===0 && <div className='py-10 text-center text-slate-500 text-sm'>Nenhum cliente na esteira</div>}
          {!loading && filtered.map(c => {
            const si = STATUS_INFO[c.status] || STATUS_INFO.ended
            const days = daysInPipeline(c.enteredAt)
            return (
              <div key={c._id} className='grid grid-cols-12 border-b border-slate-800 px-4 py-3 text-sm hover:bg-slate-800/20 transition-colors items-center'>
                <div className='col-span-3 font-medium text-white'>{c.name || <span className='text-slate-500 italic'>Sem nome</span>}</div>
                <div className='col-span-2 text-slate-400 font-mono text-xs'>{c.phoneE164}</div>
                <div className='col-span-2 text-xs text-slate-500'>{new Date(c.enteredAt).toLocaleDateString('pt-BR')}</div>
                <div className='col-span-1 text-xs'>
                  <span className={cls('px-2 py-1 rounded-full font-medium', days>=28?'text-red-400':'text-slate-400')}>
                    {days}d
                  </span>
                </div>
                <div className='col-span-2'>
                  <span className={cls('px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 w-fit', si.color)}>
                    <span className={cls('w-1.5 h-1.5 rounded-full', si.dot)}/>{si.label}
                  </span>
                </div>
                <div className='col-span-2 flex gap-1'>
                  <button onClick={()=>renewClient(c._id)} title='Renovar' className='p-1.5 rounded-lg border border-emerald-900/50 hover:bg-emerald-500/10 text-emerald-600 hover:text-emerald-400 text-xs transition-colors'>↻</button>
                  <button onClick={()=>endClient(c._id)} title='Encerrar' className='p-1.5 rounded-lg border border-amber-900/50 hover:bg-amber-500/10 text-amber-600 hover:text-amber-400 transition-colors'><X className='h-3.5 w-3.5'/></button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ── ABA MENSAGENS DAS SEMANAS ── */}
      {tab==='config' && pipelineCfg && (
        <div className='space-y-4'>
          <div className='text-sm text-slate-400'>Configure os textos enviados automaticamente em cada semana. Use <code className='bg-slate-700 px-1 rounded text-xs'>{'{{nome}}'}</code> para o nome do cliente.</div>
          {(pipelineCfg.weeks||[]).sort((a,b)=>a.week-b.week).map((w, i) => (
            <div key={w.week} className='bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='font-semibold text-white'>Semana {w.week} — Dia {w.dayTrigger}</div>
                <div className='flex items-center gap-2'>
                  <span className='text-xs text-slate-500'>Horário de envio</span>
                  <input type='time' className={cls(inputCls,'w-28 text-sm')} value={w.sendTime||'08:00'}
                    onChange={e=>{
                      const weeks = [...pipelineCfg.weeks]
                      weeks[i] = { ...weeks[i], sendTime: e.target.value }
                      setPipelineCfg({ ...pipelineCfg, weeks })
                    }}/>
                </div>
              </div>
              <Field label='Mensagem *'>
                <textarea className={cls(inputCls,'min-h-[90px] resize-y')}
                  value={w.message||''}
                  onChange={e=>{
                    const weeks = [...pipelineCfg.weeks]
                    weeks[i] = { ...weeks[i], message: e.target.value }
                    setPipelineCfg({ ...pipelineCfg, weeks })
                  }}
                  placeholder={`Ex: Olá {{nome}}! Chegou a ${w.week === 3 ? 'última semana' : `semana ${w.week}`} do seu plano. Aproveite ao máximo!`}/>
              </Field>
              <Field label='URL de mídia (opcional — imagem, vídeo ou documento)'>
                <input className={inputCls} value={w.mediaUrl||''}
                  onChange={e=>{
                    const weeks = [...pipelineCfg.weeks]
                    weeks[i] = { ...weeks[i], mediaUrl: e.target.value }
                    setPipelineCfg({ ...pipelineCfg, weeks })
                  }}
                  placeholder='https://... (link público da mídia)'/>
              </Field>
            </div>
          ))}

          {/* Mensagem Dia 30 */}
          <div className='bg-slate-900 border border-red-900/30 rounded-2xl p-5 space-y-3'>
            <div className='font-semibold text-white flex items-center gap-2'>
              Dia 30 — Encerramento / Renovação
              <span className='text-xs text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full'>envio automático</span>
            </div>
            <Field label='Mensagem do dia 30'>
              <textarea className={cls(inputCls,'min-h-[80px] resize-y')}
                value={pipelineCfg.renewalMessage||''}
                onChange={e=>setPipelineCfg({...pipelineCfg,renewalMessage:e.target.value})}
                placeholder='Ex: Olá {{nome}}! Seu plano encerra hoje. Para renovar, entre em contato!'/>
            </Field>
          </div>

          <button onClick={savePipelineCfg} disabled={saving}
            className='w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2'>
            {saving?<Loader2 className='h-4 w-4 animate-spin'/>:<Bell className='h-4 w-4'/>} Salvar mensagens da esteira
          </button>
        </div>
      )}

      {/* ── ABA BOAS-VINDAS ── */}
      {tab==='onboarding' && onboardCfg && (
        <div className='space-y-4'>
          {/* Toggle ativo */}
          <div className='flex items-center justify-between bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3'>
            <div>
              <div className='text-sm font-medium text-white'>Boas-vindas ativo</div>
              <div className='text-xs text-slate-500'>Envia automaticamente {onboardCfg.delayMin||30} minutos após cadastrar o cliente na esteira</div>
            </div>
            <button type='button' onClick={()=>setOnboardCfg(p=>({...p,active:!p.active}))}
              className={cls('relative w-12 h-6 rounded-full transition-colors', onboardCfg.active?'bg-indigo-600':'bg-slate-600')}>
              <span className={cls('absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow', onboardCfg.active?'left-7':'left-1')}/>
            </button>
          </div>

          <Field label='Delay após cadastro (minutos)'>
            <input type='number' className={inputCls} value={onboardCfg.delayMin||30} min={1} max={1440}
              onChange={e=>setOnboardCfg(p=>({...p,delayMin:parseInt(e.target.value)||30}))}/>
          </Field>

          <div className='text-sm font-medium text-white'>Sequência de mensagens</div>
          {(onboardCfg.steps||[]).sort((a,b)=>a.order-b.order).map((step, i) => (
            <div key={i} className='bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3'>
              <div className='flex items-center justify-between'>
                <div className='flex items-center gap-2'>
                  {step.type === 'audio' && <Mic className='h-4 w-4 text-amber-400' />}
                  {step.type === 'image' && <Plus className='h-4 w-4 text-emerald-400' />}
                  {step.type === 'video' && <RefreshCw className='h-4 w-4 text-blue-400' />}
                  {step.type === 'document' && <FileText className='h-4 w-4 text-slate-400' />}
                  <span className='text-sm font-medium text-white'>Passo {step.order}</span>
                </div>
                <div className='flex items-center gap-2'>
                  <select className={cls(inputCls,'w-36 text-sm py-1')} value={step.type||'text'}
                    onChange={e=>{
                      const steps=[...onboardCfg.steps]; steps[i]={...steps[i],type:e.target.value}
                      setOnboardCfg({...onboardCfg,steps})
                    }}>
                    <option value='text'>Texto</option>
                    <option value='image'>Imagem</option>
                    <option value='video'>Vídeo</option>
                    <option value='audio'>Áudio/Voz</option>
                    <option value='document'>Documento</option>
                  </select>
                  <button onClick={()=>{
                    const steps=onboardCfg.steps.filter((_,j)=>j!==i)
                    setOnboardCfg({...onboardCfg,steps})
                  }} className='p-1.5 rounded-lg border border-red-900/50 hover:bg-red-500/10 text-red-600 hover:text-red-400 transition-colors'>
                    <Trash2 className='h-3.5 w-3.5'/>
                  </button>
                </div>
              </div>
              <Field label={step.type==='text'?'Texto da mensagem':'Legenda (opcional)'}>
                <textarea className={cls(inputCls,'min-h-[70px] resize-y')} value={step.content||''}
                  onChange={e=>{const steps=[...onboardCfg.steps];steps[i]={...steps[i],content:e.target.value};setOnboardCfg({...onboardCfg,steps})}}
                  placeholder='Ex: Bem-vindo {{nome}}! Aqui está sua apresentação...'/>
              </Field>
              {step.type!=='text' && (
                <Field label='URL da mídia'>
                  <input className={inputCls} value={step.mediaUrl||''}
                    onChange={e=>{const steps=[...onboardCfg.steps];steps[i]={...steps[i],mediaUrl:e.target.value};setOnboardCfg({...onboardCfg,steps})}}
                    placeholder='https://... (link público da mídia)'/>
                </Field>
              )}
              <Field label='Aguardar após passo anterior (segundos)'>
                <input type='number' className={inputCls} value={step.delayAfterPrev||0} min={0}
                  onChange={e=>{const steps=[...onboardCfg.steps];steps[i]={...steps[i],delayAfterPrev:parseInt(e.target.value)||0};setOnboardCfg({...onboardCfg,steps})}}/>
              </Field>
            </div>
          ))}

          <button onClick={()=>setOnboardCfg(p=>({...p,steps:[...(p.steps||[]),{order:(p.steps||[]).length+1,type:'text',content:'',mediaUrl:'',delayAfterPrev:0}]}))}
            className='w-full py-2.5 rounded-xl border border-dashed border-slate-600 text-slate-400 hover:border-indigo-500 hover:text-indigo-400 text-sm transition-colors'>
            + Adicionar passo
          </button>

          <button onClick={saveOnboardCfg} disabled={saving}
            className='w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-sm flex items-center justify-center gap-2'>
            {saving?<Loader2 className='h-4 w-4 animate-spin'/>:<Bell className='h-4 w-4'/>} Salvar boas-vindas
          </button>
        </div>
      )}

      {/* Modal Adicionar Cliente */}
      <Modal open={addModal} title='Adicionar à Esteira' onClose={()=>setAddModal(false)}>
        <div className='space-y-4 max-w-md'>
          <p className='text-sm text-slate-400'>O cliente receberá as boas-vindas em {onboardCfg?.delayMin||30} minutos e depois seguirá a esteira semanal automaticamente.</p>
          <Field label='WhatsApp *'>
            <PhoneAutocomplete
              value={addForm.phone}
              onChange={v=>setAddForm(p=>({...p,phone:v}))}
              onSelect={c => {
                if (!addForm.name && c.name) {
                  const firstName = c.name.split(' ')[0]
                  setAddForm(p => ({ ...p, name: firstName }))
                }
              }}
              placeholder='Ex: 5511999999999'
            />
          </Field>
          <Field label='Nome'>
            <input className={inputCls} value={addForm.name} onChange={e=>setAddForm(p=>({...p,name:e.target.value}))} placeholder='Nome do cliente'/>
          </Field>
          <div className='flex gap-3'>
            <button onClick={addClient} disabled={!addForm.phone}
              className='flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-medium flex items-center justify-center gap-2'>
              <UserPlus className='h-4 w-4'/> Adicionar à esteira
            </button>
            <button onClick={()=>setAddModal(false)} className='px-4 rounded-xl border border-slate-700 text-slate-400 hover:bg-slate-800 text-sm'>Cancelar</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
