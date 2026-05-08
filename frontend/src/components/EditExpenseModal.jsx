import { useState } from 'react'
import api from '../api/client'

export default function EditExpenseModal({ expense, onClose, onUpdated }) {
  const [form, setForm] = useState({
    title: expense.title || '',
    amount: expense.amount || '',
    entity: expense.entity || '',
    description: expense.description || '',
    due_date: expense.due_date ? expense.due_date.slice(0, 10) : '',
    status: expense.status || 'pending',
    category: expense.category || 'other'
  })

  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    try {
      await api.patch(`/expenses/${expense.id}`, {
        ...form,
        amount: parseFloat(form.amount)
      })

      onUpdated()
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update bill')
    }
  }

  const update = (key, value) => {
    setForm({ ...form, [key]: value })
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Edit Bill</h3>
            <p style={styles.subtitle}>Update bill information and payment status.</p>
          </div>

          <button style={styles.closeBtn} onClick={onClose}>
            ×
          </button>
        </div>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Title</label>
          <input
            style={styles.input}
            value={form.title}
            onChange={(e) => update('title', e.target.value)}
            required
          />

          <label style={styles.label}>Amount</label>
          <input
            style={styles.input}
            type="number"
            step="0.01"
            min="0"
            value={form.amount}
            onChange={(e) => update('amount', e.target.value)}
            required
          />

          <label style={styles.label}>Entity</label>
          <input
            style={styles.input}
            value={form.entity}
            onChange={(e) => update('entity', e.target.value)}
          />

          <label style={styles.label}>Description</label>
          <input
            style={styles.input}
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
          />

          <label style={styles.label}>Due Date</label>
          <input
            style={styles.input}
            type="date"
            value={form.due_date}
            onChange={(e) => update('due_date', e.target.value)}
          />

          <label style={styles.label}>Category</label>
          <select
            style={styles.input}
            value={form.category}
            onChange={(e) => update('category', e.target.value)}
          >
            <option value="rent">Rent</option>
            <option value="utilities">Utilities</option>
            <option value="internet">Internet</option>
            <option value="services">Services</option>
            <option value="food">Food</option>
            <option value="transport">Transport</option>
            <option value="other">Other</option>
          </select>

          <label style={styles.label}>Status</label>
          <select
            style={styles.input}
            value={form.status}
            onChange={(e) => update('status', e.target.value)}
          >
            <option value="pending">Pending</option>
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <div style={styles.actions}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>

            <button type="submit" style={styles.saveBtn}>
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    inset: 0,
    background: 'rgba(15,23,42,0.65)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  },
  modal: {
    width: '100%',
    maxWidth: '520px',
    maxHeight: '90vh',
    overflowY: 'auto',
    background: '#fff',
    borderRadius: '16px',
    padding: '1.5rem',
    boxShadow: '0 25px 60px rgba(0,0,0,0.25)'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '1rem',
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
  closeBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    border: 'none',
    background: '#f1f5f9',
    cursor: 'pointer',
    fontSize: '1.5rem'
  },
  form: {
    display: 'grid',
    gap: '0.6rem'
  },
  label: {
    fontWeight: 'bold',
    fontSize: '0.9rem',
    color: '#475569'
  },
  input: {
    padding: '0.65rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1'
  },
  actions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1rem'
  },
  cancelBtn: {
    padding: '0.65rem 1rem',
    background: '#e2e8f0',
    color: '#1f2937',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  },
  saveBtn: {
    padding: '0.65rem 1rem',
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