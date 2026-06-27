// Web Push opt-in: registers the service worker, subscribes to the browser's
// push service with our VAPID public key, and stores the subscription so the
// backend can notify this device about new episodes even when the app is closed.
import { savePushSubscription, deletePushSubscription, sendTestPush } from './db'

// VAPID public key (safe to ship — the private half lives only on the server).
const VAPID_PUBLIC = 'BDKZearvTE-fFUG_IKsXAj_IlkNCOoI4h21k145iHTbtrbGL_CD7_xdzwE7GUSMHIfHqAu4woKeTaQS3T2thjSU'

export function isPushSupported() {
  return typeof window !== 'undefined' &&
    'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

function urlBase64ToUint8Array(base64) {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4)
  const b64 = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/')
  const raw = atob(b64)
  const out = new Uint8Array(raw.length)
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i)
  return out
}

async function swReady() {
  const reg = await navigator.serviceWorker.getRegistration()
  return reg || navigator.serviceWorker.register('/sw.js')
}

// Current state: 'unsupported' | 'denied' | 'on' | 'off'
export async function getPushState() {
  if (!isPushSupported()) return 'unsupported'
  if (Notification.permission === 'denied') return 'denied'
  try {
    const reg = await navigator.serviceWorker.getRegistration()
    const sub = reg && (await reg.pushManager.getSubscription())
    return sub ? 'on' : 'off'
  } catch { return 'off' }
}

export async function enablePush() {
  if (!isPushSupported()) throw new Error('Push isn’t supported on this device/browser.')
  const perm = await Notification.requestPermission()
  if (perm !== 'granted') throw new Error('Notifications permission was not granted.')
  const reg = await swReady()
  await navigator.serviceWorker.ready
  let sub = await reg.pushManager.getSubscription()
  if (!sub) {
    sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC),
    })
  }
  await savePushSubscription(sub)
  return 'on'
}

export async function disablePush() {
  const reg = await navigator.serviceWorker.getRegistration()
  const sub = reg && (await reg.pushManager.getSubscription())
  if (sub) {
    await deletePushSubscription(sub.endpoint).catch(() => {})
    await sub.unsubscribe().catch(() => {})
  }
  return 'off'
}

export { sendTestPush }
