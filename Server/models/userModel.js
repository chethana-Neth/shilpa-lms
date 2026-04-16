// server/models/userModel.js
const { db } = require('../config/db');

const User = {
  // Find a user by email and include their role
  findByEmail: (email, callback) => {
    const sql = `
      SELECT users.*, roles.role_name 
      FROM users
      JOIN user_roles ON users.id = user_roles.user_id
      JOIN roles ON roles.id = user_roles.role_id
      WHERE users.email = ?
    `;
    db.query(sql, [email], callback);
  },

  // Create a new user record
  create: (username, email, hashedPassword, callback) => {
    const sql = "INSERT INTO users (`username`, `email`, `password`) VALUES (?)";
    const values = [username, email, hashedPassword];
    db.query(sql, [values], callback);
  },

  // Assign a role to a user
  assignRole: (userId, roleName, callback) => {
    // First find the role ID
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

  // Get all users with their roles
  getAll: (callback) => {
    const sql = `
      SELECT users.id, users.username, users.email, roles.role_name as role 
      FROM users
      LEFT JOIN user_roles ON users.id = user_roles.user_id
      LEFT JOIN roles ON roles.id = user_roles.role_id
    `;
    db.query(sql, callback);
  }
};

module.exports = User;