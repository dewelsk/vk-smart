import { auth } from '@/auth'
import SwitchedUserBanner from './SwitchedUserBanner'

export default async function SwitchedUserBannerWrapper() {
  const session = await auth()

  // Only show banner if user is switched to candidate view
  if (!session?.user?.switchedToCandidateId || !session?.user?.switchedToName) {
    return null
  }

  return (
    <SwitchedUserBanner
      switchedToName={session.user.switchedToName}
      originalUsername={session.user.originalUsername || 'Admin'}
    />
  )
}
