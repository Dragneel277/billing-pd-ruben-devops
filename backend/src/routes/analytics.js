const express = require('express')
const pool = require('../db/client')

const router = express.Router()

const dynamicStatusSql = `
  CASE
    WHEN status = 'pending' AND due_date IS NOT NULL AND due_date < CURRENT_DATE THEN 'overdue'
    ELSE status
  END
`

router.get('/summary', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        COALESCE(SUM(amount), 0) AS total,
        COALESCE(SUM(amount) FILTER (WHERE computed_status = 'paid'), 0) AS paid,
        COALESCE(SUM(amount) FILTER (WHERE computed_status = 'pending'), 0) AS pending,
        COALESCE(SUM(amount) FILTER (WHERE computed_status = 'overdue'), 0) AS overdue,
        COALESCE(SUM(amount) FILTER (WHERE computed_status = 'cancelled'), 0) AS cancelled,
        COUNT(*) AS total_expenses
      FROM (
        SELECT amount, ${dynamicStatusSql} AS computed_status
        FROM expenses
        WHERE user_id = $1
      ) AS computed_expenses
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
        AND status != 'cancelled'
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
        AND status != 'cancelled'
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
        AND status != 'cancelled'
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
        AND status != 'cancelled'
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

router.get('/status-summary', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        computed_status AS status,
        COUNT(*) AS count,
        COALESCE(SUM(amount), 0) AS total
      FROM (
        SELECT amount, ${dynamicStatusSql} AS computed_status
        FROM expenses
        WHERE user_id = $1
      ) AS computed_expenses
      GROUP BY computed_status
      ORDER BY computed_status
      `,
      [req.user.id]
    )

    return res.json(result.rows)
  } catch {
    return res.status(500).json({ error: 'Internal server error' })
  }
})

module.exports = router