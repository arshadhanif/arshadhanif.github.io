// ReelBook Web Push function (deployed to Supabase Edge Functions).
//
// Two jobs:
//   { action: "test" }            -> send a test push to the calling user's devices
//   { secret: "<cron_secret>" }   -> scheduled scan: for every user with a push
//                                    subscription, check each tracked show's aired
//                                    episode count against TMDB and push when new
//                                    episodes have aired since they last caught up.
//
// Secrets live in the `app_config` table (service-role only): vapid_public,
// vapid_private, vapid_subject, cron_secret, tmdb_token. The scan is scheduled
// by pg_cron (see migrations) hitting this function daily.
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "npm:@supabase/supabase-js@2"
import webpush from "npm:web-push@3.6.7"

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
const admin = createClient(SUPABASE_URL, SERVICE_ROLE)

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, apikey, x-client-info",
}
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...CORS, "Content-Type": "application/json" } })

async function loadConfig(): Promise<Record<string, string>> {
  const { data } = await admin.from("app_config").select("key,value")
  const c: Record<string, string> = {}
  for (const r of data ?? []) c[(r as any).key] = (r as any).value
  return c
}

// Mirror of the client's airedEpisodes(): TMDB number_of_episodes also counts
// announced-but-unaired episodes, so derive the true aired count.
function airedEpisodes(d: any): number | null {
  if (!d.next_episode_to_air) return d.number_of_episodes ?? null
  const last = d.last_episode_to_air
  if (!last) return d.number_of_episodes ?? null
  let count = (d.seasons ?? [])
    .filter((s: any) => (s.season_number || 0) >= 1 && s.season_number < last.season_number)
    .reduce((a: number, s: any) => a + (s.episode_count || 0), 0)
  count += last.episode_number || 0
  return count
}

async function tmdbAired(token: string, tmdbId: number): Promise<number | null> {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tmdbId}`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    })
    if (!res.ok) return null
    return airedEpisodes(await res.json())
  } catch { return null }
}

async function sendToUser(userId: string, payload: unknown): Promise<number> {
  const { data: subs } = await admin.from("push_subscriptions").select("*").eq("user_id", userId)
  let ok = 0
  for (const s of subs ?? []) {
    try {
      await webpush.sendNotification(
        { endpoint: (s as any).endpoint, keys: { p256dh: (s as any).p256dh, auth: (s as any).auth } },
        JSON.stringify(payload),
      )
      ok++
    } catch (e: any) {
      const code = e?.statusCode
      if (code === 404 || code === 410) await admin.from("push_subscriptions").delete().eq("id", (s as any).id)
    }
  }
  return ok
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS })

  let body: any = {}
  try { body = await req.json() } catch {}

  const c = await loadConfig()
  if (!c.vapid_public || !c.vapid_private) return json({ error: "vapid not configured" }, 500)
  webpush.setVapidDetails(c.vapid_subject || "mailto:reelbook@example.com", c.vapid_public, c.vapid_private)

  // ---- Test push: triggered by a signed-in user from Settings ----
  if (body.action === "test") {
    const authHeader = req.headers.get("Authorization") || ""
    const token = authHeader.replace(/^Bearer\s+/i, "")
    const { data: { user } } = await admin.auth.getUser(token)
    if (!user) return json({ error: "unauthorized" }, 401)
    const sent = await sendToUser(user.id, {
      title: "ReelBook",
      body: "🔔 Push is on — you'll hear about new episodes here, even with the app closed.",
      url: "/notifications",
    })
    return json({ ok: true, sent })
  }

  // ---- Scheduled scan: triggered by pg_cron with the shared secret ----
  if (body.secret !== c.cron_secret) return json({ error: "forbidden" }, 403)

  const { data: subUsers } = await admin.from("push_subscriptions").select("user_id")
  const userIds = [...new Set((subUsers ?? []).map((r: any) => r.user_id))]
  let pushes = 0

  // ---- Subscription reminders: trials ending / renewals due within 2 days ----
  // Recurring auto-renew dates are rolled forward to their next occurrence so
  // they never go stale; reminded_for guards against repeating a reminder.
  let reminders = 0
  const todayStr = new Date().toISOString().slice(0, 10)
  const horizon = new Date(Date.now() + 2 * 86400000).toISOString().slice(0, 10)
  const rollFwd = (ds: string, cycle: string): string => {
    let d = new Date(ds + "T00:00:00Z")
    const t = new Date(todayStr + "T00:00:00Z")
    let g = 0
    while (d < t && g++ < 600) {
      if (cycle === "monthly") d.setUTCMonth(d.getUTCMonth() + 1)
      else d.setUTCFullYear(d.getUTCFullYear() + 1)
    }
    return d.toISOString().slice(0, 10)
  }
  for (const uid of userIds) {
    const { data: rows } = await admin
      .from("subscriptions")
      .select("id, name, cost, currency, cycle, renews_on, reminded_for, auto_renew")
      .eq("owner_id", uid).eq("active", true)
      .not("renews_on", "is", null)
    for (const s of rows ?? []) {
      const sub = s as any
      let when = String(sub.renews_on).slice(0, 10)
      if ((sub.cycle === "monthly" || sub.cycle === "yearly") && sub.auto_renew !== false && when < todayStr) {
        const rolled = rollFwd(when, sub.cycle)
        if (rolled !== when) {
          await admin.from("subscriptions").update({ renews_on: rolled, reminded_for: null }).eq("id", sub.id)
          when = rolled; sub.reminded_for = null
        }
      }
      if (when < todayStr || when > horizon) continue
      if (sub.reminded_for === when) continue
      const isTrial = sub.cycle === "trial"
      const bodyText = isTrial
        ? `⏰ Your ${sub.name} free trial ends ${when}. Cancel before then to avoid being charged.`
        : `💳 ${sub.name} renews ${when}${sub.cost ? ` (${sub.currency} ${sub.cost})` : ""}.`
      await sendToUser(uid, { title: "ReelBook subscriptions", body: bodyText, url: "/subscriptions" })
      await admin.from("subscriptions").update({ reminded_for: when }).eq("id", sub.id)
      reminders++
    }
  }

  // ---- Contract reminders: contract ending within 14 days (once per date) ----
  for (const uid of userIds) {
    const { data: crows } = await admin
      .from("subscriptions")
      .select("id, name, contract_end, reminded_contract")
      .eq("owner_id", uid).eq("active", true)
      .not("contract_end", "is", null)
    for (const s of crows ?? []) {
      const sub = s as any
      const ce = String(sub.contract_end).slice(0, 10)
      const dd = Math.round((new Date(ce + "T00:00:00Z").getTime() - new Date(todayStr + "T00:00:00Z").getTime()) / 86400000)
      if (dd < 0 || dd > 14 || sub.reminded_contract === ce) continue
      await sendToUser(uid, {
        title: "ReelBook subscriptions",
        body: `📄 ${sub.name} contract ends ${ce} (in ${dd} day${dd === 1 ? "" : "s"}). Decide before it auto-renews for another term.`,
        url: "/subscriptions",
      })
      await admin.from("subscriptions").update({ reminded_contract: ce }).eq("id", sub.id)
      reminders++
    }
  }

  if (c.tmdb_token) {
    for (const uid of userIds) {
      const { data: rows } = await admin
        .from("notif_state")
        .select("title_id, baseline_aired, pushed_aired, titles!inner(tmdb_id, media_type, title)")
        .eq("user_id", uid)
      for (const r of rows ?? []) {
        const t = (r as any).titles
        if (!t || t.media_type !== "tv" || !t.tmdb_id) continue
        const aired = await tmdbAired(c.tmdb_token, t.tmdb_id)
        if (aired == null) continue
        const baseline = (r as any).baseline_aired ?? 0
        const threshold = Math.max(baseline, (r as any).pushed_aired ?? 0)
        if (aired > threshold) {
          const n = aired - baseline
          await sendToUser(uid, {
            title: t.title,
            body: `🆕 ${n} new episode${n > 1 ? "s" : ""} aired`,
            url: "/notifications",
          })
          await admin.from("notif_state").update({ pushed_aired: aired }).eq("user_id", uid).eq("title_id", (r as any).title_id)
          pushes++
        }
      }
    }
  }
  return json({ ok: true, users: userIds.length, pushes, reminders })
})
