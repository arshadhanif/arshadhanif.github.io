import { useCallback, useEffect, useState } from 'react'
import { sendFriendRequest, listFriends, acceptFriend, removeFriend, friendFeed } from '../lib/db'
import { useToast } from '../context/Toast'
import { Poster, Spinner, Empty, TitleLink } from '../components/ui'
import { fmtDate as fmt } from '../lib/dates'

export default function Friends() {
  const toast = useToast()
  const [friends, setFriends] = useState([])
  const [feed, setFeed] = useState([])
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [f, fe] = await Promise.all([listFriends(), friendFeed()])
      setFriends(f); setFeed(fe)
    } finally { setLoading(false) }
  }, [])
  useEffect(() => { load() }, [load])

  async function add(e) {
    e.preventDefault()
    if (!email.trim()) return
    setBusy(true)
    try {
      const res = await sendFriendRequest(email.trim())
      const msg = {
        ok: 'Request sent ✓', not_found: 'No ReelBook user with that email',
        self: "That's your own account", no_household: 'Set up your household first',
      }[res] || 'Done'
      toast(msg, res === 'ok' ? 'ok' : 'err')
      if (res === 'ok') { setEmail(''); load() }
    } catch (e) { toast(e.message || 'Could not send', 'err') }
    finally { setBusy(false) }
  }

  async function accept(id) { await acceptFriend(id); toast('Friend added'); load() }
  async function remove(id) { await removeFriend(id); load() }

  const incoming = friends.filter((f) => f.status === 'pending' && f.incoming)
  const outgoing = friends.filter((f) => f.status === 'pending' && !f.incoming)
  const accepted = friends.filter((f) => f.status === 'accepted')

  return (
    <div className="page">
      <h1>Friends</h1>
      <p className="sub">Follow other households to see what they’re watching and rating.</p>

      <form className="card" onSubmit={add} style={{ marginBottom: 18 }}>
        <label className="faint" style={{ fontWeight: 700, display: 'block', marginBottom: 8 }}>Add a friend by email</label>
        <div className="row" style={{ gap: 8 }}>
          <input type="email" placeholder="their@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          <button className="btn primary" disabled={busy}>{busy ? '…' : 'Send'}</button>
        </div>
      </form>

      {loading ? <Spinner /> : (
        <>
          {incoming.length > 0 && (
            <Section title="Requests">
              {incoming.map((f) => (
                <div className="card spread" key={f.friendship_id}>
                  <strong>{f.other_name}</strong>
                  <div className="row" style={{ gap: 6 }}>
                    <button className="btn sm primary" onClick={() => accept(f.friendship_id)}>Accept</button>
                    <button className="btn sm" onClick={() => remove(f.friendship_id)}>Decline</button>
                  </div>
                </div>
              ))}
            </Section>
          )}

          <Section title={`Friends${accepted.length ? ` (${accepted.length})` : ''}`}>
            {accepted.length === 0 ? (
              <Empty icon="👋">No friends yet. Add someone by their email above.</Empty>
            ) : accepted.map((f) => (
              <div className="card spread" key={f.friendship_id}>
                <strong>{f.other_name}</strong>
                <button className="btn sm danger" onClick={() => remove(f.friendship_id)}>Remove</button>
              </div>
            ))}
            {outgoing.map((f) => (
              <div className="card spread" key={f.friendship_id} style={{ opacity: 0.7 }}>
                <span>{f.other_name} <span className="faint">· request sent</span></span>
                <button className="btn sm" onClick={() => remove(f.friendship_id)}>Cancel</button>
              </div>
            ))}
          </Section>

          <Section title="Friends’ activity">
            {feed.length === 0 ? (
              <Empty icon="🍿">When your friends log watches shared with friends, they’ll show up here.</Empty>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {feed.map((w) => (
                  <div className="card row" key={w.watch_id} style={{ gap: 12, alignItems: 'flex-start' }}>
                    <TitleLink className="tile" tmdbId={w.tmdb_id} media={w.media_type} style={{ width: 54, flexShrink: 0 }}>
                      <Poster title={w.title} mediaType={w.media_type} posterPath={w.poster_path} />
                    </TitleLink>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong>{w.title} <span className="faint">{w.year || ''}</span></strong>
                      <div className="faint" style={{ margin: '3px 0 6px' }}>
                        {w.household_name}{w.watched_on ? ` · ${fmt(w.watched_on)}` : ''}
                      </div>
                      <span className="dual">
                        {(w.ratings || []).filter((r) => r.score != null).map((r, i) => (
                          <span className="score" key={i} style={{ borderColor: r.color, color: r.color }}>
                            {initials(r.name)} {r.score}
                          </span>
                        ))}
                      </span>
                      {w.note && <p className="muted" style={{ margin: '6px 0 0', fontSize: 14 }}>“{w.note}”</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Section>
        </>
      )}
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 22 }}>
      <div className="section-head"><h2>{title}</h2></div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>{children}</div>
    </div>
  )
}
function initials(name = '') {
  return name.split(' ').map((w) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
}
