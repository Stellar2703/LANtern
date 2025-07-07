require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const wol = require('wake_on_lan');
const { exec } = require('child_process'); // For shutdown (example via PowerShell)

const app = express();

app.use(cors());
app.use(express.json());

// MySQL connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// GET all systems
app.get('/api/systems', async (req, res) => {
  try {
    const systems = await query('SELECT * FROM systems');
    res.json(systems);
  } catch (err) {
    console.error('GET /systems error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST new system
app.post('/api/systems', async (req, res) => {
  const {
    name, mac_address, ip_address, subnet_mask,
    broadcast_address, port, description, username, password
  } = req.body;

  if (!name || !mac_address) {
    return res.status(400).json({ error: 'Name and MAC address are required' });
  }

  try {
    const result = await query(
      `INSERT INTO systems (name, mac_address, ip_address, subnet_mask, broadcast_address, port, description, username, password)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [name, mac_address, ip_address || null, subnet_mask || null, broadcast_address || null, port || 9, description || null, username || null, password || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error('POST /systems error:', err);
    res.status(500).json({ error: 'Database insert error' });
  }
});

// POST wake system by ID
app.post('/api/systems/wake/:id', async (req, res) => {
  try {
    const [system] = await query('SELECT * FROM systems WHERE id = ?', [req.params.id]);

    if (!system) return res.status(404).json({ error: 'System not found' });

    wol.wake(system.mac_address, {
      address: system.broadcast_address || undefined,
      port: system.port || 9,
    }, async (err) => {
      if (err) {
        console.error('Wake error:', err);
        return res.status(500).json({ error: 'Failed to send WoL packet' });
      }

      await query(
        'INSERT INTO wol_logs (system_id, triggered_by, status) VALUES (?, ?, ?)',
        [system.id, req.ip || 'unknown', 'sent']
      );

      res.json({ message: `WoL packet sent to ${system.name}` });
    });
  } catch (err) {
    console.error('Wake system error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST wake multiple systems
app.post('/api/systems/wake', async (req, res) => {
  const { systemIds } = req.body;

  if (!Array.isArray(systemIds) || systemIds.length === 0) {
    return res.status(400).json({ error: 'systemIds must be a non-empty array' });
  }

  try {
    const systems = await query('SELECT * FROM systems WHERE id IN (?)', [systemIds]);
    const results = [];

    for (const system of systems) {
      await new Promise((resolve) => {
        wol.wake(system.mac_address, {
          address: system.broadcast_address || undefined,
          port: system.port || 9,
        }, async (err) => {
          if (err) {
            console.error(`Wake error for ${system.name}:`, err);
            results.push({ id: system.id, name: system.name, success: false, error: err.message });
          } else {
            await query(
              'INSERT INTO wol_logs (system_id, triggered_by, status) VALUES (?, ?, ?)',
              [system.id, req.ip || 'unknown', 'sent']
            );
            results.push({ id: system.id, name: system.name, success: true });
          }
          resolve();
        });
      });
    }

    res.json({ message: `Packets sent to ${results.length} systems`, results });
  } catch (err) {
    console.error('Bulk wake error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// POST shutdown system by ID
app.post('/api/systems/shutdown/:id', async (req, res) => {
  try {
    const [system] = await query('SELECT * FROM systems WHERE id = ?', [req.params.id]);

    if (!system || !system.ip_address || !system.username || !system.password) {
      return res.status(400).json({ error: 'Incomplete system credentials' });
    }

    // Example PowerShell command (for Windows targets)
    const shutdownCmd = `powershell.exe -Command "Invoke-Command -ComputerName ${system.ip_address} -ScriptBlock { Stop-Computer -Force } -Credential (New-Object System.Management.Automation.PSCredential('${system.username}', (ConvertTo-SecureString '${system.password}' -AsPlainText -Force)))"`;

    exec(shutdownCmd, (err, stdout, stderr) => {
      if (err) {
        console.error(`Shutdown error: ${stderr}`);
        return res.status(500).json({ error: 'Shutdown failed' });
      }

      console.log(`Shutdown success: ${stdout}`);
      res.json({ message: `Shutdown triggered for ${system.name}` });
    });
  } catch (err) {
    console.error('Shutdown error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// GET logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await query(`
      SELECT wol_logs.*, systems.name AS system_name
      FROM wol_logs
      JOIN systems ON wol_logs.system_id = systems.id
      ORDER BY wol_logs.timestamp DESC
      LIMIT 100
    `);
    res.json(logs);
  } catch (err) {
    console.error('Log fetch error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`⚡ Server running on port ${PORT}`);
});
