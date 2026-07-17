import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import { searchMulti, IMG } from '../lib/tmdb'

// Top-bar search available on every page. Click the icon to open an overlay,
// type to search TMDB live, click a result to jump to its title page.
export default function GlobalSearch() {
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState(0)
  const inputRef = useRef(null)
  const debounce = useRef()
  const navigate = useNavigate()

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 30)
    else { setQ(''); setResults([]); setActive(0) }
  }, [open])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false)
      // Quick open with "/" when not already typing in a field.
      if (e.key === '/' && !open && !/input|textarea|select/i.test(document.activeElement?.tagName || '')) {
        e.preventDefault(); setOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    clearTimeout(debounce.current)
    if (!q.trim()) { setResults([]); setLoading(false); return }
    setLoading(true)
    debounce.current = setTimeout(async () => {
      try { setResults((await searchMulti(q)).slice(0, 8)); setActive(0) }
      catch { setResults([]) }
      finally { setLoading(false) }
    }, 300)
    return () => clearTimeout(debounce.current)
  }, [q])

  function pick(r) {
    setOpen(false)
    navigate(`/title/${r.media_type}/${r.tmdb_id}`)
  }

  function onInputKey(e) {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((i) => Math.min(i + 1, results.length - 1)) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)) }
    else if (e.key === 'Enter' && results[active]) pick(results[active])
  }

  return (
    <>
      <button className="bell" onClick={() => setOpen(true)} aria-label="Search" title="Search (press /)">
        <Search size={19} />
      </button>

      {open && (
        <div className="gsearch-backdrop" onClick={() => setOpen(false)}>
          <div className="gsearch" onClick={(e) => e.stopPropagation()}>
            <div className="gsearch-bar">
              <Search size={18} className="gsearch-ico" />
              <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={onInputKey}
                placeholder="Search movies & TV…" />
              <button className="gsearch-x" onClick={() => setOpen(false)} aria-label="Close"><X size={18} /></button>
            </div>
            {q.trim() && (
              <div className="gsearch-results">
                {loading && results.length === 0 ? (
                  <div className="gsearch-empty">Searching…</div>
                ) : results.length === 0 ? (
                  <div className="gsearch-empty">No matches for “{q}”.</div>
                ) : (
                  results.map((r, i) => (
                    <button key={`${r.media_type}-${r.tmdb_id}`} className={`gsearch-row ${i === active ? 'active' : ''}`}
                      onMouseEnter={() => setActive(i)} onClick={() => pick(r)}>
                      <div className="gsearch-thumb">
                        {IMG.poster(r.poster_path, 'w92')
                          ? <img src={IMG.poster(r.poster_path, 'w92')} alt="" loading="lazy" />
                          : <span>{r.title?.[0]}</span>}
                      </div>
                      <div className="gsearch-info">
                        <div className="gsearch-title">{r.title}</div>
                        <div className="gsearch-sub">{r.year || 'N/A'} · {r.media_type === 'tv' ? 'TV' : 'Movie'}</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  )
}
