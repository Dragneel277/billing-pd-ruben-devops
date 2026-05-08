import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import api from '../api/client'

export default function Register() {
  const [form, setForm] = useState({ name: '', password: '' })
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await api.post('/auth/register', form)
      navigate('/login')
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed')
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.leftPanel}>
        <div>
          <h1 style={styles.brand}>Billing Pro</h1>
          <p style={styles.tagline}>
            Create your account and start managing bills, payment status, categories and spending analytics.
          </p>
        </div>

        <div style={styles.features}>
          <span>Multi-VM deployment</span>
          <span>PostgreSQL persistence</span>
          <span>Docker + Ansible automation</span>
        </div>
      </div>

      <div style={styles.rightPanel}>
        <div style={styles.card}>
          <p style={styles.smallTitle}>Get started</p>
          <h2 style={styles.title}>Create your account</h2>

          {error && <p style={styles.error}>{error}</p>}

          <form onSubmit={handleSubmit}>
            <label style={styles.label}>Username</label>
            <input
              style={styles.input}
              placeholder="Choose a username"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />

            <label style={styles.label}>Password</label>
            <input
              style={styles.input}
              type="password"
              placeholder="Choose a password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />

            <button style={styles.button} type="submit">
              Register
            </button>
          </form>

          <p style={styles.footerText}>
            Already have an account? <Link style={styles.link} to="/login">Login</Link>
          </p>
        </div>
      </div>
    </div>
  )
}

const styles = {
  page: {
    minHeight: '100vh',
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    background: '#f4f7fb',
    color: '#1f2937'
  },
  leftPanel: {
    background: 'linear-gradient(135deg, #0f172a, #15803d)',
    color: '#fff',
    padding: '4rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  },
  brand: {
    fontSize: '3rem',
    margin: 0
  },
  tagline: {
    fontSize: '1.1rem',
    maxWidth: '520px',
    color: '#dcfce7',
    lineHeight: 1.6
  },
  features: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    color: '#bbf7d0'
  },
  rightPanel: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem'
  },
  card: {
    width: '100%',
    maxWidth: '420px',
    background: '#fff',
    padding: '2rem',
    borderRadius: '18px',
    boxShadow: '0 20px 45px rgba(15,23,42,0.12)'
  },
  smallTitle: {
    color: '#16a34a',
    fontWeight: 'bold',
    margin: 0
  },
  title: {
    marginTop: '0.4rem',
    marginBottom: '1.5rem'
  },
  label: {
    display: 'block',
    marginBottom: '0.4rem',
    fontWeight: 'bold',
    fontSize: '0.9rem'
  },
  input: {
    display: 'block',
    width: '100%',
    marginBottom: '1rem',
    padding: '0.75rem',
    boxSizing: 'border-box',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    fontSize: '1rem'
  },
  button: {
    width: '100%',
    padding: '0.8rem',
    background: '#16a34a',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold',
    fontSize: '1rem',
    marginTop: '0.5rem'
  },
  error: {
    color: '#b91c1c',
    background: '#fee2e2',
    padding: '0.75rem',
    borderRadius: '10px',
    marginBottom: '1rem'
  },
  footerText: {
    textAlign: 'center',
    marginTop: '1.2rem',
    color: '#64748b'
  },
  link: {
    color: '#16a34a',
    fontWeight: 'bold'
  }
}