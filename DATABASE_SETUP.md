# LANturn Database Setup Guide

## 📋 Overview

This guide provides complete instructions for setting up the LANturn database with all required tables, relationships, and initial data.

## 🗄️ Database Requirements

- **MySQL**: Version 8.0 or higher
- **Database Name**: `power_management`
- **Character Set**: `utf8mb4`
- **Collation**: `utf8mb4_0900_ai_ci`

## 🚀 Quick Setup (Recommended for Development)

### 1. Run Quick Setup Script
```sql
source database_setup_quick.sql
```

This creates the minimum required tables and default admin user.

### 2. Default Credentials
- **Username**: `admin`
- **Password**: `admin123`

## 🔧 Complete Setup (Recommended for Production)

### 1. Run Complete Setup Script
```sql
source database_setup_complete.sql
```

This includes all tables, views, stored procedures, triggers, and security features.

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env with your database credentials
```

## 📊 Database Schema

### Core Tables

#### 1. **users**
- User authentication and authorization
- Stores user credentials and roles
- Default admin user created automatically

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('admin', 'user') DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL
);
```

#### 2. **machines**
- Network machines to be managed
- Stores connection details and credentials

```sql
CREATE TABLE machines (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  mac_address VARCHAR(17) NOT NULL,
  ip_address VARCHAR(15) NOT NULL,
  subnet_mask VARCHAR(15) DEFAULT '255.255.255.0',
  broadcast_address VARCHAR(15) NOT NULL,
  username VARCHAR(255) NOT NULL,
  encrypted_password TEXT NOT NULL,
  is_active TINYINT(1) DEFAULT 1,
  last_ping TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 3. **clusters**
- Machine grouping for bulk operations
- Allows organizing machines by purpose/location

```sql
CREATE TABLE clusters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### 4. **machine_cluster**
- Many-to-many relationship between machines and clusters
- Allows machines to belong to multiple clusters

```sql
CREATE TABLE machine_cluster (
  machine_id INT NOT NULL,
  cluster_id INT NOT NULL,
  PRIMARY KEY (machine_id, cluster_id),
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE,
  FOREIGN KEY (cluster_id) REFERENCES clusters(id) ON DELETE CASCADE
);
```

#### 5. **power_events**
- Audit log for all power management operations
- Tracks success/failure and response times

```sql
CREATE TABLE power_events (
  id INT PRIMARY KEY AUTO_INCREMENT,
  machine_id INT NOT NULL,
  action ENUM('wake', 'shutdown', 'restart', 'ping', 'kiosk_start', 'kiosk_stop') NOT NULL,
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  initiated_by VARCHAR(255) NOT NULL,
  response_time DECIMAL(8,3),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (machine_id) REFERENCES machines(id) ON DELETE CASCADE
);
```

### Extended Tables (Complete Setup Only)

#### 6. **system_logs**
- General application logging
- Error tracking and debugging

#### 7. **user_sessions**
- Session management
- Security and authentication tracking

#### 8. **application_settings**
- System configuration
- Feature flags and preferences

## 🔗 Relationships

```
users (1) -----> (n) machines [created_by]
users (1) -----> (n) clusters [created_by]
users (1) -----> (n) power_events [user_id]

machines (n) <----> (n) clusters [machine_cluster]
machines (1) -----> (n) power_events

clusters (1) -----> (n) machine_cluster
```

## 📝 Required Data Types

### Action Types (power_events.action)
- `wake` - Wake-on-LAN operations
- `shutdown` - Remote shutdown commands
- `restart` - Remote restart commands  
- `ping` - Network connectivity tests
- `kiosk_start` - Start kiosk mode
- `kiosk_stop` - Stop kiosk mode

### Status Types (power_events.status)
- `pending` - Operation initiated
- `success` - Operation completed successfully
- `failed` - Operation failed

### User Roles (users.role)
- `admin` - Full system access
- `user` - Limited access

## 🔧 Backend Integration

The backend server expects these environment variables:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=power_management
JWT_SECRET=your_jwt_secret
MACHINE_VIEW_PASSWORD=change_this_view_password    # Password required to reveal MAC/IP/credentials via API
```

## 🔍 API Database Operations

### Machine Operations
- `GET /api/machines` - Fetch all machines
- `POST /api/machines` - Add new machine
- `POST /api/machines/:id/wake` - Wake machine
- `POST /api/machines/:id/shutdown` - Shutdown machine
- `POST /api/machines/:id/ping` - Ping machine
- `POST /api/machines/:id/kiosk/start` - Start kiosk mode
- `POST /api/machines/:id/kiosk/stop` - Stop kiosk mode

### Cluster Operations
- `GET /api/clusters` - Fetch all clusters
- `POST /api/clusters` - Create cluster
- `POST /api/clusters/:id/action` - Bulk cluster actions

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

## 📊 Views and Reports (Complete Setup)

### Machine Status View
```sql
SELECT * FROM v_machine_status;
```
Shows current status of all machines with cluster membership.

### Power Events Summary
```sql
SELECT * FROM v_power_events_summary;
```
Shows daily statistics of power operations.

## 🛠️ Maintenance

### Log Cleanup
```sql
CALL sp_cleanup_old_logs(90); -- Keep 90 days
```

### Statistics
```sql
CALL sp_get_machine_stats();
```

## 🔐 Security Features

- Password hashing with bcrypt
- JWT token authentication
- Foreign key constraints
- Input validation
- Audit logging
- Session management

## 📋 Verification Checklist

After setup, verify these items:

- [ ] Database `power_management` exists
- [ ] All 5 core tables created
- [ ] Default admin user exists
- [ ] Foreign key relationships work
- [ ] Backend connects successfully
- [ ] Default cluster created
- [ ] Environment variables configured

## 🐛 Troubleshooting

### Common Issues

1. **Connection Failed**
   - Check MySQL service is running
   - Verify credentials in `.env`
   - Check port 3306 is open

2. **Table Missing**
   - Run setup script again
   - Check MySQL user permissions
   - Verify database name

3. **Foreign Key Errors**
   - Ensure parent records exist
   - Check constraint definitions
   - Verify referential integrity

4. **Authentication Failed**
   - Check default admin user exists
   - Verify password hash
   - Check JWT secret configuration

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Verify environment configuration
3. Check MySQL error logs
4. Review backend server logs

---

**LANturn Database Setup Complete!** 🎉