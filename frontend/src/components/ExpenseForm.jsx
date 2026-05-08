import { useState } from 'react'
import api from '../api/client'

const empty = {
  title: '',
  amount: '',
  entity: '',
  description: '',
  due_date: '',
  status: 'pending',
  category: 'other'
}

export default function ExpenseForm({ onCreated }) {
  const [form, setForm] = useState(empty)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await api.post('/expenses', {
        ...form,
        amount: parseFloat(form.amount)
      })

      setForm(empty)
      onCreated()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create bill')
    }
  }

  const field = (key, placeholder, type = 'text') => (
    <input
      style={styles.input}
      type={type}
      placeholder={placeholder}
      value={form[key]}
      onChange={(e) => setForm({ ...form, [key]: e.target.value })}
      required={key === 'title' || key === 'amount'}
      step={type === 'number' ? '0.01' : undefined}
      min={type === 'number' ? '0' : undefined}
    />
  )

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h3 style={styles.title}>New Bill</h3>
          <p style={styles.subtitle}>Register a new expense or invoice.</p>
        </div>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      <form onSubmit={handleSubmit} style={styles.row}>
        {field('title', 'Title *')}
        {field('amount', 'Amount *', 'number')}
        {field('entity', 'Entity')}
        {field('description', 'Description')}
        {field('due_date', 'Due date', 'date')}

        <select
          style={styles.input}
          value={form.category}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
        >
          <option value="rent">Rent</option>
          <option value="utilities">Utilities</option>
          <option value="internet">Internet</option>
          <option value="services">Services</option>
          <option value="food">Food</option>
          <option value="transport">Transport</option>
          <option value="other">Other</option>
        </select>

        <select
          style={styles.input}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="overdue">Overdue</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <button style={styles.button} type="submit">
          Add Bill
        </button>
      </form>
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    padding: '1.2rem',
    borderRadius: '14px',
    marginBottom: '1rem',
    boxShadow: '0 4px 12px rgba(15,23,42,0.08)'
  },
  header: {
    marginBottom: '1rem'
  },
  title: {
    margin: 0
  },
  subtitle: {
    margin: '0.25rem 0 0',
    color: '#64748b',
    fontSize: '0.9rem'
  },
  row: {
    display: 'flex',
    gap: '0.6rem',
    flexWrap: 'wrap',
    alignItems: 'center'
  },
  input: {
    padding: '0.55rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    minWidth: '140px',
    flex: 1
  },
  button: {
    padding: '0.6rem 1rem',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  error: {
    color: '#b91c1c',
    background: '#fee2e2',
    padding: '0.75rem',
    borderRadius: '8px'
  }
}