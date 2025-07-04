require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const wol = require('wake_on_lan');
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3307, // Default MySQL port
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Helper function to execute SQL queries
async function query(sql, params) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Routes

// Get all systems
app.get('/api/systems', async (req, res) => {
  try {
    const systems = await query('SELECT * FROM systems');
    res.json(systems);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Add a new system
app.post('/api/systems', async (req, res) => {
  const { name, mac_address, ip_address, subnet_mask, broadcast_address, port, description } = req.body;
  
  if (!name || !mac_address) {
    return res.status(400).json({ error: 'Name and MAC address are required' });
  }

  try {
    const result = await query(
      'INSERT INTO systems (name, mac_address, ip_address, subnet_mask, broadcast_address, port, description) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, mac_address, ip_address || null, subnet_mask || null, broadcast_address || null, port || 9, description || null]
    );
    res.status(201).json({ id: result.insertId });
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'MAC address already exists' });
    } else {
      res.status(500).json({ error: 'Database error' });
    }
  }
});

// Wake a system
app.post('/api/systems/wake/:id', async (req, res) => {
  try {
    const [system] = await query('SELECT * FROM systems WHERE id = ?', [req.params.id]);
    
    if (!system) {
      return res.status(404).json({ error: 'System not found' });
    }

    const options = {
      address: system.broadcast_address || undefined,
      port: system.port || 9
    };

    wol.wake(system.mac_address, options, (error) => {
      if (error) {
        console.error('Wake error:', error);
        return res.status(500).json({ error: 'Failed to send WoL packet' });
      }

      // Log the wake attempt
      query(
        'INSERT INTO wol_logs (system_id, triggered_by, status) VALUES (?, ?, ?)',
        [system.id, req.ip || 'unknown', 'sent']
      ).catch(console.error);

      res.json({ message: `WoL packet sent to ${system.name} (${system.mac_address})` });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Wake multiple systems
app.post('/api/systems/wake', async (req, res) => {
  const { systemIds } = req.body;
  
  if (!systemIds || !Array.isArray(systemIds)) {
    return res.status(400).json({ error: 'systemIds array is required' });
  }

  try {
    const systems = await query('SELECT * FROM systems WHERE id IN (?)', [systemIds]);
    
    if (systems.length === 0) {
      return res.status(404).json({ error: 'No systems found' });
    }

    const results = [];
    let successCount = 0;
    
    for (const system of systems) {
      try {
        await new Promise((resolve, reject) => {
          const options = {
            address: system.broadcast_address || undefined,
            port: system.port || 9
          };

          wol.wake(system.mac_address, options, (error) => {
            if (error) {
              console.error(`Wake error for ${system.name}:`, error);
              results.push({
                id: system.id,
                name: system.name,
                success: false,
                error: error.message
              });
              reject(error);
            } else {
              // Log the wake attempt
              query(
                'INSERT INTO wol_logs (system_id, triggered_by, status) VALUES (?, ?, ?)',
                [system.id, req.ip || 'unknown', 'sent']
              ).catch(console.error);

              results.push({
                id: system.id,
                name: system.name,
                success: true
              });
              successCount++;
              resolve();
            }
          });
        });
      } catch (err) {
        // Continue to next system even if one fails
        continue;
      }
    }

    res.json({
      message: `WoL packets sent to ${successCount} of ${systems.length} systems`,
      results
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Get wake logs
app.get('/api/logs', async (req, res) => {
  try {
    const logs = await query(`
      SELECT wol_logs.*, systems.name as system_name 
      FROM wol_logs 
      JOIN systems ON wol_logs.system_id = systems.id 
      ORDER BY wol_logs.timestamp DESC 
      LIMIT 100
    `);
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database error' });
  }
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});