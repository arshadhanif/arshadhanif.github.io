import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { getFullDetail, getSeason, IMG, providerRegions } from '../lib/tmdb'
import {
  ensureTitleFromFull, getWatchesForTitle, addToWatchlist,
  listEpisodeWatches, markEpisode, unmarkEpisode, markSeason,
} from '../lib/db'
import { useAppData } from '../context/AppData'
import { useAuth } from '../context/AuthContext'
import { Poster, Spinner, DualScore } from '../components/ui'
import MarkWatchedModal from '../components/MarkWatchedModal'

const PREFERRED_REGION = 'SA'

export default function TitleDetail() {
  const { media, id } = useParams()
  const navigate = useNavigate()
  const { groups, profiles } = useAppData()
  const { user } = useAuth()

  const [full, setFull] = useState(null)
  const [titleId, setTitleId] = useState(null)
  const [watches, setWatches] = useState([])
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState(null)
  const [watchModal, setWatchModal] = useState(false)
  const [region, setRegion] = useState(PREFERRED_REGION)

  const loadWatches = useCallback(async (tid) => {
    try { setWatches(await getWatchesForTitle(tid)) } catch (e) { console.warn(e) }
  }, [])

  useEffect(() => {
    let alive = true
    setLoading(true); setErr(null)
    getFullDetail(Number(id), media)
      .then(async (f) => {
        if (!alive) return
        setFull(f)
        const regions = providerRegions(f.providers)
        setRegion(regions.includes(PREFERRED_REGION) ? PREFERRED_REGION : regions.includes('US') ? 'US' : regions[0] || PREFERRED_REGION)
        try {
          const tid = await ensureTitleFromFull(f)
          if (!alive) return
          setTitleId(tid)
          loadWatches(tid)
        } catch (e) { console.warn('cache title', e) }
      })
      .catch((e) => alive && setErr(e.message))
      .finally(() => alive && setLoading(false))
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
              {full.vote_average ? <span className="tmdb-rating">★ {full.vote_average} TMDB</span> : null}
            </div>
            <div className="scroll-x" style={{ margin: '4px 0 14px' }}>
              {full.genres.map((g) => <span className="chip" key={g}>{g}</span>)}
            </div>
            <div className="row" style={{ flexWrap: 'wrap', gap: 8 }}>
              <button className="btn primary" onClick={() => setWatchModal(true)}>✓ Mark watched</button>
              <AddWatchlist titleId={titleId} groups={groups} userId={user.id} />
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
            <div className="muted">{full.crew.map((c) => c.name).join(', ')}</div>
          </Block>
        )}

        <WhereToWatch providers={full.providers} region={region} setRegion={setRegion} />

        {full.cast.length > 0 && (
          <Block title="Cast">
            <div className="scroll-x cast-row">
              {full.cast.map((c) => (
                <div className="cast" key={c.id}>
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
          <Episodes tmdbId={Number(id)} titleId={titleId} seasons={full.seasons} groups={groups} userId={user.id} />
        )}

        {watches.length > 0 && (
          <Block title="Your history">
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {watches.map((w) => (
                <div className="card spread" key={w.id}>
                  <div>
                    <div className="faint">{fmt(w.watched_on)}{w.groups && <> · <span style={{ color: w.groups.color }}>{w.groups.name}</span></>}</div>
                    {w.note && <div className="muted" style={{ fontSize: 14, marginTop: 4 }}>“{w.note}”</div>}
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

      {watchModal && (
        <MarkWatchedModal
          item={{ titleId, title: full.title, media_type: full.media_type, total_episodes: full.total_episodes }}
          groups={groups}
          profiles={profiles}
          onClose={() => setWatchModal(false)}
          onSaved={() => loadWatches(titleId)}
        />
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

function fmt(d) {
  if (!d) return ''
  return new Date(d + 'T00:00:00').toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

function AddWatchlist({ titleId, groups, userId }) {
  const [open, setOpen] = useState(false)
  const [groupId, setGroupId] = useState(groups[0]?.id || '')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)
  if (!titleId) return null
  async function add() {
    setBusy(true)
    try { await addToWatchlist({ titleId, groupId, addedBy: userId }); setDone(true); setTimeout(() => setOpen(false), 800) }
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

function WhereToWatch({ providers, region, setRegion }) {
  const regions = providerRegions(providers)
  const block = providers[region]
  const groupsOf = [
    ['Stream', block?.flatrate],
    ['Rent', block?.rent],
    ['Buy', block?.buy],
  ].filter(([, list]) => list && list.length)

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
      {groupsOf.length === 0 ? (
        <div className="muted">No streaming/rent/buy options listed for {regionName(region)}.</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {groupsOf.map(([label, list]) => (
            <div key={label}>
              <div className="faint" style={{ marginBottom: 6 }}>{label}</div>
              <div className="scroll-x">
                {list.map((p) => (
                  <div className="provider" key={p.provider_id} title={p.provider_name}>
                    {IMG.logo(p.logo_path)
                      ? <img src={IMG.logo(p.logo_path)} alt={p.provider_name} />
                      : <span className="faint">{p.provider_name}</span>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="faint" style={{ marginTop: 10 }}>
        Streaming data by JustWatch{block?.link ? <> · <a href={block.link} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-2)' }}>view on JustWatch ↗</a></> : null}
      </div>
    </div>
  )
}

function regionName(code) {
  try { return new Intl.DisplayNames(undefined, { type: 'region' }).of(code) || code }
  catch { return code }
}

function Episodes({ tmdbId, titleId, seasons, groups, userId }) {
  const [trackGroupId, setTrackGroupId] = useState(groups[0]?.id || '')
  const [watched, setWatched] = useState(new Set()) // "s-e"
  const [openSeason, setOpenSeason] = useState(seasons[0]?.season_number ?? null)
  const [episodesBySeason, setEpisodesBySeason] = useState({})
  const today = new Date().toISOString().slice(0, 10)

  const reloadWatched = useCallback(async () => {
    if (!trackGroupId) { setWatched(new Set()); return }
    const rows = await listEpisodeWatches(titleId, trackGroupId)
    setWatched(new Set(rows.map((r) => `${r.season_number}-${r.episode_number}`)))
  }, [titleId, trackGroupId])

  useEffect(() => { reloadWatched() }, [reloadWatched])

  useEffect(() => {
    if (openSeason == null || episodesBySeason[openSeason]) return
    getSeason(tmdbId, openSeason)
      .then((eps) => setEpisodesBySeason((m) => ({ ...m, [openSeason]: eps })))
      .catch(() => {})
  }, [openSeason, tmdbId, episodesBySeason])

  async function toggle(season, ep) {
    const key = `${season}-${ep}`
    const next = new Set(watched)
    if (next.has(key)) {
      next.delete(key)
      setWatched(next)
      await unmarkEpisode({ titleId, groupId: trackGroupId, season, episode: ep }).catch(reloadWatched)
    } else {
      next.add(key)
      setWatched(next)
      await markEpisode({ titleId, groupId: trackGroupId, season, episode: ep, watchedOn: today, createdBy: userId }).catch(reloadWatched)
    }
  }

  async function markWholeSeason(season, eps) {
    await markSeason({ titleId, groupId: trackGroupId, season, episodes: eps.map((e) => e.episode_number), watchedOn: today, createdBy: userId })
    reloadWatched()
  }

  return (
    <div className="detail-block">
      <div className="section-head">
        <h2>Episodes</h2>
        <select value={trackGroupId} onChange={(e) => setTrackGroupId(e.target.value)} style={{ width: 'auto' }}>
          {groups.length === 0 && <option value="">— create a group —</option>}
          {groups.map((g) => <option key={g.id} value={g.id}>track as: {g.name}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {seasons.map((s) => {
          const eps = episodesBySeason[s.season_number] || []
          const watchedInSeason = eps.filter((e) => watched.has(`${s.season_number}-${e.episode_number}`)).length
          const isOpen = openSeason === s.season_number
          return (
            <div className="card" key={s.season_number} style={{ padding: 0, overflow: 'hidden' }}>
              <button className="season-head" onClick={() => setOpenSeason(isOpen ? null : s.season_number)}>
                <span><strong>{s.name || `Season ${s.season_number}`}</strong> <span className="faint">· {s.episode_count} eps</span></span>
                <span className="faint">
                  {eps.length ? `${watchedInSeason}/${eps.length} watched` : ''} {isOpen ? '▾' : '▸'}
                </span>
              </button>
              {isOpen && (
                <div className="season-body">
                  {eps.length === 0 ? (
                    <div className="faint" style={{ padding: 12 }}>Loading episodes…</div>
                  ) : (
                    <>
                      <button className="btn sm" style={{ margin: '0 12px 8px' }} disabled={!trackGroupId}
                        onClick={() => markWholeSeason(s.season_number, eps)}>✓ Mark whole season</button>
                      {eps.map((e) => {
                        const on = watched.has(`${s.season_number}-${e.episode_number}`)
                        return (
                          <label className={`ep ${on ? 'on' : ''}`} key={e.episode_number}>
                            <input type="checkbox" checked={on} disabled={!trackGroupId}
                              onChange={() => toggle(s.season_number, e.episode_number)} />
                            <span className="ep-num">{e.episode_number}</span>
                            <span className="ep-name">{e.name}</span>
                            <span className="ep-date faint">{e.air_date || ''}</span>
                          </label>
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
