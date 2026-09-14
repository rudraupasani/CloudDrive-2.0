import env from 'dotenv'
import app from './src/app.js'
import connectDB from './src/config/db.js'

env.config()
connectDB();


app.listen(3000, (req, res) => {
    console.log("Server is Running on 3000")
})