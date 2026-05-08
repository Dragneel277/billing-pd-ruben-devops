import { useEffect, useState } from 'react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, CartesianGrid
} from 'recharts'
import api from '../api/client'

export default function AnalyticsDashboard() {
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
      setMonthly(monthlyRes.data.map(item => ({ ...item, total: Number(item.total) })))
      setYearly(yearlyRes.data.map(item => ({ ...item, total: Number(item.total) })))
      setCategories(categoriesRes.data.map(item => ({ ...item, total: Number(item.total) })))
      setTopDays(topDaysRes.data.map(item => ({ ...item, total: Number(item.total), day: item.day?.slice(0, 10) })))
    }

    fetchAnalytics()
  }, [])

  return (
    <div style={styles.wrapper}>
      <h3 style={styles.title}>Analytics</h3>

      {summary && (
        <div style={styles.summaryGrid}>
          <div style={styles.statCard}>Total<br /><strong>€{Number(summary.total).toFixed(2)}</strong></div>
          <div style={styles.statCard}>Paid<br /><strong>€{Number(summary.paid).toFixed(2)}</strong></div>
          <div style={styles.statCard}>Pending<br /><strong>€{Number(summary.pending).toFixed(2)}</strong></div>
          <div style={styles.statCard}>Overdue<br /><strong>€{Number(summary.overdue).toFixed(2)}</strong></div>
        </div>
      )}

      <div style={styles.grid}>
        <ChartCard title="Monthly Spending">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={monthly}>
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#1677ff" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Yearly Spending">
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={yearly}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="year" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="#52c41a" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Spending by Category">
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={categories} dataKey="total" nameKey="category" outerRadius={90} label>
                {categories.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Top Spending Days">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topDays}>
              <XAxis dataKey="day" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#fa8c16" />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
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

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1', '#13c2c2', '#8c8c8c']

const styles = {
  wrapper: { marginBottom: '1.5rem' },
  title: { marginBottom: '1rem' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', marginBottom: '1rem' },
  statCard: { background: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)', textAlign: 'center' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' },
  card: { background: '#fff', padding: '1rem', borderRadius: '8px', boxShadow: '0 1px 4px rgba(0,0,0,0.1)' },
  cardTitle: { marginTop: 0 }
}