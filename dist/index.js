"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startServer = startServer;
const cors_1 = __importDefault(require("cors"));
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const node_path_1 = __importDefault(require("node:path"));
const UserRoute_1 = __importDefault(require("./UserRoute"));
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '16kb' }));
app.use(express_1.default.static(node_path_1.default.join(__dirname, '..', 'public')));
app.get('/health', (_req, res) => {
    res.status(200).json({
        status: 'ok',
        database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected',
    });
});
app.get('/', (_req, res) => {
    res.json({ message: 'API is running' });
});
app.use('/api', UserRoute_1.default);
app.use((_req, res) => {
    res.status(404).json({ message: 'Route not found' });
});
app.use((error, _req, res, _next) => {
    const requestError = error;
    if (requestError.type === 'entity.parse.failed') {
        return res.status(400).json({ message: 'Request body must be valid JSON' });
    }
    if (requestError.type === 'entity.too.large') {
        return res.status(413).json({ message: 'Request body is too large' });
    }
    console.error('Unhandled request error:', error);
    return res.status(500).json({ message: 'Internal server error' });
});
function loadLocalEnvironment() {
    try {
        process.loadEnvFile();
    }
    catch (error) {
        if (error.code !== 'ENOENT') {
            throw error;
        }
    }
}
function startServer() {
    return __awaiter(this, void 0, void 0, function* () {
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
            yield mongoose_1.default.connect(mongoUri);
            console.log('Connected to MongoDB');
            app.listen(configuredPort, () => {
                console.log(`Server is running on port ${configuredPort}`);
            });
        }
        catch (_a) {
            console.error('Could not connect to MongoDB. Check MONGODB_URI and the Atlas network access list.');
            process.exitCode = 1;
        }
    });
}
if (require.main === module) {
    void startServer();
}
exports.default = app;
