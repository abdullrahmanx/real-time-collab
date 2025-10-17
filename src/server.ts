import express from 'express';
import http from 'http';
import dotenv from 'dotenv';
import cors from 'cors';
import mongoose from 'mongoose';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';
import compression from 'compression';
import xss from 'xss-clean'
import authRoutes from './routes/authRoutes';
import workspaceRoutes from './routes/workspaceRoutes';
import documentRoutes from './routes/documentRoutes';
import folderRoutes from './routes/folderRoutes';
import  { errorHandler }  from './middlewares/errorHandler';
import { initializeSocketServer } from './socket/indexSocket';
import { limiter, authLimiter } from './middlewares/rateLimit';

dotenv.config();

const app = express();
const server = http.createServer(app);

mongoose.connect(process.env.MONGO_URI as string).then(() => {
    console.log('Mongo Connected');
}).catch((error) => {
    console.log('Error connecting', error.message);
});
app.use(helmet()); 
app.use(cors({
    origin: process.env.FRONTEND_URL as string,
    credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(xss());
app.use(hpp());
app.use(mongoSanitize());
app.use(compression());

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({
        success: true,
        message: 'Server is running',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV
    });
});

app.use('/auth', authRoutes);
app.use('/workspaces', limiter, workspaceRoutes);
app.use('/workspaces', limiter, documentRoutes);
app.use('/workspaces', limiter, folderRoutes);
app.use(errorHandler);

initializeSocketServer(server);

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log('Server running on PORT', PORT);
    console.log('Socket.io ready for connections');
});