export default function ExpenseFilters({ filters, onChange }) {
  const set = (key, value) => onChange({ ...filters, [key]: value })

  return (
    <div style={styles.card}>
      <strong>Filters:</strong>

      <input
        style={{ ...styles.input, minWidth: '260px' }}
        type="text"
        placeholder="Search title, entity or description"
        value={filters.search}
        onChange={(e) => set('search', e.target.value)}
      />

      <select
        style={styles.input}
        value={filters.status}
        onChange={(e) => set('status', e.target.value)}
      >
        <option value="">All statuses</option>
        <option value="pending">Pending</option>
        <option value="paid">Paid</option>
        <option value="overdue">Overdue</option>
        <option value="cancelled">Cancelled</option>
      </select>

      <select
        style={styles.input}
        value={filters.category}
        onChange={(e) => set('category', e.target.value)}
      >
        <option value="">All categories</option>
        <option value="rent">Rent</option>
        <option value="utilities">Utilities</option>
        <option value="internet">Internet</option>
        <option value="services">Services</option>
        <option value="food">Food</option>
        <option value="transport">Transport</option>
        <option value="other">Other</option>
      </select>

      <label style={styles.label}>From</label>
      <input
        style={styles.input}
        type="date"
        value={filters.from}
        onChange={(e) => set('from', e.target.value)}
      />

      <label style={styles.label}>To</label>
      <input
        style={styles.input}
        type="date"
        value={filters.to}
        onChange={(e) => set('to', e.target.value)}
      />

      <button
        style={styles.clearBtn}
        onClick={() => onChange({ status: '', category: '', search: '', from: '', to: '' })}
      >
        Clear
      </button>
    </div>
  )
}

const styles = {
  card: {
    background: '#fff',
    padding: '0.9rem 1rem',
    borderRadius: '14px',
    marginBottom: '1rem',
    display: 'flex',
    gap: '0.6rem',
    alignItems: 'center',
    flexWrap: 'wrap',
    boxShadow: '0 4px 12px rgba(15,23,42,0.08)'
  },
  input: {
    padding: '0.5rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1'
  },
  label: {
    fontWeight: 'bold',
    color: '#475569'
  },
  clearBtn: {
    padding: '0.5rem 0.9rem',
    background: '#ef4444',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 'bold'
  }
}