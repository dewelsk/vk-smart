import { redirect } from 'next/navigation'

export default function HomePage() {
  // Natvrdo redirect na dashboard
  // Middleware sa postará o autentifikáciu
  redirect('/dashboard')
}
