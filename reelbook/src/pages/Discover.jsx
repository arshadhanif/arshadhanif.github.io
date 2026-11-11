import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { searchAll, getTrending, getPopular, getTopRated, getTvStatus, getAnime, listWatchProviders, discoverByProviders, IMG } from '../lib/tmdb'
import { listInProgressShows, setTitleTotalEpisodes, listSubscriptions, dropShow, listDroppedShows, restoreShow, setShowHome, getLibraryTmdbIds, listOngoingShows,
} from '../lib/db'
import { regionFromSubs, matchProviderIds } from '../lib/providers'
import { fmtDate } from '../lib/dates'
import { Poster, Empty, SkeletonGrid, TitleLink, ScrollRow, Modal } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'

export default function Discover() {
  const { user } = useAuth()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [type, setType] = useState('all') // all | movie | tv
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  const [rails, setRails] = useState({})
  const [continueShows, setContinueShows] = useState([])
  const [droppedShows, setDroppedShows] = useState([])
  const [ongoingShows, setOngoingShows] = useState([])
  const [onServices, setOnServices] = useState(null) // { items, services } | null
  const debounce = useRef()

  useEffect(() => {
    Promise.allSettled([
      getTrending(), getPopular('movie'), getPopular('tv'), getTopRated('movie'), getAnime('tv'), getAnime('movie'),
    ]).then(([tr, pm, ptv, trm, an, anm]) => {
      setRails({
        trending: val(tr), popMovies: val(pm), popTv: val(ptv), topMovies: val(trm), anime: val(an), animeMovies: val(anm),
      })
    })
    listInProgressShows().then(async (shows) => {
      setContinueShows(shows)
      // Refresh AIRED episode counts (TMDB's total counts unaired episodes) so
      // shows you're caught up on drop off. Gated to once every 6h. Only the most
      // recent shows are checked (the rail is a scroller, and hitting TMDB for
      // every tracked show at once gets rate-limited). Crucially, a failed check
      // KEEPS the show as-is instead of dropping it from the rail.
      const KEY = 'reelbook.epRefresh'
      if (Date.now() - Number(localStorage.getItem(KEY) || 0) < 6 * 3600 * 1000) return
      // Prioritise shows with an UNKNOWN total: without it they can never be
      // marked caught up and cling to the rail forever. Then the most-recent
      // shows (to catch newly-aired episodes). Dedupe by tmdb id, cap the work,
      // and run in small batches so TMDB doesn't rate-limit. A failed check
      // keeps the show as-is rather than dropping it.
      const totals = {}
      const seenTmdb = new Set()
      const work = []
      for (const s of [...shows.filter((s) => !s.total), ...shows.filter((s) => s.total)]) {
        if (!seenTmdb.has(s.title.tmdb_id)) { seenTmdb.add(s.title.tmdb_id); work.push(s) }
      }
      const capped = work.slice(0, 120)
      for (let i = 0; i < capped.length; i += 8) {
        await Promise.all(capped.slice(i, i + 8).map(async (s) => {
          try {
            const st = await getTvStatus(s.title.tmdb_id)
            const aired = st.aired_episodes ?? st.number_of_episodes
            if (aired) { totals[s.title.tmdb_id] = aired; if (aired !== s.total) await setTitleTotalEpisodes(s.title.id, aired).catch(() => {}) }
          } catch { /* keep the show as-is on failure */ }
        }))
      }
      try { localStorage.setItem(KEY, String(Date.now())) } catch {}
      const merged = shows.map((s) => (totals[s.title.tmdb_id] ? { ...s, total: totals[s.title.tmdb_id] } : s))
      setContinueShows(merged.filter((s) => !s.total || s.watched < s.total))
    }).catch(() => {})

    listDroppedShows().then(setDroppedShows).catch(() => {})
    listOngoingShows().then(setOngoingShows).catch(() => {})

    // "On your services": what's popular on the streaming services you pay for.
    listSubscriptions().then(async (subs) => {
      const names = subs.filter((s) => s.active).map((s) => s.name).filter(Boolean)
      if (!names.length) return
      const region = regionFromSubs(subs)
      const [provMovie, provTv] = await Promise.all([
        listWatchProviders('movie', region).catch(() => []),
        listWatchProviders('tv', region).catch(() => []),
      ])
      const movieIds = matchProviderIds(names, provMovie)
      const tvIds = matchProviderIds(names, provTv)
      if (!movieIds.length && !tvIds.length) return
      const [m, t] = await Promise.all([
        discoverByProviders('movie', movieIds, region).catch(() => []),
        discoverByProviders('tv', tvIds, region).catch(() => []),
      ])
      const items = interleave(m, t).slice(0, 40)
      if (items.length) setOnServices({ items })
    }).catch(() => {})
  }, [])

  useEffect(() => {
    clearTimeout(debounce.current)
    if (!q.trim()) { setResults([]); setErr(null); setLoading(false); return }
    setLoading(true)
    debounce.current = setTimeout(async () => {
      setErr(null)
      try { setResults(await searchAll(q)) }
      catch (e) { setErr(e.message) }
      finally { setLoading(false) }
    }, 350)
    return () => clearTimeout(debounce.current)
  }, [q])

  async function dropContinue(s) {
    const name = s.title?.title || 'this show'
    if (!confirm(`Stop tracking "${name}"${s.group ? ` (${s.group.name})` : ''}? It moves to the "Stopped tracking" list below (your history is kept). You can Resume it there any time, or just mark a new episode.`)) return
    setContinueShows((xs) => xs.filter((x) => !(x.title.id === s.title.id && x.groupId === s.groupId)))
    setDroppedShows((xs) => [{ ...s }, ...xs.filter((x) => !(x.title.id === s.title.id && x.groupId === s.groupId))])
    try { await dropShow(s.title.id, s.groupId, user.id); toast('Moved to Stopped tracking.') }
    catch (e) { toast(e.message || 'Could not update', 'err') }
  }

  // Move a show to another list you already watch it in. Sets that list as the
  // show's "home" so it appears there and stops showing under the old one. No
  // episodes move, so neither list's counts change. Optimistic, reversible.
  async function moveShow(s, toGroupId) {
    const alts = [
      { group_id: s.groupId, name: s.group?.name, color: s.group?.color, watched: s.watched },
      ...(s.altGroups || []),
    ]
    const chosen = alts.find((a) => a.group_id === toGroupId)
    if (!chosen || toGroupId === s.groupId) return
    setContinueShows((xs) => xs.map((x) => {
      if (x.title.id !== s.title.id) return x
      const pool = [
        { group_id: x.groupId, name: x.group?.name, color: x.group?.color, watched: x.watched },
        ...(x.altGroups || []),
      ]
      const pick = pool.find((a) => a.group_id === toGroupId)
      if (!pick) return x
      return {
        ...x,
        group: { id: pick.group_id, name: pick.name, color: pick.color },
        groupId: pick.group_id,
        watched: pick.watched,
        altGroups: pool.filter((a) => a.group_id !== toGroupId),
      }
    }))
    try { await setShowHome(s.title.id, toGroupId, user.id); toast(`Now under ${chosen.name}.`) }
    catch (e) {
      toast(e.message || 'Could not move show', 'err')
      listInProgressShows().then(setContinueShows).catch(() => {})
    }
  }

  async function resumeDropped(s) {
    setDroppedShows((xs) => xs.filter((x) => !(x.title.id === s.title.id && x.groupId === s.groupId)))
    if (!s.total || s.watched < s.total) setContinueShows((xs) => [{ ...s }, ...xs])
    try { await restoreShow(s.title.id, s.groupId); toast('Back in Continue watching.') }
    catch (e) { toast(e.message || 'Could not update', 'err') }
  }

  // Which of these you've already logged. Nothing in search used to say, so
  // there was no way to tell a film you watched years ago from one you never
  // got round to, short of opening its page one by one.
  const [lib, setLib] = useState({ watched: new Set(), watchlist: new Set() })
  // Suggestion rails hide what the household has already watched. On by
  // default; the toggle sticks so it doesn't need re-setting every visit.
  const [hideSeen, setHideSeen] = useState(() => {
    try { return localStorage.getItem('reelbook.hideSeenRails') !== '0' } catch { return true }
  })
  const hideSet = hideSeen ? lib.watched : null
  useEffect(() => {
    let alive = true
    getLibraryTmdbIds().then((x) => alive && setLib(x)).catch((e) => console.error('library ids', e))
    return () => { alive = false }
  }, [])

  const searching = !!q.trim()
  const titleResults = results.filter((r) => r.kind !== 'person')
  const peopleResults = results.filter((r) => r.kind === 'person')
  const filtered = type === 'all' ? titleResults : titleResults.filter((r) => r.media_type === type)
  // People used to be rendered above the titles whatever they were. Searching
  // "Wall-E" then opened with a row of ten strangers surnamed Wall. Put them
  // first only when a person actually matches the query better than any title.
  const bestRank = (xs) => xs.reduce((m, r) => Math.max(m, r.rank || 0), 0)
  const peopleFirst = bestRank(peopleResults) > bestRank(filtered)

  // Split Continue watching by recency: shows you've touched in the last 3
  // months stay on the main rail; anything dormant (last watched 3+ months ago)
  // drops into its own auto-refreshing section, and returns to the main rail the
  // moment you watch an episode again. "Stopped tracking" stays a manual choice.
  const staleCutoff = (() => { const d = new Date(); d.setMonth(d.getMonth() - 3); return d.toISOString().slice(0, 10) })()
  const activeShows = continueShows.filter((s) => !s.last || s.last >= staleCutoff)
  const dormantShows = continueShows.filter((s) => s.last && s.last < staleCutoff)

  const peopleRail = (
              <div style={{ marginBottom: 22 }}>
                <div className="section-head"><h2>People</h2></div>
                <ScrollRow className="rail">
                  {peopleResults.map((p) => (
                    <Link className="rail-item tile" key={`person-${p.id}`} to={`/person/${p.id}`}>
                      <div className="poster" style={{ borderRadius: '50%', overflow: 'hidden' }}>
                        {IMG.profile(p.profile_path, 'w185')
                          ? <img src={IMG.profile(p.profile_path, 'w185')} alt={p.name} loading="lazy" />
                          : <div className="ph">{p.name?.[0]}</div>}
                      </div>
                      <div className="tile-title">{p.name}</div>
                      <div className="tile-sub">{p.department || 'Person'}</div>
                    </Link>
                  ))}
                </ScrollRow>
              </div>
              )

  return (
    <div className="page">
      <div className="page-head">
        <h1>Discover</h1>
        <Link className="btn sm" to="/browse">🧭 Advanced filters</Link>
      </div>
      <input
        placeholder="Search movies, TV & people…"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        style={{ marginBottom: 14 }}
      />

      {searching && (
        <div className="seg" style={{ marginBottom: 16 }}>
          {['all', 'movie', 'tv'].map((t) => (
            <button key={t} className={type === t ? 'on' : ''} onClick={() => setType(t)}>
              {t === 'all' ? 'All' : t === 'movie' ? 'Movies' : 'TV'}
            </button>
          ))}
        </div>
      )}

      {err && <div className="banner error">{err}</div>}

      {searching ? (
        loading ? <SkeletonGrid count={12} /> : filtered.length === 0 && peopleResults.length === 0 && !err ? (
          <Empty icon="🔍">No {type !== 'all' ? (type === 'tv' ? 'TV' : 'movie') + ' ' : ''}results for “{q}”.</Empty>
        ) : (
          <>
            {type === 'all' && peopleResults.length > 0 && peopleFirst && peopleRail}
            <div className="grid">
              {filtered.map((r) => (
                <TitleLink className="tile" key={`${r.media_type}-${r.tmdb_id}`} tmdbId={r.tmdb_id} media={r.media_type}>
                  <div style={{ position: 'relative' }}>
                    <Poster title={r.title} mediaType={r.media_type} posterPath={r.poster_path} />
                    {lib.watched.has(r.tmdb_id)
                      ? <span className="ep-badge" style={{ background: 'var(--green)', color: '#0b0d12' }} title="You've logged this as watched">✓</span>
                      : lib.watchlist.has(r.tmdb_id)
                        ? <span className="ep-badge" title="On your watchlist">🔖</span>
                        : null}
                  </div>
                  <div className="tile-title">{r.title}</div>
                  <div className="tile-sub">{r.year || 'N/A'} · {r.media_type === 'tv' ? 'TV' : 'Movie'}</div>
                </TitleLink>
              ))}
            </div>
            {type === 'all' && peopleResults.length > 0 && !peopleFirst && peopleRail}
          </>
        )
      ) : (
        <>
          {activeShows.length > 0 && (
            <ContinueRail shows={activeShows} onDrop={dropContinue} onMove={moveShow} />
          )}
          {dormantShows.length > 0 && (
            <ContinueRail shows={dormantShows} onDrop={dropContinue} onMove={moveShow}
              heading="💤 Not watched in 3+ months" collapsible defaultOpen={false} />
          )}
          {ongoingShows.length > 0 && <OngoingList shows={ongoingShows} />}
          {droppedShows.length > 0 && (
            <StoppedList shows={droppedShows} onResume={resumeDropped} />
          )}
          <label className="row" style={{ gap: 8, cursor: 'pointer', marginBottom: 16 }}>
            <input type="checkbox" style={{ width: 18, height: 18 }} checked={hideSeen}
              onChange={(e) => {
                setHideSeen(e.target.checked)
                try { localStorage.setItem('reelbook.hideSeenRails', e.target.checked ? '1' : '0') } catch {}
              }} />
            <span className="faint">Hide what we've already watched</span>
          </label>
          {onServices && <Rail title="📺 On your services" items={onServices.items} hide={hideSet} />}
          <Rail title="🔥 Trending this week" items={rails.trending} hide={hideSet} />
          <Rail title="Popular movies" items={rails.popMovies} hide={hideSet} />
          <Rail title="Popular TV" items={rails.popTv} hide={hideSet} />
          <Rail title="🍙 Popular anime" items={rails.anime} hide={hideSet} />
          <Rail title="Top rated movies" items={rails.topMovies} hide={hideSet} />
          <Rail title="🎴 Anime movies" items={rails.animeMovies} hide={hideSet} />
          {!rails.trending && <SkeletonGrid count={6} />}
        </>
      )}
    </div>
  )
}

function val(settled) { return settled.status === 'fulfilled' ? settled.value : [] }

// Alternate two lists (movies/TV) and drop duplicates.
function interleave(a, b) {
  const out = [], seen = new Set()
  const push = (r) => { const k = `${r.media_type}-${r.tmdb_id}`; if (!seen.has(k)) { seen.add(k); out.push(r) } }
  for (let i = 0; i < Math.max(a.length, b.length); i++) { if (a[i]) push(a[i]); if (b[i]) push(b[i]) }
  return out
}

function Rail({ title, items, hide }) {
  // These rails exist to suggest something new, so anything already in the
  // diary is noise. Filtered here rather than at fetch time so flipping the
  // toggle is instant and costs no extra TMDB calls.
  if (hide) items = (items || []).filter((r) => !hide.has(r.tmdb_id))
  if (!items || items.length === 0) return null
  return (
    <div style={{ marginBottom: 26 }}>
      <div className="section-head"><h2>{title}</h2></div>
      <ScrollRow className="rail">
        {items.map((r) => (
          <TitleLink className="rail-item tile" key={`${r.media_type}-${r.tmdb_id}`} tmdbId={r.tmdb_id} media={r.media_type}>
            <Poster title={r.title} mediaType={r.media_type} posterPath={r.poster_path} />
            <div className="tile-title">{r.title}</div>
            <div className="tile-sub">{r.year || 'N/A'}</div>
          </TitleLink>
        ))}
      </ScrollRow>
    </div>
  )
}

// Shows you've stopped tracking. Collapsed by default so it stays out of the
// way, with a one-tap Resume that drops each back into Continue watching.
function OngoingList({ shows }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 26 }}>
      <button className="stopped-head" onClick={() => setOpen((v) => !v)}>
        <span>🔁 Ongoing ({shows.length})</span>
        <span className="chev">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <>
          <div className="faint" style={{ fontSize: 12, margin: '8px 0 10px' }}>
            Shows you dip in and out of. No backlog is counted for these and they never
            notify you. Turn it off from a show's page to put it back in Continue watching.
          </div>
          <ScrollRow className="rail">
            {shows.map((s) => (
              <div className="rail-item tile" key={s.title.id}>
                <TitleLink tmdbId={s.title.tmdb_id} media="tv" style={{ display: 'block' }}>
                  <Poster title={s.title.title} mediaType="tv" posterPath={s.title.poster_path} />
                  <div className="tile-title">{s.title.title}</div>
                  <div className="tile-sub">
                    {s.watched} watched{s.last ? ` · last ${fmtDate(s.last)}` : ''}
                  </div>
                </TitleLink>
              </div>
            ))}
          </ScrollRow>
        </>
      )}
    </div>
  )
}

function StoppedList({ shows, onResume }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ marginBottom: 26 }}>
      <button className="stopped-head" onClick={() => setOpen((v) => !v)}>
        <span>⏸ Stopped tracking ({shows.length})</span>
        <span className="chev">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <ScrollRow className="rail">
          {shows.map((s) => {
            const { title, watched, total, group, groupId } = s
            return (
              <div className="rail-item tile" key={`${title.id}-${groupId}`}>
                <TitleLink tmdbId={title.tmdb_id} media={title.media_type} style={{ display: 'block', opacity: 0.72 }}>
                  <Poster title={title.title} mediaType="tv" posterPath={title.poster_path} />
                  <div className="tile-title">{title.title}</div>
                  <div className="tile-sub">
                    {watched}{total ? `/${total}` : ''} eps
                    {group && <> · <span style={{ color: group.color }}>{group.name}</span></>}
                  </div>
                </TitleLink>
                <button className="btn sm" style={{ width: '100%', marginTop: 6 }}
                  onClick={() => onResume(s)}>↩ Resume</button>
              </div>
            )
          })}
        </ScrollRow>
      )}
    </div>
  )
}

function ContinueRail({ shows, onDrop, onMove, heading = '▶ Continue watching', collapsible = false, defaultOpen = true }) {
  const [gid, setGid] = useState(null)
  const [picker, setPicker] = useState(null) // the show whose "watching with" sheet is open
  const [open, setOpen] = useState(defaultOpen)
  // Distinct groups present, so we only show the filter when it's useful.
  const groupsPresent = []
  const seen = new Set()
  for (const s of shows) if (s.group && !seen.has(s.group.id)) { seen.add(s.group.id); groupsPresent.push(s.group) }
  const view = gid ? shows.filter((s) => s.groupId === gid) : shows
  return (
    <div style={{ marginBottom: 26 }}>
      {collapsible ? (
        <button className="stopped-head" onClick={() => setOpen((v) => !v)}>
          <span>{heading} ({shows.length})</span>
          <span className="chev">{open ? '▲' : '▼'}</span>
        </button>
      ) : (
        <div className="section-head"><h2>{heading}</h2></div>
      )}
      {open && (<>
      {groupsPresent.length > 1 && (
        <div className="scroll-x" style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
          <button className={`chip ${!gid ? 'active' : ''}`}
            style={!gid ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: '#0b0d12' } : undefined}
            onClick={() => setGid(null)}>All</button>
          {groupsPresent.map((g) => (
            <button key={g.id} className={`chip ${gid === g.id ? 'active' : ''}`}
              style={gid === g.id ? { background: g.color, borderColor: g.color, color: '#0b0d12' } : undefined}
              onClick={() => setGid(g.id)}>{g.name}</button>
          ))}
        </div>
      )}
      <ScrollRow className="rail">
        {view.map((s) => {
          const { title, watched, total, group, groupId } = s
          const pct = total ? Math.round((watched / total) * 100) : 0
          const toGo = total ? total - watched : 0
          const canMove = onMove && group && (s.altGroups?.length > 0)
          return (
            <TitleLink className="rail-item tile" key={`${title.id}-${groupId}`} tmdbId={title.tmdb_id} media={title.media_type}>
              <div style={{ position: 'relative' }}>
                <Poster title={title.title} mediaType="tv" posterPath={title.poster_path} />
                {toGo > 0 && <span className="ep-badge">{toGo} to go</span>}
                {onDrop && (
                  <button className="continue-drop" title="Stop tracking this show"
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); onDrop(s) }}>✕</button>
                )}
              </div>
              <div className="progress-track"><div className="progress-fill" style={{ width: `${pct}%` }} /></div>
              <div className="tile-title">{title.title}</div>
              <div className="tile-sub">
                {watched}{total ? `/${total}` : ''} eps
                {group && !canMove && <> · <span style={{ color: group.color }}>{group.name}</span></>}
              </div>
              {canMove && (
                <button className="ww-pill" title="Which list are you watching this with?"
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setPicker(s) }}>
                  <span className="ww-dot" style={{ background: group.color }} />
                  <span style={{ color: group.color }}>{group.name}</span>
                  <span className="ww-caret">▾</span>
                </button>
              )}
            </TitleLink>
          )
        })}
      </ScrollRow>
      </>)}
      {picker && (
        <WatchingWithSheet
          show={picker}
          onPick={(toId) => { onMove(picker, toId); setPicker(null) }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>
  )
}

// Bottom-sheet picker: choose which list a show belongs to. Options are the
// lists you've already logged episodes in (moving to a list you've never
// watched it in would show nothing, so those aren't offered). Picking a list
// pins it as the show's home; no episodes move between lists.
function WatchingWithSheet({ show, onPick, onClose }) {
  const options = [
    { group_id: show.groupId, name: show.group?.name, color: show.group?.color, watched: show.watched, current: true },
    ...(show.altGroups || []).map((a) => ({ ...a, current: false })),
  ]
  return (
    <Modal title="Watching this with…" onClose={onClose}>
      <div className="tile-sub" style={{ marginTop: -6, marginBottom: 12 }}>{show.title?.title}</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {options.map((o) => (
          <button key={o.group_id} className="ww-opt" disabled={o.current}
            onClick={() => !o.current && onPick(o.group_id)}>
            <span className="ww-dot" style={{ background: o.color }} />
            <span className="ww-opt-name" style={{ color: o.color }}>{o.name}</span>
            <span className="ww-opt-meta">
              {o.watched}{show.total ? `/${show.total}` : ''} eps{o.current ? ' · current' : ''}
            </span>
          </button>
        ))}
      </div>
    </Modal>
  )
}
