import express, { Request, Response } from 'express';
import cors from 'cors';
import prisma from './prisma';

//ROUTES IMPORTS
import apiRoutes from './routes/api.routes';

// EXPRESS APP SETUP
const app = express();
const PORT = process.env.PORT || 3000;

// MIDDLEWARES
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API ROUTES
app.use('/', apiRoutes);

// 404 HANDLER
app.use((req: Request, res: Response) => {
    res.status(404).json({ error: `Route ${req.originalUrl} not found` });
});

// START SERVER
async function startServer() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected');

        app.listen(PORT, () => {
            console.log(`🚀 Server running on http://localhost:${PORT}`);
        });
    } catch (error) {
        console.error('❌ Database connection failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    startServer();
}

export default app;
