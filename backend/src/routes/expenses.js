const express = require('express')
const pool    = require('../db/client')

const router = express.Router()

router.get('/', async (req, res) => {
  const { status, category, from, to, search } = req.query
  const conditions = ['user_id = $1']
  const params     = [req.user.id]

  if (status) {
    params.push(status)
    conditions.push(`status = $${params.length}`)
  }

  if (category) {
    params.push(category)
    conditions.push(`category = $${params.length}`)
  }

  if (from) {
    params.push(from)
    conditions.push(`due_date >= $${params.length}`)
  }

  if (to) {
    params.push(to)
    conditions.push(`due_date <= $${params.length}`)
  }

  if (search) {
    params.push(`%${search}%`)
    conditions.push(`(title ILIKE $${params.length} OR entity ILIKE $${params.length} OR description ILIKE $${params.length})`)
  }

  try {
    const result = await pool.query(
      `SELECT * FROM expenses WHERE ${conditions.join(' AND ')} ORDER BY created_at DESC`,
      params
    )
const updatedRows = result.rows.map(expense => {
  const today = new Date()
  const dueDate = expense.due_date ? new Date(expense.due_date) : null

  if (
    expense.status === 'pending' &&
    dueDate &&
    dueDate < today
  ) {
    return {
      ...expense,
      status: 'overdue'
    }
  }

  return expense
})

return res.json(updatedRows)
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.post('/', async (req, res) => {
  const { title, amount, entity, description, due_date, status, category } = req.body

  if (!title || amount === undefined) {
    return res.status(400).json({ error: 'title and amount are required' })
  }

  try {
    const result = await pool.query(
      `INSERT INTO expenses (user_id, title, amount, entity, description, due_date, status, category)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [
        req.user.id,
        title,
        amount,
        entity || null,
        description || null,
        due_date || null,
        status || 'pending',
        category || 'other'
      ]
    )

    return res.status(201).json(result.rows[0])
  } catch (err) {
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Invalid status value' })
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.patch('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const check = await pool.query(
      'SELECT id FROM expenses WHERE id = $1 AND user_id = $2',
      [id, req.user.id]
    )

    if (check.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    const { title, amount, entity, description, due_date, status, category } = req.body
    const fields = []
    const params = []

    if (title       !== undefined) { params.push(title);       fields.push(`title = $${params.length}`) }
    if (amount      !== undefined) { params.push(amount);      fields.push(`amount = $${params.length}`) }
    if (entity      !== undefined) { params.push(entity);      fields.push(`entity = $${params.length}`) }
    if (description !== undefined) { params.push(description); fields.push(`description = $${params.length}`) }
    if (due_date    !== undefined) { params.push(due_date);    fields.push(`due_date = $${params.length}`) }
    if (status      !== undefined) { params.push(status);      fields.push(`status = $${params.length}`) }
    if (category    !== undefined) { params.push(category);    fields.push(`category = $${params.length}`) }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' })
    }

    params.push(id)
    params.push(req.user.id)

    const result = await pool.query(
      `UPDATE expenses
         SET ${fields.join(', ')}, updated_at = now()
       WHERE id = $${params.length - 1} AND user_id = $${params.length}
       RETURNING *`,
      params
    )

    return res.json(result.rows[0])
  } catch (err) {
    if (err.code === '23514') {
      return res.status(400).json({ error: 'Invalid status value' })
    }

    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.delete('/:id', async (req, res) => {
  const { id } = req.params

  try {
    const result = await pool.query(
      'DELETE FROM expenses WHERE id = $1 AND user_id = $2 RETURNING id',
      [id, req.user.id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' })
    }

    return res.json({ message: 'Expense deleted' })
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router