// Enhanced LANturn Backend with Authentication
require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2/promise');
const wol = require('wol');
const { exec } = require('child_process');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const app = express();

// CORS: configurable allowed origins. Use ALLOWED_ORIGINS env var (comma-separated)
// Example: ALLOWED_ORIGINS=http://localhost:3000,https://app.example.com,http://192.0.2.12
const rawAllowed = process.env.ALLOWED_ORIGINS || `${process.env.FRONTEND_URL || 'http://localhost:3000'}`;
const allowedOrigins = rawAllowed.split(',').map(s => s.trim()).filter(Boolean);

app.use(cors({
    origin: function(origin, callback) {
        // allow requests with no origin (curl, mobile apps, same-origin)
        if (!origin) return callback(null, true);
        // allow wildcard
        if (allowedOrigins.indexOf('*') !== -1) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1) {
            return callback(null, true);
        }
        return callback(new Error('CORS policy does not allow access from the specified Origin.'), false);
    },
    credentials: true
}));

app.use(bodyParser.json());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';

// Database connection
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'power_management',
    port: process.env.DB_PORT || 3306
};

let db;

async function initDb() {
    try {
        db = await mysql.createConnection(dbConfig);
        console.log('Connected to MySQL database');
        
        // Create users table if it doesn't exist
        await db.query(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(255) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                role ENUM('admin', 'user') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL
            )
        `);
        
        // Create default admin user if none exists
        const [users] = await db.query('SELECT COUNT(*) as count FROM users');
        if (users[0].count === 0) {
            const hashedPassword = await bcrypt.hash('admin123', 10);
            await db.query(
                'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)',
                ['admin', hashedPassword, 'admin']
            );
            console.log('Default admin user created (username: admin, password: admin123)');
        }
    } catch (err) {
        console.error('Database initialization failed:', err);
        process.exit(1);
    }
}

// Authentication middleware
const authenticateToken = async (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({ error: 'Invalid or expired token' });
    }
};

// Input validation middleware
const validateMachineInput = (req, res, next) => {
    const { name, mac_address, ip_address } = req.body;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Machine name is required' });
    }
    
    if (!mac_address || !mac_address.match(/^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$/)) {
        return res.status(400).json({ error: 'Valid MAC address is required' });
    }
    
    if (!ip_address || !ip_address.match(/^(\d{1,3}\.){3}\d{1,3}$/)) {
        return res.status(400).json({ error: 'Valid IP address is required' });
    }
    
    next();
};

initDb().catch(err => console.error('Database connection failed:', err));

// Authentication Routes
app.post('/api/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const [users] = await db.query('SELECT * FROM users WHERE username = ?', [username]);
        
        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];
        const isValidPassword = await bcrypt.compare(password, user.password_hash);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await db.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);

        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role 
            },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role
            }
        });
    } catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});

app.post('/api/auth/logout', authenticateToken, (req, res) => {
    // In a more sophisticated app, you'd maintain a token blacklist
    res.json({ message: 'Logout successful' });
});

app.get('/api/auth/verify', authenticateToken, (req, res) => {
    res.json({ 
        valid: true, 
        user: {
            id: req.user.userId,
            username: req.user.username,
            role: req.user.role
        }
    });
});

// Helper function to execute remote shutdown
async function remoteShutdown(ip, username, password, action = 'shutdown') {
    const commands = {
        shutdown: `shutdown /s /m \\\\${ip} /t 0 /f`,
        restart: `shutdown /r /m \\\\${ip} /t 0 /f`
    };

    // Create a temporary batch file with credentials
    const cmd = `net use \\\\${ip} /user:${username} ${password} && ${commands[action]}`;
    
    console.log(`\n=== REMOTE ${action.toUpperCase()} DEBUG ===`);
    console.log(`Target IP: ${ip}`);
    console.log(`Username: ${username}`);
    console.log(`Command: ${commands[action]}`);
    
    return new Promise((resolve, reject) => {
        exec(cmd, (error, stdout, stderr) => {
            console.log(`Command execution completed for ${ip}`);
            console.log(`Error:`, error ? error.message : 'None');
            console.log(`STDOUT:`, stdout || 'Empty');
            console.log(`STDERR:`, stderr || 'Empty');
            console.log(`=== END REMOTE ${action.toUpperCase()} DEBUG ===\n`);
            
            if (error) {
                console.error(`Error executing command: ${error.message}`);
                return reject(error);
            }
            if (stderr) {
                console.error(`Command stderr: ${stderr}`);
                return reject(new Error(stderr));
            }
            resolve(stdout);
        });
    });
}

// API Routes - All protected except auth routes
app.get('/api/machines', authenticateToken, async (req, res) => {
    try {
        const [rows] = await db.query('SELECT * FROM machines');
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch machines' });
    }
});

app.post('/api/machines', authenticateToken, validateMachineInput, async (req, res) => {
    try {
        const { name, mac_address, ip_address, subnet_mask, broadcast_address, username, password } = req.body;
        
        console.log('Creating machine with:', { name, mac_address, ip_address, subnet_mask, broadcast_address, username, password: '***' });
        
        // Hash the password before storing
        const hashedPassword = password ? await bcrypt.hash(password, 10) : '';
        
        const [result] = await db.query(
            'INSERT INTO machines (name, mac_address, ip_address, subnet_mask, broadcast_address, username, encrypted_password) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, mac_address, ip_address, subnet_mask || '255.255.255.0', broadcast_address, username, hashedPassword]
        );
        
        console.log('Machine created with ID:', result.insertId);
        res.status(201).json({ id: result.insertId, message: 'Machine added successfully' });
    } catch (err) {
        console.error('Machine creation error:', err);
        res.status(500).json({ error: 'Failed to add machine' });
    }
});

// Reveal sensitive machine details (MAC/IP/username) protected by a server-side password.
// Requires: Authorization header with Bearer JWT and JSON body { password: '...' }
app.post('/api/machines/:id/reveal', authenticateToken, async (req, res) => {
    try {
        const machineId = req.params.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password is required' });
        }

        const expected = process.env.MACHINE_VIEW_PASSWORD;
        if (!expected) {
            return res.status(500).json({ error: 'Reveal password not configured on server' });
        }

        if (password !== expected) {
            // Best-effort logging of failed attempts; ignore logging errors
            try {
                await db.query('INSERT INTO system_logs (level, category, message, details) VALUES (?, ?, ?, ?)', [
                    'warning', 'auth', 'Failed machine reveal attempt',
                    JSON.stringify({ user: req.user?.username || req.user?.id || 'unknown', machine_id: machineId, ip: req.ip })
                ]);
            } catch (e) {
                // ignore
            }

            return res.status(403).json({ error: 'Invalid password' });
        }

        const [rows] = await db.query('SELECT id, name, mac_address, ip_address, username, encrypted_password FROM machines WHERE id = ?', [machineId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Machine not found' });
        }

        // Best-effort logging of successful reveal
        try {
            await db.query('INSERT INTO system_logs (level, category, message, details) VALUES (?, ?, ?, ?)', [
                'info', 'auth', 'Machine details revealed',
                JSON.stringify({ user: req.user?.username || req.user?.id || 'unknown', machine_id: machineId, ip: req.ip })
            ]);
        } catch (e) {
            // ignore logging errors
        }

        // Return sensitive fields only when correct password provided
        res.json(rows[0]);
    } catch (err) {
        console.error('Reveal error:', err);
        res.status(500).json({ error: 'Failed to reveal machine details' });
    }
});

app.post('/api/machines/:id/wake', authenticateToken, async (req, res) => {
    try {
        const machineId = req.params.id;
        const [rows] = await db.query('SELECT * FROM machines WHERE id = ?', [machineId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Machine not found' });
        }
        
        const machine = rows[0];
        
        // Enhanced Wake-on-LAN with multiple packet transmission
        const sendMultipleWolPackets = async (macAddress, broadcastAddress) => {
            const promises = [];
            const packetCount = 3; // Send 3 packets for reliability
            const addresses = [
                broadcastAddress,
                '255.255.255.255', // Global broadcast
                machine.ip_address // Direct IP (if machine supports it)
            ];
            
            // Send packets to multiple addresses for better reliability
            for (const address of addresses) {
                for (let i = 0; i < packetCount; i++) {
                    promises.push(
                        new Promise((resolve, reject) => {
                            setTimeout(() => {
                                wol.wake(macAddress, { 
                                    address: address,
                                    port: 9 // Standard WoL port
                                }, (err) => {
                                    if (err) {
                                        console.warn(`WoL packet failed to ${address}:`, err.message);
                                        resolve(false);
                                    } else {
                                        console.log(`WoL packet sent successfully to ${address}`);
                                        resolve(true);
                                    }
                                });
                            }, i * 100); // 100ms delay between packets
                        })
                    );
                }
            }
            
            return Promise.all(promises);
        };
        
        console.log(`Sending enhanced Wake-on-LAN to ${machine.mac_address}`);
        const results = await sendMultipleWolPackets(machine.mac_address, machine.broadcast_address);
        const successCount = results.filter(result => result === true).length;
        
        if (successCount > 0) {
            // Log the power event
            await db.query(
                'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
                [machineId, 'wake', 'success', req.user.username || 'system']
            );
            
            res.json({ 
                message: `Wake-on-LAN packets sent successfully (${successCount}/${results.length} packets delivered)`,
                packetsDelivered: successCount,
                totalPackets: results.length
            });
        } else {
            await db.query(
                'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
                [machineId, 'wake', 'failed', req.user.username || 'system']
            );
            
            res.status(500).json({ error: 'All Wake-on-LAN packets failed to send' });
        }
    } catch (err) {
        console.error('Wake-on-LAN error:', err);
        res.status(500).json({ error: 'Failed to wake machine' });
    }
});

app.post('/api/machines/:id/shutdown', authenticateToken, async (req, res) => {
    try {
        const machineId = req.params.id;
        const [rows] = await db.query('SELECT * FROM machines WHERE id = ?', [machineId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Machine not found' });
        }
        
        const machine = rows[0];
        const password = req.body.password; // In real app, use proper auth
        
        await remoteShutdown(machine.ip_address, machine.username, password, 'shutdown');
        
        // Log the power event
        await db.query(
            'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
            [machineId, 'shutdown', 'success', req.user.username || 'system']
        );
        
        res.json({ message: 'Shutdown command sent successfully' });
    } catch (err) {
        console.error(err);
        
        // Log failed event
        await db.query(
            'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
            [req.params.id, 'shutdown', 'failed', req.user.username || 'system']
        );
        
        res.status(500).json({ error: 'Failed to shutdown machine' });
    }
});

app.post('/api/machines/cluster-action', authenticateToken, async (req, res) => {
    try {
        const { machineIds, action, initiated_by } = req.body;
        
        console.log(`\n=== CLUSTER ACTION DEBUG ===`);
        console.log(`Action: ${action}`);
        console.log(`Machine IDs: ${JSON.stringify(machineIds)}`);
        console.log(`Initiated by: ${initiated_by}`);
        
        if (!machineIds || !Array.isArray(machineIds) ){
            return res.status(400).json({ error: 'Invalid machine IDs' });
        }
        
        const [machines] = await db.query('SELECT * FROM machines WHERE id IN (?)', [machineIds]);
        console.log(`Found ${machines.length} machines in database`);
        
        // Execute all commands in parallel for better performance
        const machinePromises = machines.map(async (machine) => {
            console.log(`\nProcessing machine: ${machine.name} (${machine.ip_address})`);
            try {
                if (action === 'wake') {
                    // Enhanced Wake-on-LAN with multiple packet transmission
                    const sendMultipleWolPackets = async (macAddress, broadcastAddress, ipAddress) => {
                        const promises = [];
                        const packetCount = 3; // Send 3 packets for reliability
                        const addresses = [
                            broadcastAddress,
                            '255.255.255.255', // Global broadcast
                            ipAddress // Direct IP (if machine supports it)
                        ];
                        
                        console.log(`Sending enhanced Wake-on-LAN to ${macAddress} via addresses: ${addresses.join(', ')}`);
                        
                        // Send packets to multiple addresses for better reliability
                        for (const address of addresses) {
                            for (let i = 0; i < packetCount; i++) {
                                promises.push(
                                    new Promise((resolve) => {
                                        setTimeout(() => {
                                            wol.wake(macAddress, { 
                                                address: address,
                                                port: 9 // Standard WoL port
                                            }, (err) => {
                                                if (err) {
                                                    console.warn(`WoL packet failed to ${address}:`, err.message);
                                                    resolve(false);
                                                } else {
                                                    console.log(`WoL packet sent successfully to ${address}`);
                                                    resolve(true);
                                                }
                                            });
                                        }, i * 100); // 100ms delay between packets
                                    })
                                );
                            }
                        }
                        
                        const results = await Promise.all(promises);
                        const successCount = results.filter(result => result === true).length;
                        
                        if (successCount === 0) {
                            throw new Error('All Wake-on-LAN packets failed to send');
                        }
                        
                        console.log(`Enhanced WoL completed: ${successCount}/${results.length} packets delivered`);
                        return { successCount, totalPackets: results.length };
                    };
                    
                    await sendMultipleWolPackets(machine.mac_address, machine.broadcast_address, machine.ip_address);
                } else {
                    // Use password from database
                    const password = machine.encrypted_password;
                    console.log(`Executing ${action} command for ${machine.ip_address} with user ${machine.username}`);
                    await remoteShutdown(machine.ip_address, machine.username, password, action);
                }
                await db.query(
                    'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
                    [machine.id, action, 'success', initiated_by || 'system']
                );
                return { machineId: machine.id, status: 'success' };
            } catch (err) {
                console.error(`Failed to ${action} machine ${machine.id}:`, err);
                await db.query(
                    'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
                    [machine.id, action, 'failed', initiated_by || 'system']
                );
                return { machineId: machine.id, status: 'failed', error: err.message };
            }
        });

        // Wait for all parallel operations to complete
        const results = await Promise.allSettled(machinePromises);
        
        // Process results from Promise.allSettled
        const processedResults = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                console.error(`Promise rejected for machine ${machines[index].id}:`, result.reason);
                return { 
                    machineId: machines[index].id, 
                    status: 'failed', 
                    error: result.reason?.message || 'Unknown error' 
                };
            }
        });
        res.json({ results: processedResults });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to perform cluster action' });
    }
});

// Ping machine to check status
app.post('/api/machines/:id/ping', authenticateToken, async (req, res) => {
    try {
        const machineId = req.params.id;
        const [rows] = await db.query('SELECT * FROM machines WHERE id = ?', [machineId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Machine not found' });
        }
        
        const machine = rows[0];
        const startTime = Date.now();
        
        // Use ping command based on OS
        const isWindows = process.platform === 'win32';
        const pingCommand = isWindows 
            ? `ping -n 1 -w 3000 ${machine.ip_address}`
            : `ping -c 1 -W 3 ${machine.ip_address}`;
        
        exec(pingCommand, async (error, stdout, stderr) => {
            const responseTime = Date.now() - startTime;
            let isOnline = false;
            let parsedResponseTime = null;
            
            // Log ping command and results for debugging
            console.log(`\n=== PING DEBUG for ${machine.name} (${machine.ip_address}) ===`);
            console.log(`Command: ${pingCommand}`);
            console.log(`Error:`, error ? error.message : 'None');
            console.log(`STDOUT:`, stdout || 'Empty');
            console.log(`STDERR:`, stderr || 'Empty');
            console.log(`Total execution time: ${responseTime}ms`);
            
            if (!error && stdout) {
                // Check if ping was successful
                if (isWindows) {
                    isOnline = stdout.includes('Reply from') && !stdout.includes('Request timed out');
                    console.log(`Windows ping check - Reply from: ${stdout.includes('Reply from')}, Timeout: ${stdout.includes('Request timed out')}`);
                    // Extract response time from Windows ping
                    const timeMatch = stdout.match(/time[<=](\d+)ms/);
                    if (timeMatch) {
                        parsedResponseTime = parseInt(timeMatch[1]);
                        console.log(`Extracted response time: ${parsedResponseTime}ms`);
                    }
                } else {
                    isOnline = stdout.includes('1 received') || stdout.includes('1 packets received');
                    console.log(`Unix ping check - 1 received: ${stdout.includes('1 received')}, packets received: ${stdout.includes('1 packets received')}`);
                    // Extract response time from Unix ping
                    const timeMatch = stdout.match(/time=(\d+\.?\d*) ms/);
                    if (timeMatch) {
                        parsedResponseTime = Math.round(parseFloat(timeMatch[1]));
                        console.log(`Extracted response time: ${parsedResponseTime}ms`);
                    }
                }
            } else {
                // If there's an error or no stdout, machine is considered offline/idle
                isOnline = false;
                console.log(`Ping failed - machine considered offline/idle`);
            }
            
            console.log(`Final result - isOnline: ${isOnline}, parsedResponseTime: ${parsedResponseTime}`);
            console.log(`=== END PING DEBUG ===\n`);
            
            // Log ping result
            try {
                await db.query(
                    'INSERT INTO power_events (machine_id, action, status, initiated_by, response_time) VALUES (?, ?, ?, ?, ?)',
                    [machineId, 'ping', isOnline ? 'success' : 'failed', 'system', parsedResponseTime]
                );
                
                // Update machine active status
                await db.query(
                    'UPDATE machines SET is_active = ?, last_ping = NOW() WHERE id = ?',
                    [isOnline ? 1 : 0, machineId]
                );
            } catch (dbError) {
                console.error('Database error during ping logging:', dbError);
            }
            
            res.json({
                isOnline,
                responseTime: parsedResponseTime,
                totalTime: responseTime,
                machine: machine.name,
                ip: machine.ip_address
            });
        });
    } catch (err) {
        console.error('Ping error:', err);
        res.status(500).json({ error: 'Failed to ping machine' });
    }
});

// Cluster management endpoints
app.get('/api/clusters', authenticateToken, async (req, res) => {
    try {
        const [clusters] = await db.query('SELECT * FROM clusters');
        res.json(clusters);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch clusters' });
    }
});

app.get('/api/clusters/:id', authenticateToken, async (req, res) => {
    try {
        const [cluster] = await db.query('SELECT * FROM clusters WHERE id = ?', [req.params.id]);
        if (cluster.length === 0) {
            return res.status(404).json({ error: 'Cluster not found' });
        }
        
        const [machines] = await db.query(
            `SELECT m.* FROM machines m
             JOIN machine_cluster mc ON m.id = mc.machine_id
             WHERE mc.cluster_id = ?`,
            [req.params.id]
        );
        
        res.json({ ...cluster[0], machines });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to fetch cluster details' });
    }
});

app.post('/api/clusters', authenticateToken, async (req, res) => {
    try {
        const { name, description, machineIds } = req.body;
        
        console.log('Creating cluster with:', { name, description, machineIds });
        
        const [result] = await db.query(
            'INSERT INTO clusters (name, description) VALUES (?, ?)',
            [name, description]
        );
        
        const clusterId = result.insertId;
        console.log('Cluster created with ID:', clusterId);
        
        if (machineIds && machineIds.length > 0) {
            const values = machineIds.map(machineId => [machineId, clusterId]);
            console.log('Adding machine associations:', values);
            await db.query(
                'INSERT INTO machine_cluster (machine_id, cluster_id) VALUES ?',
                [values]
            );
        }
        
        res.status(201).json({ id: clusterId });
    } catch (err) {
        console.error('Cluster creation error:', err);
        res.status(500).json({ error: 'Failed to create cluster' });
    }
});

app.put('/api/clusters/:id', authenticateToken, async (req, res) => {
    try {
        const { name, description, machineIds } = req.body;
        
        await db.query(
            'UPDATE clusters SET name = ?, description = ? WHERE id = ?',
            [name, description, req.params.id]
        );
        
        // Update machine associations
        await db.query('DELETE FROM machine_cluster WHERE cluster_id = ?', [req.params.id]);
        
        if (machineIds && machineIds.length > 0) {
            const values = machineIds.map(machineId => [machineId, req.params.id]);
            await db.query(
                'INSERT INTO machine_cluster (machine_id, cluster_id) VALUES ?',
                [values]
            );
        }
        
        res.json({ message: 'Cluster updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to update cluster' });
    }
});

app.delete('/api/clusters/:id', authenticateToken, async (req, res) => {
    try {
        await db.query('DELETE FROM clusters WHERE id = ?', [req.params.id]);
        res.json({ message: 'Cluster deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to delete cluster' });
    }
});

app.post('/api/clusters/:id/action', authenticateToken, async (req, res) => {
    try {
        const clusterId = req.params.id;
        const { action, password, initiated_by } = req.body;
        
        // Get all machines in this cluster
        const [machines] = await db.query(
            `SELECT m.* FROM machines m
             JOIN machine_cluster mc ON m.id = mc.machine_id
             WHERE mc.cluster_id = ?`,
            [clusterId]
        );
        
        if (machines.length === 0) {
            return res.status(400).json({ error: 'Cluster has no machines' });
        }
        
        // Execute all commands in parallel for better performance
        const machinePromises = machines.map(async (machine) => {
            try {
                if (action === 'wake') {
                    // Enhanced Wake-on-LAN with multiple packet transmission
                    const sendMultipleWolPackets = async (macAddress, broadcastAddress, ipAddress) => {
                        const promises = [];
                        const packetCount = 3; // Send 3 packets for reliability
                        const addresses = [
                            broadcastAddress,
                            '255.255.255.255', // Global broadcast
                            ipAddress // Direct IP (if machine supports it)
                        ];
                        
                        // Send packets to multiple addresses for better reliability
                        for (const address of addresses) {
                            for (let i = 0; i < packetCount; i++) {
                                promises.push(
                                    new Promise((resolve) => {
                                        setTimeout(() => {
                                            wol.wake(macAddress, { 
                                                address: address,
                                                port: 9 // Standard WoL port
                                            }, (err) => {
                                                if (err) {
                                                    console.warn(`WoL packet failed to ${address}:`, err.message);
                                                    resolve(false);
                                                } else {
                                                    console.log(`WoL packet sent successfully to ${address}`);
                                                    resolve(true);
                                                }
                                            });
                                        }, i * 100); // 100ms delay between packets
                                    })
                                );
                            }
                        }
                        
                        const results = await Promise.all(promises);
                        const successCount = results.filter(result => result === true).length;
                        
                        if (successCount === 0) {
                            throw new Error('All Wake-on-LAN packets failed to send');
                        }
                        
                        return { successCount, totalPackets: results.length };
                    };
                    
                    console.log(`Sending enhanced Wake-on-LAN to ${machine.mac_address}`);
                    await sendMultipleWolPackets(machine.mac_address, machine.broadcast_address, machine.ip_address);
                } else {
                    // Use password from database
                    const password = machine.encrypted_password;
                    await remoteShutdown(machine.ip_address, machine.username, password, action);
                }
                await db.query(
                    'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
                    [machine.id, action, 'success', initiated_by || 'system']
                );
                return { machineId: machine.id, status: 'success' };
            } catch (err) {
                console.error(`Failed to ${action} machine ${machine.id}:`, err);
                await db.query(
                    'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
                    [machine.id, action, 'failed', initiated_by || 'system']
                );
                return { machineId: machine.id, status: 'failed', error: err.message };
            }
        });

        // Wait for all parallel operations to complete
        const results = await Promise.allSettled(machinePromises);
        
        // Process results from Promise.allSettled
        const processedResults = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                console.error(`Promise rejected for machine ${machines[index].id}:`, result.reason);
                return { 
                    machineId: machines[index].id, 
                    status: 'failed', 
                    error: result.reason?.message || 'Unknown error' 
                };
            }
        });
        res.json({ results: processedResults });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Failed to perform cluster action' });
    }
});

app.put('/api/machines/:id', authenticateToken, async (req, res) => {
    try {
        const machineId = req.params.id;
        const { name, mac_address, ip_address, subnet_mask, broadcast_address, username, password } = req.body;
        
        console.log('Updating machine with ID:', machineId, { name, mac_address, ip_address, subnet_mask, broadcast_address, username, password: '***' });
        
        await db.query(
            'UPDATE machines SET name = ?, mac_address = ?, ip_address = ?, subnet_mask = ?, broadcast_address = ?, username = ?, encrypted_password = ? WHERE id = ?',
            [name, mac_address, ip_address, subnet_mask, broadcast_address, username, password, machineId]
        );
        
        console.log('Machine updated successfully');
        res.json({ message: 'Machine updated successfully' });
    } catch (err) {
        console.error('Machine update error:', err);
        res.status(500).json({ error: 'Failed to update machine' });
    }
});

app.delete('/api/machines/:id', authenticateToken, async (req, res) => {
    try {
        const machineId = req.params.id;
        
        console.log('Deleting machine with ID:', machineId);
        
        // First, remove machine from any clusters
        await db.query('DELETE FROM machine_cluster WHERE machine_id = ?', [machineId]);
        
        // Then delete the machine
        await db.query('DELETE FROM machines WHERE id = ?', [machineId]);
        
        console.log('Machine deleted successfully');
        res.json({ message: 'Machine deleted successfully' });
    } catch (err) {
        console.error('Machine deletion error:', err);
        res.status(500).json({ error: 'Failed to delete machine' });
    }
});

app.patch('/api/machines/:id/status', authenticateToken, async (req, res) => {
    try {
        const machineId = req.params.id;
        const { is_active } = req.body;
        
        console.log('Updating machine status:', machineId, 'to', is_active);
        
        await db.query(
            'UPDATE machines SET is_active = ? WHERE id = ?',
            [is_active, machineId]
        );
        
        console.log('Machine status updated successfully');
        res.json({ message: 'Machine status updated successfully' });
    } catch (err) {
        console.error('Machine status update error:', err);
        res.status(500).json({ error: 'Failed to update machine status' });
    }
});

// ========================================================================
// REMOTE KIOSK MODE FUNCTIONALITY
// ========================================================================

/**
 * Enhanced remote kiosk control function with Windows registry modifications
 * Supports starting and stopping kiosk mode on remote Windows machines
 */
async function remoteKioskControl(ip, username, password, action, kioskUrl = 'https://www.google.com') {
    console.log(`\n=== REMOTE KIOSK ${action.toUpperCase()} DEBUG ===`);
    console.log(`Target IP: ${ip}`);
    console.log(`Username: ${username}`);
    console.log(`Action: ${action}`);
    console.log(`Kiosk URL: ${kioskUrl}`);
    
    const commands = {
        start: [
            // Disable Windows key and Alt+Tab
            `reg add "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v DisableTaskMgr /t REG_DWORD /d 1 /f`,
            `reg add "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v DisableLockWorkstation /t REG_DWORD /d 1 /f`,
            `reg add "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v NoClose /t REG_DWORD /d 1 /f`,
            `reg add "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v NoLogOff /t REG_DWORD /d 1 /f`,
            // Start Chrome in kiosk mode
            `start "" "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe" --kiosk --no-sandbox --disable-web-security --disable-features=TranslateUI --disable-extensions --disable-plugins --disable-default-apps "${kioskUrl}"`
        ],
        stop: [
            // Re-enable Windows functionality
            `reg delete "HKEY_LOCAL_MACHINE\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v DisableTaskMgr /f`,
            `reg delete "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\System" /v DisableLockWorkstation /f`,
            `reg delete "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v NoClose /f`,
            `reg delete "HKEY_CURRENT_USER\\SOFTWARE\\Microsoft\\Windows\\CurrentVersion\\Policies\\Explorer" /v NoLogOff /f`,
            // Close Chrome processes
            `taskkill /F /IM chrome.exe`,
            `taskkill /F /IM "Google Chrome"`,
        ]
    };

    const executeRemoteCommands = async (commandList) => {
        const results = [];
        
        for (const command of commandList) {
            try {
                console.log(`Executing: ${command}`);
                
                // Use WMIC for remote command execution
                const wmicCommand = `wmic /node:"${ip}" /user:"${username}" /password:"${password}" process call create "${command}"`;
                
                const result = await new Promise((resolve, reject) => {
                    exec(wmicCommand, { timeout: 30000 }, (error, stdout, stderr) => {
                        console.log(`Command result - Error: ${error ? error.message : 'None'}`);
                        console.log(`STDOUT: ${stdout || 'Empty'}`);
                        console.log(`STDERR: ${stderr || 'Empty'}`);
                        
                        if (error) {
                            resolve({ success: false, error: error.message, command });
                        } else if (stdout.includes('ReturnValue = 0') || stdout.includes('Successful completion')) {
                            resolve({ success: true, command });
                        } else {
                            resolve({ success: false, error: stdout || stderr || 'Unknown error', command });
                        }
                    });
                });
                
                results.push(result);
                
                // Add delay between commands
                await new Promise(resolve => setTimeout(resolve, 1000));
                
            } catch (error) {
                console.error(`Failed to execute command: ${command}`, error);
                results.push({ success: false, error: error.message, command });
            }
        }
        
        return results;
    };

    try {
        const results = await executeRemoteCommands(commands[action]);
        const successCount = results.filter(r => r.success).length;
        const totalCount = results.length;
        
        console.log(`Kiosk ${action} completed: ${successCount}/${totalCount} commands successful`);
        console.log(`=== END REMOTE KIOSK ${action.toUpperCase()} DEBUG ===\n`);
        
        if (successCount === 0) {
            throw new Error(`All kiosk ${action} commands failed`);
        }
        
        return {
            success: true,
            successCount,
            totalCount,
            results,
            message: `Kiosk ${action} completed with ${successCount}/${totalCount} successful commands`
        };
        
    } catch (error) {
        console.error(`Kiosk ${action} failed:`, error);
        console.log(`=== END REMOTE KIOSK ${action.toUpperCase()} DEBUG ===\n`);
        throw error;
    }
}

// API endpoint to start kiosk mode on a machine
app.post('/api/machines/:id/kiosk/start', authenticateToken, async (req, res) => {
    try {
        const machineId = req.params.id;
        const { url, password } = req.body;
        
        console.log(`Starting kiosk mode for machine ${machineId}`);
        
        const [rows] = await db.query('SELECT * FROM machines WHERE id = ?', [machineId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Machine not found' });
        }
        
        const machine = rows[0];
        const kioskUrl = url || 'https://www.google.com';
        const machinePassword = password || machine.encrypted_password;
        
        // Execute kiosk start commands
        const result = await remoteKioskControl(
            machine.ip_address, 
            machine.username, 
            machinePassword, 
            'start', 
            kioskUrl
        );
        
        // Log the power event
        await db.query(
            'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
            [machineId, 'kiosk_start', 'success', req.user.username || 'system']
        );
        
        res.json({ 
            message: 'Kiosk mode started successfully',
            machine: machine.name,
            url: kioskUrl,
            details: result
        });
        
    } catch (err) {
        console.error('Kiosk start error:', err);
        
        // Log failed event
        await db.query(
            'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
            [req.params.id, 'kiosk_start', 'failed', req.user.username || 'system']
        );
        
        res.status(500).json({ 
            error: 'Failed to start kiosk mode',
            details: err.message 
        });
    }
});

// API endpoint to stop kiosk mode on a machine
app.post('/api/machines/:id/kiosk/stop', authenticateToken, async (req, res) => {
    try {
        const machineId = req.params.id;
        const { password } = req.body;
        
        console.log(`Stopping kiosk mode for machine ${machineId}`);
        
        const [rows] = await db.query('SELECT * FROM machines WHERE id = ?', [machineId]);
        
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Machine not found' });
        }
        
        const machine = rows[0];
        const machinePassword = password || machine.encrypted_password;
        
        // Execute kiosk stop commands
        const result = await remoteKioskControl(
            machine.ip_address, 
            machine.username, 
            machinePassword, 
            'stop'
        );
        
        // Log the power event
        await db.query(
            'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
            [machineId, 'kiosk_stop', 'success', req.user.username || 'system']
        );
        
        res.json({ 
            message: 'Kiosk mode stopped successfully',
            machine: machine.name,
            details: result
        });
        
    } catch (err) {
        console.error('Kiosk stop error:', err);
        
        // Log failed event
        await db.query(
            'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
            [req.params.id, 'kiosk_stop', 'failed', req.user.username || 'system']
        );
        
        res.status(500).json({ 
            error: 'Failed to stop kiosk mode',
            details: err.message 
        });
    }
});

// Bulk kiosk operations for clusters
app.post('/api/machines/kiosk/bulk', authenticateToken, async (req, res) => {
    try {
        const { machineIds, action, url, password } = req.body;
        
        console.log(`Bulk kiosk ${action} for machines:`, machineIds);
        
        if (!machineIds || !Array.isArray(machineIds) || machineIds.length === 0) {
            return res.status(400).json({ error: 'Invalid machine IDs' });
        }
        
        if (!['start', 'stop'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be "start" or "stop"' });
        }
        
        const [machines] = await db.query('SELECT * FROM machines WHERE id IN (?)', [machineIds]);
        
        if (machines.length === 0) {
            return res.status(400).json({ error: 'No machines found' });
        }
        
        // Execute all kiosk commands in parallel
        const machinePromises = machines.map(async (machine) => {
            try {
                const machinePassword = password || machine.encrypted_password;
                const kioskUrl = action === 'start' ? (url || 'https://www.google.com') : null;
                
                console.log(`Processing kiosk ${action} for machine: ${machine.name} (${machine.ip_address})`);
                
                const result = await remoteKioskControl(
                    machine.ip_address, 
                    machine.username, 
                    machinePassword, 
                    action, 
                    kioskUrl
                );
                
                // Log successful event
                await db.query(
                    'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
                    [machine.id, `kiosk_${action}`, 'success', req.user.username || 'system']
                );
                
                return { 
                    machineId: machine.id, 
                    machineName: machine.name,
                    status: 'success',
                    details: result
                };
                
            } catch (err) {
                console.error(`Failed to ${action} kiosk for machine ${machine.id}:`, err);
                
                // Log failed event
                await db.query(
                    'INSERT INTO power_events (machine_id, action, status, initiated_by) VALUES (?, ?, ?, ?)',
                    [machine.id, `kiosk_${action}`, 'failed', req.user.username || 'system']
                );
                
                return { 
                    machineId: machine.id, 
                    machineName: machine.name,
                    status: 'failed', 
                    error: err.message 
                };
            }
        });
        
        // Wait for all parallel operations to complete
        const results = await Promise.allSettled(machinePromises);
        
        // Process results from Promise.allSettled
        const processedResults = results.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                console.error(`Promise rejected for machine ${machines[index].id}:`, result.reason);
                return { 
                    machineId: machines[index].id, 
                    machineName: machines[index].name,
                    status: 'failed', 
                    error: result.reason?.message || 'Unknown error' 
                };
            }
        });
        
        const successCount = processedResults.filter(r => r.status === 'success').length;
        
        res.json({ 
            message: `Bulk kiosk ${action} completed`,
            totalMachines: machines.length,
            successCount,
            failureCount: machines.length - successCount,
            results: processedResults
        });
        
    } catch (err) {
        console.error('Bulk kiosk operation error:', err);
        res.status(500).json({ error: 'Failed to perform bulk kiosk operation' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
