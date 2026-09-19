export type ShieldTagShareSelection = {
  deviceId: string
  finishId: string
  label: string
}

const SAFE_TOKEN = /^[a-z0-9-]{1,64}$/i

/**
 * Builds a shareable ShieldLab URL without copying unrelated query parameters.
 * The allowlist keeps shared links stable and avoids accidentally propagating
 * auth, campaign, or other private/transient URL state.
 */
export function buildShieldTagShareUrl(origin: string, pathname: string, selection: ShieldTagShareSelection) {
  if (!SAFE_TOKEN.test(selection.deviceId) || !SAFE_TOKEN.test(selection.finishId)) {
    throw new Error('Invalid ShieldTag share selection')
  }

  const url = new URL(pathname || '/', origin)
  url.search = ''
  url.searchParams.set('device', selection.deviceId)
  url.searchParams.set('finish', selection.finishId)
  url.hash = 'shieldlab'
  return url.toString()
}

export function buildShieldTagSharePayload(origin: string, pathname: string, selection: ShieldTagShareSelection) {
  return {
    title: 'My RADVORA ShieldTag build',
    text: `${selection.label} — see this ShieldTag build`,
    url: buildShieldTagShareUrl(origin, pathname, selection),
  }
}
