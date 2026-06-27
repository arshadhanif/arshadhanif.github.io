// Build downloadable backups of the user's data.
import { exportAllData } from './db'
import { fmtDate } from './dates'

function todayStamp() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function download(filename, text, type) {
  const blob = new Blob([text], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click(); a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

const csvCell = (v) => {
  const s = v == null ? '' : String(v)
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}
const csvRows = (rows) => rows.map((r) => r.map(csvCell).join(',')).join('\r\n')

// Complete, re-importable JSON backup.
export async function downloadJsonBackup() {
  const data = await exportAllData()
  download(`reelbook-backup-${todayStamp()}.json`, JSON.stringify(data, null, 2), 'application/json')
  return data.counts
}

// Human-readable diary spreadsheet.
export async function downloadDiaryCsv() {
  const data = await exportAllData()
  const head = ['Title', 'Year', 'Type', 'Watched', 'Group', 'Ratings', 'Episodes', 'Service', 'Where', 'Note']
  const rows = data.diary.map((e) => [
    e.titles?.title, e.titles?.year, e.titles?.media_type,
    e.watched_on ? fmtDate(e.watched_on) : '',
    e.groups?.name,
    (e.ratings || []).map((r) => r.score).filter((s) => s != null).join(' / '),
    e.episodes_watched || '',
    e.service, e.where_watched, e.note,
  ])
  download(`reelbook-diary-${todayStamp()}.csv`, csvRows([head, ...rows]), 'text/csv')
  return rows.length
}

// Human-readable episode-watch spreadsheet.
export async function downloadEpisodesCsv() {
  const data = await exportAllData()
  const head = ['Show', 'Season', 'Episode', 'Watched', 'Group', 'Rating']
  const rows = data.episodes.map((e) => [
    e.titles?.title, e.season_number, e.episode_number,
    e.watched_on ? fmtDate(e.watched_on) : '',
    e.groups?.name, e.rating ?? '',
  ])
  download(`reelbook-episodes-${todayStamp()}.csv`, csvRows([head, ...rows]), 'text/csv')
  return rows.length
}
