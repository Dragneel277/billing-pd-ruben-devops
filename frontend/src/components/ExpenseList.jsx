import { useState } from 'react'
import api from '../api/client'
import EditExpenseModal from './EditExpenseModal'

export default function ExpenseList({ expenses, onRefresh }) {
  const [editingExpense, setEditingExpense] = useState(null)

  const toggleStatus = async (expense) => {
    const next = expense.status === 'paid' ? 'pending' : 'paid'
    await api.patch(`/expenses/${expense.id}`, { status: next })
    onRefresh()
  }

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this bill?')) return

    await api.delete(`/expenses/${id}`)
    onRefresh()
  }

  const formatCategory = (category) => {
    if (!category) return 'Other'
    return category.charAt(0).toUpperCase() + category.slice(1)
  }

  const getBadgeStyle = (status) => {
    if (status === 'paid') return styles.badgePaid
    if (status === 'overdue') return styles.badgeOverdue
    if (status === 'cancelled') return styles.badgeCancelled
    return styles.badgePending
  }

  if (expenses.length === 0) {
    return <div style={styles.empty}>No bills found.</div>
  }

  return (
    <>
      <div style={styles.card}>
        <div style={styles.header}>
          <div>
            <h3 style={styles.title}>Bills</h3>
            <p style={styles.subtitle}>View, edit, delete and update payment status.</p>
          </div>
        </div>

        <table style={styles.table}>
          <thead>
            <tr>
              {['Title', 'Entity', 'Category', 'Amount', 'Status', 'Due Date', 'Actions'].map(h => (
                <th key={h} style={styles.th}>{h}</th>
              ))}
            </tr>
          </thead>

          <tbody>
            {expenses.map(e => (
              <tr key={e.id} style={e.status === 'paid' ? styles.paidRow : {}}>
                <td style={styles.td}>{e.title}</td>
                <td style={styles.td}>{e.entity || '—'}</td>
                <td style={styles.td}>{formatCategory(e.category)}</td>
                <td style={styles.td}>€{parseFloat(e.amount).toFixed(2)}</td>

                <td style={styles.td}>
                  <span style={getBadgeStyle(e.status)}>
                    {e.status}
                  </span>
                </td>

                <td style={styles.td}>
                  {e.due_date ? e.due_date.slice(0, 10) : '—'}
                </td>

                <td style={styles.td}>
                  <button style={styles.editBtn} onClick={() => setEditingExpense(e)}>
                    Edit
                  </button>

                  <button style={styles.toggleBtn} onClick={() => toggleStatus(e)}>
                    {e.status === 'paid' ? 'Mark pending' : 'Mark paid'}
                  </button>

                  <button style={styles.deleteBtn} onClick={() => handleDelete(e.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editingExpense && (
        <EditExpenseModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onUpdated={onRefresh}
        />
      )}
    </>
  )
}

const styles = {
  card: {
    background: '#fff',
    borderRadius: '14px',
    padding: '1rem',
    boxShadow: '0 4px 12px rgba(15,23,42,0.08)',
    overflowX: 'auto'
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
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left',
    padding: '0.75rem',
    borderBottom: '2px solid #e2e8f0',
    background: '#f8fafc',
    color: '#475569',
    fontSize: '0.85rem'
  },
  td: {
    padding: '0.75rem',
    borderBottom: '1px solid #e2e8f0'
  },
  paidRow: {
    opacity: 0.65
  },
  badgePending: {
    background: '#fff7e6',
    color: '#d46b08',
    padding: '0.25rem 0.65rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  badgePaid: {
    background: '#f6ffed',
    color: '#389e0d',
    padding: '0.25rem 0.65rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  badgeOverdue: {
    background: '#fff1f0',
    color: '#cf1322',
    padding: '0.25rem 0.65rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  badgeCancelled: {
    background: '#f5f5f5',
    color: '#595959',
    padding: '0.25rem 0.65rem',
    borderRadius: '999px',
    fontSize: '0.8rem',
    fontWeight: 'bold'
  },
  editBtn: {
    marginRight: '0.4rem',
    padding: '0.35rem 0.65rem',
    background: '#0f172a',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  toggleBtn: {
    marginRight: '0.4rem',
    padding: '0.35rem 0.65rem',
    background: '#2563eb',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  deleteBtn: {
    padding: '0.35rem 0.65rem',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.8rem'
  },
  empty: {
    textAlign: 'center',
    padding: '2rem',
    color: '#64748b',
    background: '#fff',
    borderRadius: '14px',
    boxShadow: '0 4px 12px rgba(15,23,42,0.08)'
  }
}