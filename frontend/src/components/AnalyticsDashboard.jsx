import { useEffect, useState } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts'
import api from '../api/client'

export default function AnalyticsDashboard({ refreshKey }) {
  const [monthly, setMonthly] = useState([])
  const [yearly, setYearly] = useState([])
  const [categories, setCategories] = useState([])
  const [topDays, setTopDays] = useState([])
  const [summary, setSummary] = useState(null)

  useEffect(() => {
    async function fetchAnalytics() {
      const [summaryRes, monthlyRes, yearlyRes, categoriesRes, topDaysRes] = await Promise.all([
        api.get('/analytics/summary'),
        api.get('/analytics/monthly'),
        api.get('/analytics/yearly'),
        api.get('/analytics/categories'),
        api.get('/analytics/top-days')
      ])

      setSummary(summaryRes.data)

      setMonthly(monthlyRes.data.map(item => ({
        ...item,
        total: Number(item.total)
      })))

      setYearly(yearlyRes.data.map(item => ({
        ...item,
        total: Number(item.total)
      })))

      setCategories(categoriesRes.data.map(item => ({
        ...item,
        total: Number(item.total),
        count: Number(item.count)
      })))

      setTopDays(topDaysRes.data.map(item => ({
        ...item,
        total: Number(item.total),
        count: Number(item.count),
        day: item.day?.slice(0, 10)
      })))
    }

    fetchAnalytics()
  }, [refreshKey])

  return (
    <div style={styles.wrapper}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>Analytics Dashboard</h3>
          <p style={styles.subtitle}>Visual overview of spending, categories and payment behavior.</p>
        </div>
      </div>

      {summary && (
        <div style={styles.summaryGrid}>
          <MiniStat label="Total" value={summary.total} />
          <MiniStat label="Paid" value={summary.paid} />
          <MiniStat label="Pending" value={summary.pending} />
          <MiniStat label="Overdue" value={summary.overdue} />
        </div>
      )}

      <div style={styles.grid}>
        <ChartCard title="Monthly Spending">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthly}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
              <Bar dataKey="total" fill="#2563eb" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Yearly Spending">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
              <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spending by Category">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={categories}
                dataKey="total"
                nameKey="category"
                outerRadius={90}
                label
              >
                {categories.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Spending Days">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topDays}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip formatter={(value) => `€${Number(value).toFixed(2)}`} />
              <Bar dataKey="total" fill="#f97316" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  )
}

function MiniStat({ label, value }) {
  return (
    <div style={styles.statCard}>
      <span style={styles.statLabel}>{label}</span>
      <strong style={styles.statValue}>€{Number(value).toFixed(2)}</strong>
    </div>
  )
}

function ChartCard({ title, children }) {
  return (
    <div style={styles.card}>
      <h4 style={styles.cardTitle}>{title}</h4>
      {children}
    </div>
  )
}

const COLORS = ['#2563eb', '#16a34a', '#f59e0b', '#ef4444', '#7c3aed', '#0891b2', '#64748b']

const styles = {
  wrapper: {
    marginBottom: '1.5rem'
  },
  header: {
    marginBottom: '1rem'
  },
  title: {
    margin: 0
  },
  subtitle: {
    margin: '0.25rem 0 0',
    color: '#64748b'
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
    gap: '1rem',
    marginBottom: '1rem'
  },
  statCard: {
    background: '#fff',
    padding: '1rem',
    borderRadius: '14px',
    boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem'
  },
  statLabel: {
    color: '#64748b',
    fontSize: '0.9rem'
  },
  statValue: {
    fontSize: '1.3rem',
    color: '#0f172a'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
    gap: '1rem'
  },
  card: {
    background: '#fff',
    padding: '1rem',
    borderRadius: '14px',
    boxShadow: '0 4px 12px rgba(15,23,42,0.08)'
  },
  cardTitle: {
    marginTop: 0,
    marginBottom: '1rem'
  }
}