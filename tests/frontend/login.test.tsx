import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import AdminLoginPage from '@/app/admin/login/page'

// Mock NextAuth
vi.mock('next-auth/react', () => ({
  signIn: vi.fn(),
}))

// Mock Next.js router
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

describe('Admin Login Page', () => {
  const mockPush = vi.fn()
  const mockRefresh = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    ;(useRouter as any).mockReturnValue({
      push: mockPush,
      refresh: mockRefresh,
    })
  })

  it('should render login form', () => {
    render(<AdminLoginPage />)

    expect(screen.getByText('VK Smart')).toBeInTheDocument()
    expect(screen.getByText('Prihlásenie do systému')).toBeInTheDocument()
    expect(screen.getByLabelText(/email alebo užívateľské meno/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/heslo/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /prihlásiť sa/i })).toBeInTheDocument()
  })

  it('should show validation errors for empty fields', async () => {
    render(<AdminLoginPage />)

    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/email alebo užívateľské meno je povinné/i)).toBeInTheDocument()
      expect(screen.getByText(/heslo je povinné/i)).toBeInTheDocument()
    })
  })

  it('should not submit form when fields are empty', async () => {
    render(<AdminLoginPage />)

    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(signIn).not.toHaveBeenCalled()
    })
  })

  it('should call signIn with correct credentials', async () => {
    ;(signIn as any).mockResolvedValue({ error: null, url: '/admin/dashboard' })

    render(<AdminLoginPage />)

    const loginInput = screen.getByLabelText(/email alebo užívateľské meno/i)
    const passwordInput = screen.getByLabelText(/heslo/i)
    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })

    fireEvent.change(loginInput, { target: { value: 'superadmin@retry.sk' } })
    fireEvent.change(passwordInput, { target: { value: 'Hackaton25' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(signIn).toHaveBeenCalledWith('credentials', {
        redirect: false,
        login: 'superadmin@retry.sk',
        password: 'Hackaton25',
      })
    })
  })

  it('should show error message on failed login', async () => {
    ;(signIn as any).mockResolvedValue({ error: 'Invalid credentials' })

    render(<AdminLoginPage />)

    const loginInput = screen.getByLabelText(/email alebo užívateľské meno/i)
    const passwordInput = screen.getByLabelText(/heslo/i)
    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })

    fireEvent.change(loginInput, { target: { value: 'wrong@email.sk' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/nesprávne prihlasovacie údaje/i)).toBeInTheDocument()
    })
  })

  it('should redirect to dashboard on successful login', async () => {
    ;(signIn as any).mockResolvedValue({ error: null, url: '/admin/dashboard' })

    render(<AdminLoginPage />)

    const loginInput = screen.getByLabelText(/email alebo užívateľské meno/i)
    const passwordInput = screen.getByLabelText(/heslo/i)
    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })

    fireEvent.change(loginInput, { target: { value: 'superadmin@retry.sk' } })
    fireEvent.change(passwordInput, { target: { value: 'Hackaton25' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith('/admin/dashboard')
      expect(mockRefresh).toHaveBeenCalled()
    })
  })

  it('should show loading state during login', async () => {
    ;(signIn as any).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null }), 100)
        )
    )

    render(<AdminLoginPage />)

    const loginInput = screen.getByLabelText(/email alebo užívateľské meno/i)
    const passwordInput = screen.getByLabelText(/heslo/i)
    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })

    fireEvent.change(loginInput, { target: { value: 'test@test.sk' } })
    fireEvent.change(passwordInput, { target: { value: 'test123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(screen.getByText(/prihlasovanie.../i)).toBeInTheDocument()
    })
  })

  it('should disable submit button during loading', async () => {
    ;(signIn as any).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ error: null }), 100)
        )
    )

    render(<AdminLoginPage />)

    const loginInput = screen.getByLabelText(/email alebo užívateľské meno/i)
    const passwordInput = screen.getByLabelText(/heslo/i)
    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })

    fireEvent.change(loginInput, { target: { value: 'test@test.sk' } })
    fireEvent.change(passwordInput, { target: { value: 'test123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(submitButton).toBeDisabled()
    })
  })

  it('should render remember me checkbox', () => {
    render(<AdminLoginPage />)

    const rememberMeCheckbox = screen.getByLabelText(/zapamätať si ma/i)
    expect(rememberMeCheckbox).toBeInTheDocument()
    expect(rememberMeCheckbox).not.toBeChecked()
  })

  it('should toggle remember me checkbox', () => {
    render(<AdminLoginPage />)

    const rememberMeCheckbox = screen.getByLabelText(/zapamätať si ma/i) as HTMLInputElement
    expect(rememberMeCheckbox.checked).toBe(false)

    fireEvent.click(rememberMeCheckbox)
    expect(rememberMeCheckbox.checked).toBe(true)

    fireEvent.click(rememberMeCheckbox)
    expect(rememberMeCheckbox.checked).toBe(false)
  })

  it('should render forgot password link', () => {
    render(<AdminLoginPage />)

    const forgotPasswordLink = screen.getByText(/zabudli ste heslo/i)
    expect(forgotPasswordLink).toBeInTheDocument()
    expect(forgotPasswordLink).toHaveAttribute('href', '#')
  })

  it('should render footer text', () => {
    render(<AdminLoginPage />)

    expect(
      screen.getByText(/© 2025 VK Smart - Digitalizácia výberových konaní/i)
    ).toBeInTheDocument()
  })

  it('should handle network errors gracefully', async () => {
    ;(signIn as any).mockRejectedValue(new Error('Network error'))

    render(<AdminLoginPage />)

    const loginInput = screen.getByLabelText(/email alebo užívateľské meno/i)
    const passwordInput = screen.getByLabelText(/heslo/i)
    const submitButton = screen.getByRole('button', { name: /prihlásiť sa/i })

    fireEvent.change(loginInput, { target: { value: 'test@test.sk' } })
    fireEvent.change(passwordInput, { target: { value: 'test123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(
        screen.getByText(/nastala chyba pri prihlasovaní/i)
      ).toBeInTheDocument()
    })
  })
})
