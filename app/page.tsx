import { redirect } from 'next/navigation'

export default function HomePage() {
  // Redirect na admin login
  redirect('/admin/login')
}
