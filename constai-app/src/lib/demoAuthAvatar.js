function initialsFrom(email, displayName) {
  const n = displayName?.trim()
  if (n) {
    const parts = n.split(/\s+/)
    if (parts.length >= 2) {
      return `${parts[0][0] || ''}${parts[1][0] || ''}`.toUpperCase() || '?'
    }
    return n.slice(0, 2).toUpperCase() || '?'
  }
  const local = String(email).split('@')[0] || ''
  return local.slice(0, 2).toUpperCase() || '?'
}

/** @param {{ email: string, displayName?: string } | null} session */
export function getDemoAvatarLabel(session) {
  if (!session) return null
  return initialsFrom(session.email, session.displayName)
}
