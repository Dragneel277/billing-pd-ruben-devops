import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'
import ExpenseList from '../components/ExpenseList'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseFilters from '../components/ExpenseFilters'
import AnalyticsDashboard from '../components/AnalyticsDashboard'

export default function Dashboard() {
  const [expenses, setExpenses] = useState([])
  const [analyticsRefresh, setAnalyticsRefresh] = useState(0)

  const [filters, setFilters] = useState({
    status: '',
    category: '',
    search: '',
    from: '',
    to: ''
  })

  const navigate = useNavigate()
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  const fetchExpenses = useCallback(async () => {
    const params = {}

    if (filters.status) params.status = filters.status
    if (filters.category) params.category = filters.category
    if (filters.search) params.search = filters.search
    if (filters.from) params.from = filters.from
    if (filters.to) params.to = filters.to

    const { data } = await api.get('/expenses', { params })
    setExpenses(data)
  }, [filters])

  useEffect(() => {
    fetchExpenses()
  }, [fetchExpenses])

  const refreshAll = async () => {
    await fetchExpenses()
    setAnalyticsRefresh(current => current + 1)
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    navigate('/login')
  }

  const totalPending = expenses
    .filter(e => e.status === 'pending')
    .reduce((s, e) => s + parseFloat(e.amount), 0)

  const totalPaid = expenses
    .filter(e => e.status === 'paid')
    .reduce((s, e) => s + parseFloat(e.amount), 0)

  const totalOverdue = expenses
    .filter(e => e.status === 'overdue')
    .reduce((s, e) => s + parseFloat(e.amount), 0)

  const totalCancelled = expenses
    .filter(e => e.status === 'cancelled')
    .reduce((s, e) => s + parseFloat(e.amount), 0)

  return (
    <div style={styles.layout}>
      <aside style={styles.sidebar}>
        <div>
          <h2 style={styles.logo}>Billing Pro</h2>
          <p style={styles.sidebarText}>DevOps Billing Manager</p>
        </div>

        <div style={styles.sidebarInfo}>
          <span style={styles.userLabel}>Logged in as</span>
          <strong>{user.name || 'User'}</strong>
        </div>

        <button style={styles.logoutBtn} onClick={handleLogout}>
          Logout
        </button>
      </aside>

      <main style={styles.main}>
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Dashboard</h1>
            <p style={styles.subtitle}>
              Manage bills, monitor spending and analyze payment behavior.
            </p>
          </div>
        </header>

        <section style={styles.summary}>
          <SummaryCard
            label="Pending"
            value={totalPending}
            count={expenses.filter(e => e.status === 'pending').length}
            color="#f97316"
          />

          <SummaryCard
            label="Paid"
            value={totalPaid}
            count={expenses.filter(e => e.status === 'paid').length}
            color="#16a34a"
          />

          <SummaryCard
            label="Overdue"
            value={totalOverdue}
            count={expenses.filter(e => e.status === 'overdue').length}
            color="#ef4444"
          />

          <SummaryCard
            label="Cancelled"
            value={totalCancelled}
            count={expenses.filter(e => e.status === 'cancelled').length}
            color="#64748b"
          />
        </section>

        <AnalyticsDashboard refreshKey={analyticsRefresh} />

        <section style={styles.section}>
          <ExpenseForm onCreated={refreshAll} />
          <ExpenseFilters filters={filters} onChange={setFilters} />
          <ExpenseList expenses={expenses} onRefresh={refreshAll} />
        </section>
      </main>
    </div>
  )
}

function SummaryCard({ label, value, count, color }) {
  return (
    <div style={{ ...styles.summaryCard, borderTop: `4px solid ${color}` }}>
      <span style={styles.summaryLabel}>{label}</span>

      <strong style={{ ...styles.summaryAmount, color }}>
        €{value.toFixed(2)}
      </strong>

      <small style={styles.summaryCount}>{count} bills</small>
    </div>
  )
}

const styles = {
  layout: {
    minHeight: '100vh',
    display: 'flex',
    background: '#f4f7fb',
    color: '#1f2937'
  },
  sidebar: {
    width: '240px',
    background: '#0f172a',
    color: '#fff',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    position: 'sticky',
    top: 0,
    height: '100vh',
    boxSizing: 'border-box'
  },
  logo: {
    margin: 0,
    fontSize: '1.5rem'
  },
  sidebarText: {
    color: '#cbd5e1',
    fontSize: '0.9rem'
  },
  sidebarInfo: {
    background: 'rgba(255,255,255,0.08)',
    padding: '1rem',
    borderRadius: '12px'
  },
  userLabel: {
    display: 'block',
    color: '#cbd5e1',
    fontSize: '0.8rem',
    marginBottom: '0.25rem'
  },
  logoutBtn: {
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  main: {
    flex: 1,
    padding: '2rem',
    maxWidth: '1500px',
    margin: '0 auto'
  },
  header: {
    marginBottom: '1.5rem'
  },
  title: {
    margin: 0,
    fontSize: '2rem'
  },
  subtitle: {
    color: '#64748b',
    marginTop: '0.4rem'
  },
  summary: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, minmax(180px, 1fr))',
    gap: '1rem',
    marginBottom: '1.5rem'
  },
  summaryCard: {
    background: '#fff',
    padding: '1rem',
    borderRadius: '14px',
    boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  summaryLabel: {
    color: '#64748b',
    fontSize: '0.9rem'
  },
  summaryAmount: {
    fontSize: '1.6rem'
  },
  summaryCount: {
    color: '#94a3b8'
  },
  section: {
    marginTop: '1.5rem'
  }
}