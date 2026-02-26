const Consumption = require('../models/Consumption');

class ConsumptionController {
  static async getByDevice(req, res) {
    try {
      const { deviceId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date query parameter is required (YYYY-MM-DD)'
        });
      }

      const consumption = await Consumption.getAllByDevice(deviceId, date);

      res.json({
        success: true,
        data: consumption
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getByClass(req, res) {
    try {
      const { classId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate query parameters are required (YYYY-MM-DD)'
        });
      }

      const consumption = await Consumption.getByClass(classId, startDate, endDate);

      res.json({
        success: true,
        data: consumption
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getDaily(req, res) {
    try {
      const { deviceId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'Date query parameter is required (YYYY-MM-DD)'
        });
      }

      const consumption = await Consumption.getDaily(deviceId, date);
      
      // Transform to format expected by frontend
      const transformedData = consumption.map((item) => ({
        hour: item.hour_start.substring(0, 5),
        power: parseFloat(item.consumption),
        temperature: item.temperature,
        humidity: item.humidity
      }));

      res.json({
        success: true,
        data: transformedData
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getMonthly(req, res) {
    try {
      const { deviceId } = req.params;
      let { year, month } = req.query;

      // If only month is provided in YYYY-MM format, extract year
      if (!year && month && month.includes('-')) {
        [year, month] = month.split('-');
      }

      if (!year || !month) {
        return res.status(400).json({
          success: false,
          message: 'year and month query parameters are required (or month in YYYY-MM format)'
        });
      }

      const consumption = await Consumption.getMonthly(deviceId, year, month);

      res.json({
        success: true,
        data: consumption
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async create(req, res) {
    try {
      const {
        device_id,
        consumption,
        consumption_date,
        hour_start,
        hour_end,
        temperature,
        humidity,
        notes
      } = req.body;

      if (!device_id || consumption === undefined || !consumption_date || !hour_start || !hour_end) {
        return res.status(400).json({
          success: false,
          message: 'device_id, consumption, consumption_date, hour_start, and hour_end are required'
        });
      }

      const result = await Consumption.create({
        device_id,
        consumption,
        consumption_date,
        hour_start,
        hour_end,
        temperature,
        humidity,
        notes
      });

      res.status(201).json({
        success: true,
        message: 'Consumption data created successfully',
        data: {
          id: result.insertId,
          device_id,
          consumption,
          consumption_date,
          hour_start,
          hour_end
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async bulkCreate(req, res) {
    try {
      const { consumptionData } = req.body;

      if (!Array.isArray(consumptionData) || consumptionData.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'consumptionData array is required and must not be empty'
        });
      }

      const result = await Consumption.bulkInsert(consumptionData);

      res.status(201).json({
        success: true,
        message: 'Consumption data inserted successfully',
        data: {
          affectedRows: result.affectedRows,
          count: consumptionData.length
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getTotalByClass(req, res) {
    try {
      const { classId } = req.params;
      const { startDate, endDate } = req.query;

      if (!startDate || !endDate) {
        return res.status(400).json({
          success: false,
          message: 'startDate and endDate query parameters are required'
        });
      }

      const data = await Consumption.getTotalByClass(classId, startDate, endDate);

      res.json({
        success: true,
        data: data
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getHourlyAggregated(req, res) {
    try {
      const { classId } = req.params;
      const { date } = req.query;

      if (!date) {
        return res.status(400).json({
          success: false,
          message: 'date query parameter is required'
        });
      }

      const data = await Consumption.getHourlyAggregated(classId, date);

      // Transform to format expected by frontend
      const transformedData = {};
      data.forEach((item) => {
        if (!transformedData[item.hour_start]) {
          transformedData[item.hour_start] = { time: item.hour_start };
        }
        if (item.type === 'AC') {
          transformedData[item.hour_start].ac = parseFloat(item.total_consumption);
        } else if (item.type === 'LAMP') {
          transformedData[item.hour_start].lamp = parseFloat(item.total_consumption);
        }
      });

      const result = Object.values(transformedData);

      res.json({
        success: true,
        data: result
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  //============ REAL-TIME DATA FROM NODE-RED ============
  // Handle real-time consumption data with device info
  static async createRealTime(req, res) {
    try {
      const { 
        device_id, 
        device_eui,
        consumption, 
        temperature, 
        humidity, 
        timestamp,
        device_name,
        device_type,
        class_id
      } = req.body;

      // Validate required fields
      if (!consumption) {
        return res.status(400).json({
          success: false,
          message: 'Consumption value is required'
        });
      }

      if (!device_id && !device_eui) {
        return res.status(400).json({
          success: false,
          message: 'Either device_id or device_eui is required'
        });
      }

      // Get device if not provided in request
      let deviceId = device_id;
      let deviceInfo = null;

      if (!deviceId && device_eui) {
        // Query device by EUI
        const Device = require('../models/Device');
        deviceInfo = await Device.getByEUI(device_eui);
        if (!deviceInfo) {
          return res.status(404).json({
            success: false,
            message: `Device with EUI ${device_eui} not found`
          });
        }
        deviceId = deviceInfo.id;
      }

      // Parse timestamp
      const recordTime = timestamp ? new Date(timestamp) : new Date();
      const consumptionDate = recordTime.toISOString().split('T')[0];
      const hourStart = recordTime.toTimeString().split(' ')[0].substring(0, 8);
      const hourEnd = new Date(recordTime.getTime() + 3600000).toTimeString().split(' ')[0].substring(0, 8);

      // Insert into database
      const db = require('../config/database');
      const query = `
        INSERT INTO device_consumption 
        (device_id, consumption, consumption_date, hour_start, hour_end, temperature, humidity, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
        ON DUPLICATE KEY UPDATE
          consumption = VALUES(consumption),
          temperature = IF(VALUES(temperature) IS NOT NULL, VALUES(temperature), temperature),
          humidity = IF(VALUES(humidity) IS NOT NULL, VALUES(humidity), humidity)
      `;

      const [result] = await db.query(query, [
        deviceId,
        parseFloat(consumption),
        consumptionDate,
        hourStart,
        hourEnd,
        temperature ? parseFloat(temperature) : null,
        humidity ? parseFloat(humidity) : null
      ]);

      // Update device last_reading timestamp
      const updateDeviceQuery = `
        UPDATE devices 
        SET last_reading = NOW(), current_power = ?, current_temperature = ?
        WHERE id = ?
      `;
      
      await db.query(updateDeviceQuery, [
        parseFloat(consumption),
        temperature ? parseFloat(temperature) : null,
        deviceId
      ]);

      res.status(201).json({
        success: true,
        message: 'Real-time consumption data recorded successfully',
        data: {
          device_id: deviceId,
          device_name: device_name || deviceInfo?.device_name,
          device_type: device_type || deviceInfo?.device_type,
          consumption: parseFloat(consumption),
          temperature: temperature ? parseFloat(temperature) : null,
          humidity: humidity ? parseFloat(humidity) : null,
          timestamp: recordTime.toISOString(),
          consumption_date: consumptionDate,
          hour_start: hourStart
        }
      });

    } catch (error) {
      console.error('Error recording real-time data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to record real-time consumption data',
        error: error.message
      });
    }
  }

  // Bulk real-time data insertion (for multiple devices)
  static async createRealTimeBulk(req, res) {
    try {
      const { data } = req.body;

      if (!Array.isArray(data) || data.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Data must be a non-empty array'
        });
      }

      const db = require('../config/database');
      const Device = require('../models/Device');
      const results = [];
      const errors = [];

      for (const item of data) {
        try {
          const { 
            device_id, 
            device_eui,
            consumption, 
            temperature, 
            humidity, 
            timestamp
          } = item;

          if (!consumption || (!device_id && !device_eui)) {
            errors.push({
              item,
              error: 'Missing required fields: consumption and (device_id or device_eui)'
            });
            continue;
          }

          let deviceId = device_id;
          if (!deviceId && device_eui) {
            const deviceInfo = await Device.getByEUI(device_eui);
            if (!deviceInfo) {
              errors.push({
                item,
                error: `Device with EUI ${device_eui} not found`
              });
              continue;
            }
            deviceId = deviceInfo.id;
          }

          const recordTime = timestamp ? new Date(timestamp) : new Date();
          const consumptionDate = recordTime.toISOString().split('T')[0];
          const hourStart = recordTime.toTimeString().split(' ')[0].substring(0, 8);
          const hourEnd = new Date(recordTime.getTime() + 3600000).toTimeString().split(' ')[0].substring(0, 8);

          const query = `
            INSERT INTO device_consumption 
            (device_id, consumption, consumption_date, hour_start, hour_end, temperature, humidity, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            ON DUPLICATE KEY UPDATE
              consumption = VALUES(consumption),
              temperature = IF(VALUES(temperature) IS NOT NULL, VALUES(temperature), temperature),
              humidity = IF(VALUES(humidity) IS NOT NULL, VALUES(humidity), humidity)
          `;

          await db.query(query, [
            deviceId,
            parseFloat(consumption),
            consumptionDate,
            hourStart,
            hourEnd,
            temperature ? parseFloat(temperature) : null,
            humidity ? parseFloat(humidity) : null
          ]);

          results.push({
            device_id: deviceId,
            consumption: parseFloat(consumption),
            timestamp: recordTime.toISOString(),
            status: 'success'
          });

        } catch (itemError) {
          errors.push({
            item,
            error: itemError.message
          });
        }
      }

      res.status(201).json({
        success: errors.length === 0,
        message: `Processed ${results.length} records${errors.length > 0 ? `, ${errors.length} failed` : ''}`,
        data: results,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Error in bulk real-time data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process bulk real-time data',
        error: error.message
      });
    }
  }

  static async delete(req, res) {
    try {
      const { id } = req.params;

      await Consumption.delete(id);

      res.json({
        success: true,
        message: 'Consumption data deleted successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}

module.exports = ConsumptionController;
