const express = require('express')
const pool = require('../db/client')

const router = express.Router()

router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        COALESCE(SUM(amount), 0) AS total,
        COALESCE(SUM(amount) FILTER (WHERE status = 'paid'), 0) AS paid,
        COALESCE(SUM(amount) FILTER (WHERE status = 'pending'), 0) AS pending,
        COALESCE(SUM(amount) FILTER (WHERE status = 'overdue'), 0) AS overdue,
        COALESCE(SUM(amount) FILTER (WHERE status = 'cancelled'), 0) AS cancelled,
        COUNT(*) AS total_expenses
      FROM expenses
      WHERE user_id = $1
      `,
      [req.user.id]
    )

    return res.json(result.rows[0])
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/monthly', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        TO_CHAR(DATE_TRUNC('month', COALESCE(due_date, created_at)), 'YYYY-MM') AS month,
        COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE user_id = $1
      GROUP BY month
      ORDER BY month
      `,
      [req.user.id]
    )

    return res.json(result.rows)
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/yearly', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        TO_CHAR(DATE_TRUNC('year', COALESCE(due_date, created_at)), 'YYYY') AS year,
        COALESCE(SUM(amount), 0) AS total
      FROM expenses
      WHERE user_id = $1
      GROUP BY year
      ORDER BY year
      `,
      [req.user.id]
    )

    return res.json(result.rows)
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/categories', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        category,
        COALESCE(SUM(amount), 0) AS total,
        COUNT(*) AS count
      FROM expenses
      WHERE user_id = $1
      GROUP BY category
      ORDER BY total DESC
      `,
      [req.user.id]
    )

    return res.json(result.rows)
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

router.get('/top-days', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        COALESCE(due_date, created_at::date) AS day,
        COALESCE(SUM(amount), 0) AS total,
        COUNT(*) AS count
      FROM expenses
      WHERE user_id = $1
      GROUP BY day
      ORDER BY total DESC
      LIMIT 7
      `,
      [req.user.id]
    )

    return res.json(result.rows)
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router