import express from 'express';
import cors from 'cors'

import authRoutes from './routes/authRoutes.ts'
import checkoutRoutes from './routes/checkoutRoute.ts'
import productRoutes from './routes/productRoutes.ts'

import {notFound, errorHandler} from './middleware/errorMiddleware.js'

const app = express()

app.use(express.json())

app.use(
    cors({
        origin: process.env.CLIENT_URL,
        credentials:true
    })
)

app.use('/api/auth',authRoutes)
app.use('/api/checkout',checkoutRoutes)
app.use('/api/product',productRoutes)

app.use(notFound)
app.use(errorHandler)

export default app;