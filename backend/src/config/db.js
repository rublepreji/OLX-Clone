import mongoose from "mongoose"
import dotenv from 'dotenv'

dotenv.config()

async function connectDB() {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('mongoDB connected')
}

export default connectDB;