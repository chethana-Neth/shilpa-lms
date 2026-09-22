// server/models/userModel.js
const { db } = require('../config/db');

const User = {
  // Find a user by email and include their role and status
  findByEmail: (email, callback) => {
    const sql = `
      SELECT users.*, roles.role_name, user_roles.role_id
      FROM users
      JOIN user_roles ON users.id = user_roles.user_id
      JOIN roles ON roles.id = user_roles.role_id
      WHERE users.email = ?
    `;
    db.query(sql, [email], callback);
  },

  // Create a new user record with status
  create: (username, email, hashedPassword, status, callback) => {
    const sql = "INSERT INTO users (username, email, password, status) VALUES (?, ?, ?, ?)";
    const values = [username, email, hashedPassword, status];
    db.query(sql, values, callback);
  },

  // Create a user coming from Google sign-in (auto-approved)
  createGoogleUser: (username, email, hashedRandomPassword, callback) => {
    const sql = "INSERT INTO users (username, email, password, status) VALUES (?, ?, ?, 'approved')";
    const values = [username, email, hashedRandomPassword];
    db.query(sql, values, callback);
  },

  // Assign a role to a user
  assignRole: (userId, roleName, callback) => {
    const roleSql = "SELECT id FROM roles WHERE role_name = ?";
    db.query(roleSql, [roleName], (err, roleData) => {
      if (err || roleData.length === 0) {
        return callback(err || new Error("Role not found"));
      }
      const roleId = roleData[0].id;
      const userRoleSql = "INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)";
      db.query(userRoleSql, [userId, roleId], callback);
    });
  },

  // Get all users with roles
  getAll: (callback) => {
    const sql = `
      SELECT users.id, users.username, users.email, users.status, roles.role_name as role 
      FROM users
      LEFT JOIN user_roles ON users.id = user_roles.user_id
      LEFT JOIN roles ON roles.id = user_roles.role_id
    `;
    db.query(sql, callback);
  },

  // Find user by ID (used by admin)
  findById: (id, callback) => {
    const sql = `
      SELECT users.*, roles.role_name
      FROM users
      LEFT JOIN user_roles ON users.id = user_roles.user_id
      LEFT JOIN roles ON roles.id = user_roles.role_id
      WHERE users.id = ?
    `;
    db.query(sql, [id], callback);
  },

  // Update user status (approve/reject)
  updateStatus: (userId, status, callback) => {
    const sql = "UPDATE users SET status = ? WHERE id = ?";
    db.query(sql, [status, userId], callback);
  },

  // Get all pending educators (role = 'educator' and status = 'pending')
  getPendingEducators: (callback) => {
    const sql = `
      SELECT users.id, users.username, users.email, users.status, users.created_at, roles.role_name
      FROM users
      JOIN user_roles ON users.id = user_roles.user_id
      JOIN roles ON roles.id = user_roles.role_id
      WHERE roles.role_name = 'educator' AND users.status = 'pending'
    `;
    db.query(sql, callback);
  }
};

module.exports = User;