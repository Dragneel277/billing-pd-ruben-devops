require('dotenv').config()
const express = require('express')
const pool = require('./db/client')
const authRouter = require('./routes/auth')
const expensesRouter = require('./routes/expenses')
const analyticsRoutes = require('./routes/analytics')
const auth = require('./middleware/auth')

const app = express()

app.use(express.json())

app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1')

    return res.json({
      status: 'ok',
      service: 'billing-backend',
      database: 'connected'
    })
  } catch (err) {
    console.error('Health check failed:', err)

    return res.status(500).json({
      status: 'error',
      service: 'billing-backend',
      database: 'disconnected'
    })
  }
})

app.use('/auth', authRouter)
app.use('/expenses', auth, expensesRouter)
app.use('/analytics', auth, analyticsRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))