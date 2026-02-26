const mysql = require("mysql2/promise");

async function checkConnection() {
  try {
    const connection = await mysql.createConnection({
      host: "127.0.0.1",
      user: "root",
      password: "sa",
      database: "mekansm_energy",
      port: 3306
    });

    await connection.ping();
    console.log("✅ Database terhubung!");
    await connection.end();
  } catch (err) {
    console.error("❌ Error:", err);
  }
}

checkConnection();
