import { useEffect, useMemo, useState } from 'react'
import { getGenres, discoverTitles } from '../lib/tmdb'
import { addToWatchlist, markWatched } from '../lib/db'
import { useAppData } from '../context/AppData'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { Poster, Spinner, Empty, SkeletonGrid, TitleLink } from '../components/ui'
import { keyOf } from '../lib/recommend'

const SORTS = [
  ['popularity.desc', 'Most popular'],
  ['vote_average.desc', 'Highest rated'],
  ['primary_release_date.desc', 'Newest'],
  ['primary_release_date.asc', 'Oldest'],
  ['revenue.desc', 'Biggest box office'],
]
const thisYear = new Date().getFullYear()

export default function Browse() {
  const { groups } = useAppData()
  const { user } = useAuth()
  const toast = useToast()

  const [media, setMedia] = useState('movie')
  const [genreList, setGenreList] = useState([])
  const [genres, setGenres] = useState([]) // selected ids
  const [yearMin, setYearMin] = useState('')
  const [yearMax, setYearMax] = useState('')
  const [ratingMin, setRatingMin] = useState('')
  const [sortBy, setSortBy] = useState('popularity.desc')

  const [results, setResults] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [selected, setSelected] = useState(new Map()) // key -> result
  const [panel, setPanel] = useState(null) // 'lists' | 'watch' | null

  useEffect(() => {
    getGenres(media).then(setGenreList).catch(() => setGenreList([]))
    setGenres([])
  }, [media])

  // sort options that translate per media type
  const sortOptions = useMemo(() => SORTS.map(([v, l]) => {
    if (media === 'tv') v = v.replace('primary_release_date', 'first_air_date')
    return [v, l]
  }), [media])

  async function run(toPage = 1, append = false) {
    setLoading(true)
    try {
      const data = await discoverTitles(media, {
        genres, yearMin: yearMin || undefined, yearMax: yearMax || undefined,
        ratingMin: ratingMin || undefined, sortBy, page: toPage,
      })
      setTotalPages(data.totalPages)
      setPage(data.page)
      setResults((prev) => append ? [...prev, ...data.results] : data.results)
    } catch (e) { toast(e.message || 'Search failed', 'err') }
    finally { setLoading(false) }
  }

  useEffect(() => { run(1, false) /* eslint-disable-next-line */ }, [])

  function toggle(r) {
    const k = keyOf(r.media_type, r.tmdb_id)
    setSelected((m) => {
      const n = new Map(m)
      if (n.has(k)) n.delete(k); else n.set(k, r)
      return n
    })
  }
  const selectedList = [...selected.values()]

  return (
    <div className="page">
      <h1>Advanced browse</h1>

      {/* filters */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="seg" style={{ marginBottom: 12 }}>
          {[['movie', 'Movies'], ['tv', 'TV']].map(([v, l]) => (
            <button key={v} className={media === v ? 'on' : ''} onClick={() => setMedia(v)}>{l}</button>
          ))}
        </div>

        <label className="faint" style={{ fontWeight: 700, display: 'block', marginBottom: 6 }}>Genres</label>
        <div className="scroll-x" style={{ marginBottom: 12, flexWrap: 'wrap', display: 'flex' }}>
          {genreList.map((g) => {
            const on = genres.includes(g.id)
            return (
              <button key={g.id} className={`chip ${on ? 'active' : ''}`}
                style={on ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#0b0d12' } : undefined}
                onClick={() => setGenres((s) => on ? s.filter((x) => x !== g.id) : [...s, g.id])}>
                {g.name}
              </button>
            )
          })}
        </div>

        <div className="row" style={{ gap: 12, flexWrap: 'wrap' }}>
          <div className="field" style={{ flex: '1 1 120px', marginBottom: 0 }}>
            <label>From year</label>
            <input type="number" min="1900" max={thisYear} value={yearMin} onChange={(e) => setYearMin(e.target.value)} placeholder="any" />
          </div>
          <div className="field" style={{ flex: '1 1 120px', marginBottom: 0 }}>
            <label>To year</label>
            <input type="number" min="1900" max={thisYear} value={yearMax} onChange={(e) => setYearMax(e.target.value)} placeholder="any" />
          </div>
          <div className="field" style={{ flex: '1 1 120px', marginBottom: 0 }}>
            <label>Min rating</label>
            <select value={ratingMin} onChange={(e) => setRatingMin(e.target.value)}>
              <option value="">Any</option>
              {[5, 6, 7, 8, 9].map((n) => <option key={n} value={n}>{n}+</option>)}
            </select>
          </div>
          <div className="field" style={{ flex: '1 1 160px', marginBottom: 0 }}>
            <label>Sort by</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              {sortOptions.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
        </div>
        <button className="btn primary" style={{ marginTop: 14 }} onClick={() => run(1, false)}>Apply filters</button>
      </div>

      {loading && results.length === 0 ? <SkeletonGrid count={12} /> : results.length === 0 ? (
        <Empty icon="🔍">No titles match these filters.</Empty>
      ) : (
        <>
          <div className="grid">
            {results.map((r) => {
              const k = keyOf(r.media_type, r.tmdb_id)
              const on = selected.has(k)
              return (
                <div key={k} className="tile" style={{ position: 'relative' }}>
                  <button className={`select-dot ${on ? 'on' : ''}`} onClick={() => toggle(r)} aria-label="Select">
                    {on ? '✓' : ''}
                  </button>
                  <TitleLink tmdbId={r.tmdb_id} media={r.media_type}>
                    <Poster title={r.title} mediaType={r.media_type} posterPath={r.poster_path} />
                    <div className="tile-title">{r.title}</div>
                    <div className="tile-sub">{r.year || 'N/A'}</div>
                  </TitleLink>
                </div>
              )
            })}
          </div>
          {page < totalPages && (
            <div style={{ textAlign: 'center', marginTop: 20 }}>
              <button className="btn" disabled={loading} onClick={() => run(page + 1, true)}>
                {loading ? 'Loading…' : 'Load more'}
              </button>
            </div>
          )}
        </>
      )}

      {/* selection action bar */}
      {selectedList.length > 0 && (
        <div className="selbar">
          <div className="container selbar-inner">
            <span><strong>{selectedList.length}</strong> selected</span>
            <div className="row" style={{ gap: 8 }}>
              <button className="btn sm" onClick={() => setPanel(panel === 'lists' ? null : 'lists')}>🔖 Add to lists</button>
              <button className="btn sm primary" onClick={() => setPanel(panel === 'watch' ? null : 'watch')}>✓ Mark watched</button>
              <button className="btn sm ghost" onClick={() => { setSelected(new Map()); setPanel(null) }}>Clear</button>
            </div>
          </div>
          {panel === 'lists' && <BulkLists groups={groups} items={selectedList} userId={user.id} toast={toast}
            onDone={() => { setPanel(null); setSelected(new Map()) }} />}
          {panel === 'watch' && <BulkWatch groups={groups} items={selectedList} userId={user.id} toast={toast}
            onDone={() => { setPanel(null); setSelected(new Map()) }} />}
        </div>
      )}
    </div>
  )
}

function BulkLists({ groups, items, userId, onDone, toast }) {
  const [picked, setPicked] = useState([])
  const [busy, setBusy] = useState(false)
  async function go() {
    if (!picked.length) return
    setBusy(true)
    let ok = 0
    for (const it of items) {
      for (const gid of picked) {
        try { await addToWatchlist({ seed: it, groupId: gid, addedBy: userId }); ok++ } catch {}
      }
    }
    toast(`Added to ${picked.length} list${picked.length > 1 ? 's' : ''} (${ok} entries)`)
    onDone()
  }
  return (
    <div className="container selbar-panel">
      <div className="faint" style={{ marginBottom: 8 }}>Add the {items.length} selected titles to these lists/groups:</div>
      <div className="scroll-x" style={{ flexWrap: 'wrap', display: 'flex', marginBottom: 10 }}>
        {groups.map((g) => {
          const on = picked.includes(g.id)
          return (
            <button key={g.id} className={`chip ${on ? 'active' : ''}`}
              style={on ? { background: g.color, borderColor: g.color, color: '#0b0d12' } : undefined}
              onClick={() => setPicked((p) => on ? p.filter((x) => x !== g.id) : [...p, g.id])}>{g.name}</button>
          )
        })}
      </div>
      <button className="btn primary block" disabled={busy || !picked.length} onClick={go}>
        {busy ? 'Adding…' : `Add to ${picked.length || 0} list(s)`}
      </button>
    </div>
  )
}

function BulkWatch({ groups, items, userId, onDone, toast }) {
  const today = new Date().toISOString().slice(0, 10)
  const [groupId, setGroupId] = useState(groups[0]?.id || '')
  const [visibility, setVisibility] = useState('private')
  const [busy, setBusy] = useState(false)
  async function go() {
    if (!groupId) return
    setBusy(true)
    let ok = 0
    for (const it of items) {
      try {
        await markWatched({ seed: it, groupId, watchedOn: today, datePrecision: 'day', createdBy: userId, visibility })
        ok++
      } catch {}
    }
    toast(`Logged ${ok} watch${ok === 1 ? '' : 'es'}`)
    onDone()
  }
  return (
    <div className="container selbar-panel">
      <div className="faint" style={{ marginBottom: 8 }}>Log {items.length} watches (today) for:</div>
      <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
        <select value={groupId} onChange={(e) => setGroupId(e.target.value)} style={{ flex: '1 1 160px' }}>
          {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
        </select>
        <select value={visibility} onChange={(e) => setVisibility(e.target.value)} style={{ flex: '1 1 140px' }}>
          <option value="private">Private</option>
          <option value="friends">Friends</option>
          <option value="public">Public</option>
        </select>
        <button className="btn primary" disabled={busy || !groupId} onClick={go}>{busy ? 'Saving…' : 'Log them'}</button>
      </div>
    </div>
  )
}
