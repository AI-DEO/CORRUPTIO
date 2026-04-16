import { useState, FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../stores/authStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const login = useAuthStore((s) => s.login)
  const navigate = useNavigate()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="font-display text-4xl font-black text-accent-gold tracking-wide">
            CORRUPTIO
          </h1>
          <p className="text-text-secondary mt-2 font-display italic">
            Porto Mendacio
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-bg-secondary rounded-xl p-8 shadow-2xl border border-bg-panel/50"
        >
          <h2 className="text-xl font-semibold mb-6">Connexion</h2>

          {error && (
            <div className="mb-4 p-3 bg-accent-red/20 border border-accent-red/50 rounded-lg text-sm text-accent-red">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="block text-sm text-text-secondary mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-bg-primary border border-bg-panel rounded-lg focus:outline-none focus:border-accent-teal transition"
                placeholder="votre@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-text-secondary mb-1">
                Mot de passe
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-bg-primary border border-bg-panel rounded-lg focus:outline-none focus:border-accent-teal transition"
                placeholder="••••••••"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-6 py-3 bg-accent-red hover:bg-accent-red/80 disabled:opacity-50 rounded-lg font-semibold transition"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>

          <p className="mt-4 text-center text-sm text-text-secondary">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-accent-teal hover:underline">
              S'inscrire
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
