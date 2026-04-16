// server/config/db.js
const mysql = require('mysql');

const db = mysql.createConnection({
    host: "localhost",
    user: 'root',
    password: '',
    database: 'lms'
});

const dbConnect = () => {
    db.connect((err) => {
        if (err) {
            console.error("Database connection failed: " + err.stack);
            return;
        }
        console.log("Connected to MySQL Database.");
    });
};

module.exports = { db, dbConnect };