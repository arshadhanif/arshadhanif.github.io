import { useCallback, useEffect, useState } from 'react'
import { listWatchlist, removeFromWatchlist } from '../lib/db'
import { useAppData } from '../context/AppData'
import { Poster, Spinner, Empty, GroupChips, TitleLink } from '../components/ui'
import MarkWatchedModal from '../components/MarkWatchedModal'
import Roulette from '../components/Roulette'

export default function Watchlist() {
  const { groups, profiles } = useAppData()
  const [groupId, setGroupId] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [watchItem, setWatchItem] = useState(null)
  const [typeF, setTypeF] = useState('all')
  const [sort, setSort] = useState('recent')
  const [q, setQ] = useState('')
  const [roulette, setRoulette] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try { setItems(await listWatchlist(groupId)) }
    finally { setLoading(false) }
  }, [groupId])

  useEffect(() => { load() }, [load])

  async function remove(id) {
    await removeFromWatchlist(id)
    setItems((xs) => xs.filter((x) => x.id !== id))
  }

  const view = items
    .filter((it) => typeF === 'all' || it.titles?.media_type === typeF)
    .filter((it) => !q.trim() || (it.titles?.title || '').toLowerCase().includes(q.trim().toLowerCase()))
    .sort((a, b) => {
      if (sort === 'title') return (a.titles?.title || '').localeCompare(b.titles?.title || '')
      if (sort === 'year') return (b.titles?.year || 0) - (a.titles?.year || 0)
      return (b.created_at || '').localeCompare(a.created_at || '')
    })

  return (
    <div className="page">
      <div className="page-head">
        <h1>Watchlist</h1>
        <button className="btn sm primary" onClick={() => setRoulette(true)}>🎲 Surprise me</button>
      </div>
      <GroupChips groups={groups} value={groupId} onChange={setGroupId} />
      <div className="row" style={{ gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
        <input placeholder="Search title…" value={q} onChange={(e) => setQ(e.target.value)} style={{ flex: '1 1 160px' }} />
        <div className="seg">
          {[['all', 'All'], ['movie', 'Movies'], ['tv', 'TV']].map(([v, l]) => (
            <button key={v} className={typeF === v ? 'on' : ''} onClick={() => setTypeF(v)}>{l}</button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={{ width: 'auto' }}>
          <option value="recent">Recently added</option>
          <option value="title">Title A-Z</option>
          <option value="year">Year (newest)</option>
        </select>
      </div>

      {loading ? <Spinner /> : items.length === 0 ? (
        <Empty>Nothing here yet. Add titles from <strong>Discover</strong>.</Empty>
      ) : view.length === 0 ? (
        <Empty icon="🔎">No items match these filters.</Empty>
      ) : (
        <div className="grid">
          {view.map((it) => {
            const t = it.titles
            return (
              <div key={it.id}>
                <TitleLink className="tile" tmdbId={t?.tmdb_id} media={t?.media_type}>
                  <Poster title={t?.title} mediaType={t?.media_type} posterPath={t?.poster_path} />
                  <div className="tile-title">{t?.title}</div>
                  <div className="tile-sub">
                    {t?.year || 'N/A'}
                    {it.groups && <> · <span style={{ color: it.groups.color }}>{it.groups.name}</span></>}
                  </div>
                </TitleLink>
                <div className="row" style={{ marginTop: 6, gap: 6 }}>
                  <button className="btn sm primary" style={{ flex: 1 }}
                    onClick={() => setWatchItem({
                      titleId: t.id, title: t.title, media_type: t.media_type,
                      total_episodes: t.total_episodes, _watchlistId: it.id,
                    })}>
                    ✓ Watched
                  </button>
                  <button className="btn sm" onClick={() => remove(it.id)} title="Remove">✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {roulette && (
        <Roulette
          pool={view}
          onClose={() => setRoulette(false)}
          onWatched={(it) => { setRoulette(false); setWatchItem({ titleId: it.titles.id, title: it.titles.title, media_type: it.titles.media_type, total_episodes: it.titles.total_episodes, _watchlistId: it.id }) }}
        />
      )}

      {watchItem && (
        <MarkWatchedModal
          item={watchItem}
          groups={groups}
          profiles={profiles}
          onClose={() => setWatchItem(null)}
          onSaved={async () => {
            // Once watched, drop it from the watchlist.
            if (watchItem._watchlistId) await removeFromWatchlist(watchItem._watchlistId)
            load()
          }}
        />
      )}
    </div>
  )
}
