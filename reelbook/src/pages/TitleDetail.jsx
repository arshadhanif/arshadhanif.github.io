import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getFullDetail, getSeason, getRecommendations, getEpisodeExternalIds, IMG, providerRegions } from '../lib/tmdb'
import {
  ensureTitleFromFull, getWatchesForTitle, addToWatchlist,
  listEpisodeWatches, markEpisode, unmarkEpisode, markSeason, markEpisodesBulk, unmarkAllEpisodes, setEpisodeRating,
  getTitleServices, setTitleServices, getStreamingAvailability,
  getImdbRating, getImdbSeasonRatings, getSeasonRatings, setSeasonRating,
} from '../lib/db'
import { useAppData } from '../context/AppData'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/Toast'
import { Poster, Spinner, DualScore, Modal, TitleLink, StarRating } from '../components/ui'
import MarkWatchedModal from '../components/MarkWatchedModal'
import AddToCollectionModal from '../components/AddToCollectionModal'
import { getPref, DEFAULT_REGION } from '../lib/prefs'
import { formatWatched, fmtDate, todayLocal } from '../lib/dates'

export default function TitleDetail() {
  const { media, id } = useParams()
  const navigate = useNavigate()
  const { groups, profiles } = useAppData()
  const { user } = useAuth()
  const toast = useToast()

  const [full, setFull] = useState(null)
  const [titleId, setTitleId] = useState(null)
  const [watches, setWatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [watchModal, setWatchModal] = useState(false)
  const [listModal, setListModal] = useState(false)
  const preferred = getPref('region', DEFAULT_REGION)
  const [region, setRegion] = useState(preferred)
  const [recs, setRecs] = useState([])
  const [showTrailer, setShowTrailer] = useState(false)
  const [imdb, setImdb] = useState(null)

  const loadWatches = useCallback(async (tid) => {
    try { setWatches(await getWatchesForTitle(tid)) } catch (e) { console.warn(e) }
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true); setErr(null); setImdb(null)
    getFullDetail(Number(id), media)
      .then(async (f) => {
        if (!alive) return
        setFull(f)
        if (f.imdb_id) getImdbRating(f.imdb_id).then((r) => alive && setImdb(r)).catch(() => {})
        const regions = providerRegions(f.providers)
        setRegion(regions.includes(preferred) ? preferred : regions.includes('US') ? 'US' : regions[0] || preferred)
        try {
          const tid = await ensureTitleFromFull(f)
          if (!alive) return
          setTitleId(tid)
          loadWatches(tid)
        } catch (e) { console.warn('cache title', e) }
      })
      .catch((e) => alive && setErr(e.message))
      .finally(() => alive && setLoading(false))
    getRecommendations(Number(id), media).then((r) => alive && setRecs(r)).catch(() => {})
    return () => { alive = false }
  }, [id, media, loadWatches])

  if (loading) return <div className="page"><Spinner label="Loading title…" /></div>
  if (err) return <div className="page"><div className="banner error">{err}</div><button className="btn" onClick={() => navigate(-1)}>← Back</button></div>
  if (!full) return null

  const isTv = media === 'tv'
  const backdrop = IMG.backdrop(full.backdrop_path)

  return (
    <div className="detail">
      {/* hero */}
      <div className="detail-hero">
        {backdrop && <div className="detail-backdrop" style={{ backgroundImage: `url(${backdrop})` }} />}
        <div className="detail-hero-grad" />
        <button className="btn sm detail-back" onClick={() => navigate(-1)}>← Back</button>
        <div className="container detail-hero-inner">
          <div className="detail-poster">
            <Poster title={full.title} mediaType={full.media_type} posterPath={full.poster_path} />
          </div>
          <div className="detail-headline">
            <h1>{full.title}</h1>
            {full.tagline && <p className="detail-tagline">“{full.tagline}”</p>}
            <div className="detail-meta">
              {full.year && <span>{full.year}</span>}
              <span>{isTv ? 'TV Series' : 'Movie'}</span>
              {full.runtime ? <span>{full.runtime} min{isTv ? '/ep' : ''}</span> : null}
              {isTv && full.number_of_seasons ? <span>{full.number_of_seasons} season{full.number_of_seasons > 1 ? 's' : ''}</span> : null}
              {full.total_episodes ? <span>{full.total_episodes} episodes</span> : null}
              {imdb?.rating ? <span className="imdb-rating">★ {imdb.rating} IMDb</span> : null}
              {full.vote_average ? <span className="tmdb-rating">★ {full.vote_average} TMDB</span> : null}
            </div>
            <div className="scroll-x" style={{ margin: '4px 0 14px' }}>
              {full.genres.map((g) => <span className="chip" key={g}>{g}</span>)}
            </div>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <button className="btn primary" onClick={() => setWatchModal(true)}>✓ Mark watched</button>
              <AddWatchlist titleId={titleId} groups={groups} userId={user.id} />
              <button className="btn" onClick={() => setListModal(true)}>📚 Add to list</button>
              {full.trailer_key && (
                <button className="btn" onClick={() => setShowTrailer(true)}>▶ Trailer</button>
              )}
              {full.imdb_id && (
                <a className="btn" href={`https://www.imdb.com/title/${full.imdb_id}`} target="_blank" rel="noreferrer">
                  IMDb ↗
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container detail-body">
        {full.overview && (
          <Block title="Overview"><p className="muted" style={{ lineHeight: 1.6, marginTop: 0 }}>{full.overview}</p></Block>
        )}

        {full.crew.length > 0 && (
          <Block title={isTv ? 'Created by' : 'Director'}>
            <div className="muted">
              {full.crew.map((c, i) => (
                <span key={`${c.id}-${i}`}>
                  {i > 0 && ', '}
                  {c.id ? <span className="linklike" onClick={() => navigate(`/person/${c.id}`)}>{c.name}</span> : c.name}
                </span>
              ))}
            </div>
          </Block>
        )}

        <WhereToWatch providers={full.providers} region={region} setRegion={setRegion} title={full.title}
          titleId={titleId} tmdbId={Number(id)} mediaType={media} imdbId={full.imdb_id} userId={user.id} />

        {full.cast.length > 0 && (
          <Block title="Cast">
            <div className="scroll-x cast-row">
              {full.cast.map((c) => (
                <div className="cast" key={c.id} onClick={() => navigate(`/person/${c.id}`)} style={{ cursor: 'pointer' }}>
                  <div className="cast-photo">
                    {IMG.profile(c.profile_path)
                      ? <img src={IMG.profile(c.profile_path)} alt={c.name} loading="lazy" />
                      : <div className="cast-ph">{c.name?.[0]}</div>}
                  </div>
                  <div className="cast-name">{c.name}</div>
                  {c.character && <div className="cast-char">{c.character}</div>}
                </div>
              ))}
            </div>
          </Block>
        )}

        {isTv && titleId && (
          <Episodes tmdbId={Number(id)} titleId={titleId} seasons={full.seasons} groups={groups} profiles={profiles} userId={user.id} imdbId={full.imdb_id} />
        )}

        {recs.length > 0 && (
          <Block title="More like this">
            <div className="scroll-x rail">
              {recs.map((r) => (
                <TitleLink className="rail-item tile" key={`${r.media_type}-${r.tmdb_id}`} tmdbId={r.tmdb_id} media={r.media_type}>
                  <Poster title={r.title} mediaType={r.media_type} posterPath={r.poster_path} />
                  <div className="tile-title">{r.title}</div>
                  <div className="tile-sub">{r.year || 'N/A'}</div>
                </TitleLink>
              ))}
            </div>
          </Block>
        )}

        {watches.length > 0 && (
          <Block title="Your history">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {watches.map((w) => (
                <div className="card spread" key={w.id}>
                  <div style={{ minWidth: 0 }}>
                    <div className="faint">{formatWatched(w.watched_on, w.date_precision)}{w.groups && <> · <span style={{ color: w.groups.color }}>{w.groups.name}</span></>}{w.service && <> · 📺 {w.service}</>}{w.where_watched && <> · {w.where_watched}</>}{(w.is_rewatch || w.rewatch_count > 0) && <span className="rewatch-badge">↻ {w.rewatch_count > 0 ? `×${w.rewatch_count + 1}` : 'Rewatch'}</span>}</div>
                    {w.note && <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>“{w.note}”</div>}
                    {(w.tags || []).length > 0 && (
                      <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 6 }}>
                        {w.tags.map((tg) => <span key={tg} className="chip">#{tg}</span>)}
                      </div>
                    )}
                  </div>
                  <DualScore profiles={profiles} ratings={w.ratings} />
                </div>
              ))}
            </div>
          </Block>
        )}

        <p className="faint" style={{ marginTop: 30, textAlign: 'center' }}>
          This product uses the TMDB API but is not endorsed or certified by TMDB.
        </p>
      </div>

      {showTrailer && full.trailer_key && (
        <Modal title={`${full.title}: Trailer`} onClose={() => setShowTrailer(false)}>
          <div className="trailer-frame">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${full.trailer_key}?autoplay=1`}
              title="Trailer" allow="autoplay; encrypted-media; fullscreen" allowFullScreen
            />
          </div>
        </Modal>
      )}

      {watchModal && (
        <MarkWatchedModal
          item={{ titleId, title: full.title, media_type: full.media_type, total_episodes: full.total_episodes, rewatchSuggested: watches.length > 0 }}
          groups={groups}
          profiles={profiles}
          onClose={() => setWatchModal(false)}
          onSaved={() => { loadWatches(titleId); toast('Saved to your diary') }}
        />
      )}

      {listModal && (
        <AddToCollectionModal item={{ titleId, title: full.title }} onClose={() => setListModal(false)} />
      )}
    </div>
  )
}

function Block({ title, children }) {
  return (
    <div className="detail-block">
      <div className="section-head"><h2>{title}</h2></div>
      {children}
    </div>
  )
}


function AddWatchlist({ titleId, groups, userId }) {
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [groupId, setGroupId] = useState(groups[0]?.id || '')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!titleId) return null
  async function add() {
    setBusy(true)
    try {
      await addToWatchlist({ titleId, groupId, addedBy: userId })
      setDone(true); toast('Added to watchlist'); setTimeout(() => setOpen(false), 800)
    } catch (e) { toast(e.message || 'Could not add', 'err') }
    finally { setBusy(false) }
  }
  if (!open) return <button className="btn" onClick={() => setOpen(true)}>🔖 Add to watchlist</button>
  return (
    <span className="row" style={{ gap: 6 }}>
      <select value={groupId} onChange={(e) => setGroupId(e.target.value)} style={{ width: 'auto' }}>
        {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
      </select>
      <button className="btn" disabled={busy || done || !groupId} onClick={add}>{done ? '✓ Added' : 'Add'}</button>
    </span>
  )
}

const SERVICE_LIST = ['Netflix', 'Disney+', 'OSN+', 'Prime Video', 'Apple TV+', 'Shahid', 'StarzPlay', 'Max', 'Hulu', 'YouTube', 'Cinema']

function WhereToWatch({ providers, region, setRegion, title, titleId, tmdbId, mediaType, imdbId, userId }) {
  const toast = useToast()
  const regions = providerRegions(providers)
  const block = providers[region]
  const tmdbGroups = [
    ['Stream', block?.flatrate], ['Free', block?.free], ['With ads', block?.ads],
    ['Rent', block?.rent], ['Buy', block?.buy],
  ].filter(([, list]) => list && list.length)
  const justWatch = block?.link || `https://www.justwatch.com/us/search?q=${encodeURIComponent(title || '')}`

  const [live, setLive] = useState(null)       // { ok, total, groups } | null
  const [manual, setManual] = useState([])
  const [editing, setEditing] = useState(false)

  useEffect(() => { if (titleId) getTitleServices(titleId).then(setManual).catch(() => {}) }, [titleId])
  useEffect(() => {
    setLive(null)
    if (!tmdbId && !imdbId) return
    getStreamingAvailability({ tmdbId, mediaType, imdbId, country: region }).then(setLive).catch(() => {})
  }, [tmdbId, imdbId, mediaType, region])

  async function toggleService(s) {
    const next = manual.includes(s) ? manual.filter((x) => x !== s) : [...manual, s]
    setManual(next)
    try { await setTitleServices(titleId, next, userId) } catch (e) { toast(e.message || 'Could not save', 'err') }
  }

  const liveGroups = live?.ok && live.total > 0
    ? [['Stream', live.groups.stream], ['Free', live.groups.free], ['Rent', live.groups.rent], ['Buy', live.groups.buy]].filter(([, l]) => l?.length)
    : null

  return (
    <div className="detail-block">
      <div className="section-head">
        <h2>Where to watch</h2>
        {regions.length > 0 && (
          <select value={region} onChange={(e) => setRegion(e.target.value)} style={{ width: 'auto' }}>
            {regions.map((r) => <option key={r} value={r}>{regionName(r)}</option>)}
          </select>
        )}
      </div>

      {/* Manual override - always trusted, set by you */}
      <div className="ws-manual">
        <div className="spread" style={{ marginBottom: manual.length || editing ? 8 : 0 }}>
          <span className="faint">{manual.length ? '✓ You watch this on' : 'Set where you watch this'}</span>
          <button className="btn sm ghost" onClick={() => setEditing((e) => !e)}>{editing ? 'Done' : manual.length ? 'Edit' : '+ Add'}</button>
        </div>
        {!editing && manual.length > 0 && (
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {manual.map((s) => <span key={s} className="chip active" style={{ background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--on-accent)' }}>{s}</span>)}
          </div>
        )}
        {editing && (
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {SERVICE_LIST.map((s) => (
              <button key={s} className={`chip ${manual.includes(s) ? 'active' : ''}`}
                style={manual.includes(s) ? { background: 'var(--accent)', borderColor: 'var(--accent)', color: 'var(--on-accent)' } : undefined}
                onClick={() => toggleService(s)}>{manual.includes(s) ? '✓ ' : ''}{s}</button>
            ))}
          </div>
        )}
      </div>

      {/* Live availability (preferred) or TMDB fallback */}
      {liveGroups ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          {liveGroups.map(([label, list]) => (
            <div key={label}>
              <div className="faint" style={{ marginBottom: 6 }}>{label}</div>
              <div className="scroll-x">
                {list.map((p) => (
                  <a className="provider" key={`${label}-${p.name}`} title={p.name} href={p.link || justWatch} target="_blank" rel="noreferrer">
                    {p.logo ? <img src={p.logo} alt={p.name} /> : <span className="faint" style={{ padding: '0 6px', fontSize: 11 }}>{p.name}</span>}
                  </a>
                ))}
              </div>
            </div>
          ))}
          <div className="faint" style={{ fontSize: 12 }}>Live data · {regionName(region)}</div>
        </div>
      ) : tmdbGroups.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 14 }}>
          {tmdbGroups.map(([label, list]) => (
            <div key={label}>
              <div className="faint" style={{ marginBottom: 6 }}>{label}</div>
              <div className="scroll-x">
                {list.map((p) => (
                  <div className="provider" key={p.provider_id} title={p.provider_name}>
                    {IMG.logo(p.logo_path) ? <img src={IMG.logo(p.logo_path)} alt={p.provider_name} /> : <span className="faint">{p.provider_name}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="muted" style={{ marginTop: 14 }}>
          Nothing listed for {regionName(region)} yet.{' '}
          <a href={justWatch} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-2)' }}>Check on JustWatch ↗</a>
        </div>
      )}

      <div className="faint" style={{ marginTop: 10, fontSize: 12 }}>
        {liveGroups ? 'Live availability data' : 'Availability via JustWatch, can be incomplete for some regions'} · <a href={justWatch} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-2)' }}>verify on JustWatch ↗</a>
      </div>
    </div>
  )
}

function regionName(code) {
  try { return new Intl.DisplayNames(undefined, { type: 'region' }).of(code) || code }
  catch { return code }
}

function Episodes({ tmdbId, titleId, seasons, groups, profiles, userId, imdbId }) {
  const toast = useToast()
  const [trackGroupId, setTrackGroupId] = useState(groups[0]?.id || '')
  const [watched, setWatched] = useState(new Set())   // "s-e"
  const [epRatings, setEpRatings] = useState({})       // "s-e" -> rating
  const [epDates, setEpDates] = useState({})           // "s-e" -> watched_on
  const [epRewatch, setEpRewatch] = useState({})       // "s-e" -> rewatch_count
  const [seasonRatings, setSeasonRatings] = useState({}) // season -> { profileId: score }
  const [openSeason, setOpenSeason] = useState(seasons[0]?.season_number ?? null)
  const [episodesBySeason, setEpisodesBySeason] = useState({})
  const [imdbBySeason, setImdbBySeason] = useState({})  // season -> { epNum: imdbRating }
  const [expanded, setExpanded] = useState(null)       // "s-e"
  const [epImdb, setEpImdb] = useState({})             // "s-e" -> imdb_id | null (fetched lazily)
  const [desc, setDesc] = useState(false)              // newest episode first
  const [bulkBusy, setBulkBusy] = useState(false)
  const today = todayLocal()

  // Expand a row; fetch its IMDb id the first time it's opened.
  function openRow(season, ep, key) {
    const next = expanded === key ? null : key
    setExpanded(next)
    if (next && epImdb[key] === undefined) {
      setEpImdb((m) => ({ ...m, [key]: null }))   // mark in-flight
      getEpisodeExternalIds(tmdbId, season, ep)
        .then((x) => setEpImdb((m) => ({ ...m, [key]: x.imdb_id })))
        .catch(() => {})
    }
  }

  const reload = useCallback(async () => {
    if (!trackGroupId) { setWatched(new Set()); setEpRatings({}); setEpDates({}); setEpRewatch({}); setSeasonRatings({}); return }
    const rows = await listEpisodeWatches(titleId, trackGroupId)
    setWatched(new Set(rows.map((r) => `${r.season_number}-${r.episode_number}`)))
    setEpRatings(Object.fromEntries(rows.filter((r) => r.rating != null).map((r) => [`${r.season_number}-${r.episode_number}`, r.rating])))
    setEpDates(Object.fromEntries(rows.filter((r) => r.watched_on).map((r) => [`${r.season_number}-${r.episode_number}`, r.watched_on])))
    setEpRewatch(Object.fromEntries(rows.filter((r) => r.rewatch_count > 0).map((r) => [`${r.season_number}-${r.episode_number}`, r.rewatch_count])))
    try {
      const sr = await getSeasonRatings(titleId, trackGroupId)
      const map = {}
      for (const r of sr) { (map[r.season_number] ||= {})[r.profile_id] = r.score }
      setSeasonRatings(map)
    } catch { setSeasonRatings({}) }
  }, [titleId, trackGroupId])

  const trackGroup = groups.find((g) => g.id === trackGroupId)

  async function rateSeason(season, profileId, score) {
    if (!trackGroupId) return
    // optimistic update
    setSeasonRatings((m) => {
      const next = { ...m, [season]: { ...(m[season] || {}) } }
      if (score == null) delete next[season][profileId]
      else next[season][profileId] = score
      return next
    })
    try { await setSeasonRating({ titleId, groupId: trackGroupId, profileId, season, score, createdBy: userId }) }
    catch (e) { toast(e.message || 'Could not save season rating', 'err'); reload() }
  }

  useEffect(() => { reload() }, [reload])

  useEffect(() => {
    if (openSeason == null || episodesBySeason[openSeason]) return
    getSeason(tmdbId, openSeason)
      .then((eps) => setEpisodesBySeason((m) => ({ ...m, [openSeason]: eps })))
      .catch(() => {})
  }, [openSeason, tmdbId, episodesBySeason])

  // IMDb ratings for the open season (one OMDb call per season, cached server-side).
  useEffect(() => {
    if (openSeason == null || !imdbId || imdbBySeason[openSeason]) return
    getImdbSeasonRatings(imdbId, openSeason)
      .then((m) => setImdbBySeason((prev) => ({ ...prev, [openSeason]: m || {} })))
      .catch(() => {})
  }, [openSeason, imdbId, imdbBySeason])

  async function toggle(season, ep) {
    const key = `${season}-${ep}`
    const next = new Set(watched)
    if (next.has(key)) {
      next.delete(key); setWatched(next)
      await unmarkEpisode({ titleId, groupId: trackGroupId, season, episode: ep }).catch(reload)
    } else {
      next.add(key); setWatched(next)
      await markEpisode({ titleId, groupId: trackGroupId, season, episode: ep, watchedOn: today, createdBy: userId }).catch(reload)
    }
  }
  async function rate(season, ep, score) {
    const key = `${season}-${ep}`
    setEpRatings((r) => ({ ...r, [key]: score }))
    setWatched((w) => new Set(w).add(key))
    await setEpisodeRating({ titleId, groupId: trackGroupId, season, episode: ep, rating: score, watchedOn: today, createdBy: userId }).catch(reload)
  }
  async function markWholeSeason(season, eps) {
    await markSeason({ titleId, groupId: trackGroupId, season, episodes: eps.map((e) => e.episode_number), watchedOn: today, createdBy: userId })
    reload(); toast(`Marked ${eps.length} episodes watched`)
  }
  async function markEntireSeries() {
    if (!trackGroupId) return
    setBulkBusy(true)
    try {
      // Fetch every season's episode list in parallel, then write them all in a
      // single bulk upsert instead of one round-trip per season (much faster).
      const lists = await Promise.all(seasons.map(async (s) => episodesBySeason[s.season_number] || (await getSeason(tmdbId, s.season_number))))
      const all = []
      seasons.forEach((s, i) => (lists[i] || []).forEach((e) => all.push({ season: s.season_number, episode: e.episode_number, watchedOn: today })))
      if (all.length) await markEpisodesBulk({ titleId, groupId: trackGroupId, episodes: all, createdBy: userId })
      await reload(); toast(`Marked ${all.length} episodes watched`)
    } catch { toast('Could not mark all', 'err') } finally { setBulkBusy(false) }
  }
  async function clearSeries() {
    if (!trackGroupId || !confirm('Unmark every episode for this group?')) return
    setBulkBusy(true)
    try { await unmarkAllEpisodes({ titleId, groupId: trackGroupId }); await reload(); toast('Cleared all episodes') }
    finally { setBulkBusy(false) }
  }

  return (
    <div className="detail-block">
      <div className="section-head">
        <h2>Episodes</h2>
        <div className="row" style={{ gap: 8 }}>
          <button className="btn sm" onClick={() => setDesc((d) => !d)} title="Sort order">
            {desc ? 'Newest ↑' : 'Oldest ↓'}
          </button>
          <select value={trackGroupId} onChange={(e) => setTrackGroupId(e.target.value)} style={{ width: 'auto' }}>
            {groups.length === 0 && <option value="">Create a group first</option>}
            {groups.map((g) => <option key={g.id} value={g.id}>track: {g.name}</option>)}
          </select>
        </div>
      </div>

      {trackGroupId && (
        <div className="row" style={{ gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
          <button className="btn sm primary" disabled={bulkBusy} onClick={markEntireSeries}>✓ Mark entire series watched</button>
          <button className="btn sm" disabled={bulkBusy} onClick={clearSeries}>Clear all</button>
        </div>
      )}

      <EpisodeRatingGraph epRatings={epRatings} />

      {(() => {
        const bars = seasons.map((s) => {
          const r = seasonRatings[s.season_number]
          if (!r) return null
          const vals = Object.values(r)
          return { n: s.season_number, avg: vals.reduce((a, b) => a + b, 0) / vals.length }
        }).filter(Boolean)
        if (bars.length < 2) return null
        return (
          <div className="card" style={{ marginBottom: 8 }}>
            <div className="faint" style={{ marginBottom: 8 }}>Your season scores</div>
            <div className="cols">
              {bars.map((b) => (
                <button className="col" key={b.n} title={`Season ${b.n}: ${b.avg.toFixed(1)}/10`} onClick={() => setOpenSeason(b.n)}>
                  <div className="fill" style={{ height: `${b.avg * 10}%`, background: b.avg >= 8 ? 'var(--green)' : b.avg >= 6 ? 'var(--accent)' : 'var(--pink)' }} />
                  <span className="cl">S{b.n}</span>
                </button>
              ))}
            </div>
          </div>
        )
      })()}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {seasons.map((s) => {
          const raw = episodesBySeason[s.season_number] || []
          const eps = desc ? [...raw].reverse() : raw
          // Count from the full watched set (+ TMDB episode_count), not the
          // lazily-loaded episode list, so every season shows its progress
          // without having to be opened first.
          const watchedInSeason = [...watched].filter((k) => Number(k.split('-')[0]) === s.season_number).length
          const isOpen = openSeason === s.season_number
          return (
            <div className="card" key={s.season_number} style={{ padding: 0, overflow: 'hidden' }}>
              <button className="season-head" onClick={() => setOpenSeason(isOpen ? null : s.season_number)}>
                <span><strong>{s.name || `Season ${s.season_number}`}</strong> <span className="faint">· {s.episode_count} eps</span></span>
                <span className="row" style={{ gap: 10 }}>
                  {(() => { const arr = Object.entries(seasonRatings[s.season_number] || {}).map(([pid, score]) => ({ profile_id: pid, score })); return arr.length ? <DualScore profiles={profiles} ratings={arr} /> : null })()}
                  <span className="faint">{watchedInSeason > 0 ? `${watchedInSeason}/${s.episode_count} watched` : ''} {isOpen ? '▾' : '▸'}</span>
                </span>
              </button>
              {isOpen && (
                <div className="season-body">
                  {eps.length === 0 ? (
                    <div className="faint" style={{ padding: 12 }}>Loading episodes…</div>
                  ) : (
                    <>
                      <div className="season-rate" style={{ padding: '0 12px 10px' }}>
                        <div className="faint" style={{ marginBottom: 6 }}>Rate this season</div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                          {profiles.map((p) => (
                            <div className="row" key={p.id} style={{ gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                              <span style={{ color: p.color, fontWeight: 700, fontSize: 13, minWidth: 70 }}>{p.name}</span>
                              <StarRating value={seasonRatings[s.season_number]?.[p.id] || null} color={p.color}
                                onChange={(v) => rateSeason(s.season_number, p.id, v)} />
                            </div>
                          ))}
                        </div>
                      </div>
                      <button className="btn sm" style={{ margin: '0 12px 10px' }} disabled={!trackGroupId}
                        onClick={() => markWholeSeason(s.season_number, raw)}>✓ Mark whole season</button>
                      {eps.map((e) => {
                        const key = `${s.season_number}-${e.episode_number}`
                        const on = watched.has(key)
                        const rt = epRatings[key]
                        const imdbRt = imdbBySeason[s.season_number]?.[e.episode_number]
                        const isExp = expanded === key
                        return (
                          <div className={`ep2 ${on ? 'on' : ''}`} key={e.episode_number}>
                            <input type="checkbox" className="ep2-chk" checked={on} disabled={!trackGroupId}
                              onChange={() => toggle(s.season_number, e.episode_number)} />
                            <div className="ep2-thumb">
                              {IMG.still(e.still_path) ? <img src={IMG.still(e.still_path)} alt="" loading="lazy" /> : <span className="ep2-num">{e.episode_number}</span>}
                            </div>
                            <div className="ep2-body" onClick={() => openRow(s.season_number, e.episode_number, key)}>
                              <div className="ep2-title">
                                <strong>{e.episode_number}. {e.name}</strong>
                                {imdbRt ? <span className="imdb-rating sm">IMDb {imdbRt}</span>
                                  : e.vote_average ? <span className="tmdb-rating sm">TMDB {e.vote_average.toFixed(1)}</span> : null}
                                {rt ? <span className="ep2-rt">★ {rt}</span> : null}
                                {epRewatch[key] > 0 ? <span className="rewatch-badge">↻ ×{epRewatch[key] + 1}</span> : null}
                              </div>
                              <div className="faint ep2-meta">
                                {e.air_date ? `Aired ${fmtDate(e.air_date)}` : 'Air date TBA'}{e.runtime ? ` · ${e.runtime} min` : ''}
                              </div>
                              {on && (
                                <div className="ep2-watched">
                                  ✓ Watched {epDates[key] ? fmtDate(epDates[key]) : '(date not set)'}
                                  {trackGroup && <> · <span style={{ color: trackGroup.color }}>{trackGroup.name}</span></>}
                                </div>
                              )}
                              {isExp && e.overview && <p className="ep2-ov">{e.overview}</p>}
                              {isExp && (
                                <div onClick={(ev) => ev.stopPropagation()} style={{ marginTop: 8 }}>
                                  <dl className="ep2-facts">
                                    <div><dt>Released</dt><dd>{e.air_date ? fmtDate(e.air_date) : 'N/A'}</dd></div>
                                    <div><dt>Watched</dt><dd>{on ? (epDates[key] ? fmtDate(epDates[key]) : 'date not set') : 'Not yet'}</dd></div>
                                    <div><dt>List / watched by</dt><dd>{trackGroup ? trackGroup.name : 'N/A'}</dd></div>
                                  </dl>
                                  <div className="faint" style={{ margin: '4px 0' }}>Your rating</div>
                                  <StarRating value={rt || 0} color="var(--accent)" onChange={(sc) => rate(s.season_number, e.episode_number, sc)} />
                                  <div className="row" style={{ gap: 14, marginTop: 8, flexWrap: 'wrap' }}>
                                    {epImdb[key] && (
                                      <a className="ep2-link imdb" href={`https://www.imdb.com/title/${epImdb[key]}/`}
                                        target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()}>IMDb ↗</a>
                                    )}
                                    <a className="ep2-link" href={`https://www.themoviedb.org/tv/${tmdbId}/season/${s.season_number}/episode/${e.episode_number}`}
                                      target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()}>TMDB ↗</a>
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
      {!trackGroupId && <div className="faint" style={{ marginTop: 8 }}>Pick a group above to start ticking off episodes.</div>}
    </div>
  )
}

// IMDb-style chart of the user's own episode ratings across the series.
function EpisodeRatingGraph({ epRatings }) {
  const points = Object.entries(epRatings || {})
    .map(([k, rating]) => { const [s, e] = k.split('-').map(Number); return { s, e, rating } })
    .sort((a, b) => a.s - b.s || a.e - b.e)
  if (points.length < 3) return null

  const avg = (points.reduce((a, p) => a + p.rating, 0) / points.length).toFixed(1)
  const color = (r) => r >= 8 ? 'var(--green)' : r >= 6 ? 'var(--accent)' : r >= 4 ? 'var(--accent-2)' : 'var(--red)'
  // Season boundaries for subtle dividers.
  const seasons = [...new Set(points.map((p) => p.s))]

  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="spread" style={{ marginBottom: 10 }}>
        <strong style={{ fontSize: 14 }}>Your episode ratings</strong>
        <span className="faint">{points.length} rated · avg ★ {avg}</span>
      </div>
      <div className="epchart">
        {points.map((p, i) => {
          const newSeason = i > 0 && p.s !== points[i - 1].s
          return (
            <div key={`${p.s}-${p.e}`} className="epchart-bar-wrap" title={`S${p.s}·E${p.e}: ${p.rating}/10`}
              style={newSeason ? { borderLeft: '1px solid var(--border)', paddingLeft: 3, marginLeft: 1 } : undefined}>
              <div className="epchart-bar" style={{ height: `${p.rating * 10}%`, background: color(p.rating) }} />
            </div>
          )
        })}
      </div>
      <div className="faint" style={{ marginTop: 6, fontSize: 11 }}>
        {seasons.length > 1 ? `Seasons ${seasons[0]} to ${seasons[seasons.length - 1]} · oldest to newest` : 'oldest to newest'}
      </div>
    </div>
  )
}
