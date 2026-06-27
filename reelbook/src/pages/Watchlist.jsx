import { useCallback, useEffect, useState } from 'react'
import { listWatchlist, removeFromWatchlist } from '../lib/db'
import { useAppData } from '../context/AppData'
import { Poster, Spinner, Empty, GroupChips, TitleLink } from '../components/ui'
import MarkWatchedModal from '../components/MarkWatchedModal'

export default function Watchlist() {
  const { groups, profiles } = useAppData()
  const [groupId, setGroupId] = useState(null)
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [watchItem, setWatchItem] = useState(null)

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

  return (
    <div className="page">
      <h1>Watchlist</h1>
      <GroupChips groups={groups} value={groupId} onChange={setGroupId} />

      {loading ? <Spinner /> : items.length === 0 ? (
        <Empty>Nothing here yet. Add titles from <strong>Discover</strong>.</Empty>
      ) : (
        <div className="grid">
          {items.map((it) => {
            const t = it.titles
            return (
              <div key={it.id}>
                <TitleLink className="tile" tmdbId={t?.tmdb_id} media={t?.media_type}>
                  <Poster title={t?.title} mediaType={t?.media_type} posterPath={t?.poster_path} />
                  <div className="tile-title">{t?.title}</div>
                  <div className="tile-sub">
                    {t?.year || '—'}
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
