import express from 'express';
import cors from 'cors'
import registerRoutes from "./routes/auth/register.routes.js"
import loginRoutes from "./routes/auth/login.routes.js"
import cookieParser from "cookie-parser";
import profileRoutes from "./routes/user/profile.routes.js"
import fileRoutes from "./routes/file/file.routes.js"

const app = express()

app.use(express.json())
app.use(cors({
    origin: [
        "http://localhost:5173",  // React frontend
        "http://localhost:3000",  // Other dev servers
    ],
    credentials: true,
}))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())
app.use('/api/v1', registerRoutes);
app.use('/api/v1', loginRoutes);
app.use('/api/v1', profileRoutes);
app.use('/api/v1', fileRoutes);


export default app;   