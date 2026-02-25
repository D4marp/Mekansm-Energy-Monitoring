const db = require('../config/database');

class Consumption {
  static async getAllByDevice(deviceId, date) {
    try {
      const [rows] = await db.query(`
        SELECT * FROM device_consumption 
        WHERE device_id = ? AND consumption_date = ? 
        ORDER BY hour_start
      `, [deviceId, date]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getByClass(classId, startDate, endDate) {
    try {
      const [rows] = await db.query(`
        SELECT dc.*, d.id as device_id, d.name as device_name, d.type as device_type
        FROM device_consumption dc
        JOIN devices d ON dc.device_id = d.id
        WHERE d.class_id = ? AND dc.consumption_date BETWEEN ? AND ?
        ORDER BY dc.consumption_date, dc.hour_start
      `, [classId, startDate, endDate]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getDaily(deviceId, date) {
    try {
      const [rows] = await db.query(`
        SELECT 
          hour_start,
          consumption,
          temperature,
          humidity
        FROM device_consumption 
        WHERE device_id = ? AND consumption_date = ? 
        ORDER BY hour_start
      `, [deviceId, date]);
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getMonthly(deviceId, year, month) {
    try {
      const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
      const endDate = new Date(year, month, 0).toISOString().split('T')[0];

      const [rows] = await db.query(`
        SELECT 
          DATE(consumption_date) as date,
          SUM(consumption) as total_consumption,
          AVG(temperature) as avg_temperature,
          MAX(consumption) as peak_consumption
        FROM device_consumption 
        WHERE device_id = ? AND consumption_date BETWEEN ? AND ?
        GROUP BY DATE(consumption_date)
        ORDER BY consumption_date
      `, [deviceId, startDate, endDate]);
      
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async create(data) {
    try {
      const { device_id, consumption, consumption_date, hour_start, hour_end, temperature, humidity, notes } = data;
      
      const [result] = await db.query(`
        INSERT INTO device_consumption 
        (device_id, consumption, consumption_date, hour_start, hour_end, temperature, humidity, notes) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE 
        consumption = ?, temperature = ?, humidity = ?
      `, [device_id, consumption, consumption_date, hour_start, hour_end, temperature, humidity, notes, consumption, temperature, humidity]);
      
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async bulkInsert(consumptionData) {
    try {
      let query = `
        INSERT INTO device_consumption 
        (device_id, consumption, consumption_date, hour_start, hour_end, temperature, humidity) 
        VALUES 
      `;
      
      const values = [];
      const placeholders = [];

      consumptionData.forEach((data) => {
        placeholders.push('(?, ?, ?, ?, ?, ?, ?)');
        values.push(
          data.device_id,
          data.consumption,
          data.consumption_date,
          data.hour_start,
          data.hour_end,
          data.temperature || null,
          data.humidity || null
        );
      });

      query += placeholders.join(', ');
      query += ` ON DUPLICATE KEY UPDATE consumption = VALUES(consumption), temperature = VALUES(temperature), humidity = VALUES(humidity)`;

      const [result] = await db.query(query, values);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getTotalByClass(classId, startDate, endDate) {
    try {
      const [rows] = await db.query(`
        SELECT 
          d.id,
          d.name,
          d.type,
          SUM(dc.consumption) as total_consumption,
          AVG(dc.consumption) as avg_consumption,
          MAX(dc.consumption) as peak_consumption,
          COUNT(*) as readings_count
        FROM device_consumption dc
        JOIN devices d ON dc.device_id = d.id
        WHERE d.class_id = ? AND dc.consumption_date BETWEEN ? AND ?
        GROUP BY d.id, d.name, d.type
        ORDER BY total_consumption DESC
      `, [classId, startDate, endDate]);
      
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async getHourlyAggregated(classId, date) {
    try {
      const [rows] = await db.query(`
        SELECT 
          dc.hour_start,
          d.type,
          SUM(dc.consumption) as total_consumption,
          AVG(dc.temperature) as avg_temperature
        FROM device_consumption dc
        JOIN devices d ON dc.device_id = d.id
        WHERE d.class_id = ? AND dc.consumption_date = ?
        GROUP BY dc.hour_start, d.type
        ORDER BY dc.hour_start
      `, [classId, date]);
      
      return rows;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }

  static async delete(id) {
    try {
      const [result] = await db.query('DELETE FROM device_consumption WHERE id = ?', [id]);
      return result;
    } catch (error) {
      throw new Error(`Database error: ${error.message}`);
    }
  }
}

module.exports = Consumption;
