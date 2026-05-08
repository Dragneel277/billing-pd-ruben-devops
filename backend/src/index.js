require('dotenv').config()
const express = require('express')
const authRouter = require('./routes/auth')
const expensesRouter = require('./routes/expenses')
const analyticsRoutes = require('./routes/analytics')
const auth = require('./middleware/auth')

const app = express()

app.use(express.json())

app.use('/auth', authRouter)
app.use('/expenses', auth, expensesRouter)
app.use('/analytics', auth, analyticsRoutes)

const PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log(`Backend running on port ${PORT}`))