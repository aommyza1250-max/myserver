import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import path from 'node:path';
import userRoutes from './UserRoute';

const app = express();

app.use(cors());
app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});

app.get('/', (_req, res) => {
    res.json({ message: 'API is running' });
});

app.use('/api', userRoutes);

app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    const requestError = error as { type?: string };
    if (requestError.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Request body must be valid JSON' });
    }

    if (requestError.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request body is too large' });
    }

    console.error('Unhandled request error:', error);
    return res.status(500).json({ message: 'Internal server error' });
});

function loadLocalEnvironment(): void {
    try {
        process.loadEnvFile();
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
        }
    }
}

export async function startServer(): Promise<void> {
    loadLocalEnvironment();

    const mongoUri = process.env.MONGODB_URI;
    const configuredPort = Number(process.env.PORT || 3000);

    if (!mongoUri) {
        console.error('MONGODB_URI is missing. Copy .env.example to .env and set your Atlas connection string.');
        process.exitCode = 1;
        return;
    }

    if (!Number.isInteger(configuredPort) || configuredPort < 1 || configuredPort > 65535) {
        console.error('PORT must be a number between 1 and 65535.');
        process.exitCode = 1;
        return;
    }

    try {
        await mongoose.connect(mongoUri);
        console.log('Connected to MongoDB');
        app.listen(configuredPort, () => {
            console.log(`Server is running on port ${configuredPort}`);
        });
    } catch {
        console.error('Could not connect to MongoDB. Check MONGODB_URI and the Atlas network access list.');
        process.exitCode = 1;
    }
}

if (require.main === module) {
    void startServer();
}

export default app;
