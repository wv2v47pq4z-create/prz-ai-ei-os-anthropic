import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import path from 'path';
import { createMesh } from './dist/lib/mesh';

const PORT = 3333;

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Serve static frontend
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

// Initialize Mesh
const mesh = createMesh();

// Let's create an interception to emit live messages to the frontend.
// The easiest way without modifying mesh.ts heavily is to wrap dispatch.
const originalDispatch = mesh.dispatch.bind(mesh);
mesh.dispatch = async (intent: string, feedback?: any) => {
    io.emit('mesh:intent', { intent, timestamp: Date.now() });
    try {
        const result = await originalDispatch(intent, feedback);
        io.emit('mesh:result', result);
        return result;
    } catch (err: any) {
        io.emit('mesh:error', { error: err.message, intent });
        throw err;
    }
};

let lastMessageCount = -1;

// Poll the mesh state every second and broadcast to all connected clients
setInterval(() => {
    const state = mesh.getMeshState();
    io.emit('mesh:state', state);

    // To emit the newest messages we can fetch the total logs
    // Unfortunately mesh doesn't expose the messageLog natively publicly.
    // However, the intent and result are already emitted via interception.
}, 1000);

io.on('connection', (socket) => {
    console.log(`[+] Client connected: ${socket.id}`);

    // Send the initial state
    socket.emit('mesh:state', mesh.getMeshState());

    socket.on('dispatch', async (data) => {
        try {
            console.log(`[Mesh] Received task: ${data.intent}`);
            await mesh.dispatch(data.intent);
        } catch (err) {
            console.error('[Mesh Error]', err);
        }
    });

    socket.on('workflow', async (data) => {
        try {
            console.log(`[Workflow] Triggering workflow for task: ${data.task}`);
            // Dynamically load workflow-runner to prevent blocking the event loop entirely
            const { runMeshWorkflow } = require('./dist/lib/mesh-workflow');
            const outputDir = path.resolve(__dirname, 'mesh-output');

            io.emit('workflow:start', { task: data.task });
            const result = await runMeshWorkflow(mesh, data.task, outputDir);
            io.emit('workflow:complete', result);
        } catch (err: any) {
            console.error('[Workflow Error]', err);
            io.emit('workflow:error', { error: err.message });
        }
    });

    socket.on('disconnect', () => {
        console.log(`[-] Client disconnected: ${socket.id}`);
    });
});

server.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════════╗
║   🌀 PRZ-OS v3.0 — Mesh Nexus Server                         ║
║   Listening on http://localhost:${PORT}                           ║
╚══════════════════════════════════════════════════════════════╝
`);
});
