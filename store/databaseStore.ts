import { create } from "zustand";
import * as SQLite from "expo-sqlite";
import { SensorRecord } from "../hooks/DataEngine/types";

interface DatabaseState {
  db: SQLite.SQLiteDatabase | null;
  loading: boolean;
  lastRecord: SensorRecord | null;
  error: string | null;
  initDB: () => Promise<void>;
  addSensorRecord: (record: SensorRecord) => Promise<void>;
  getRecentRecords: (limit: number) => Promise<SensorRecord[]>;
  addSensorRecords: (records: SensorRecord[]) => Promise<void>;
}

// Open database synchronously (once)
const db = SQLite.openDatabaseSync("client.db");

export const useDatabaseStore = create<DatabaseState>((set, get) => ({
  db,
  loading: true,
  lastRecord: null,
  error: null,

  initDB: async () => {
    set({ loading: true, error: null });

    try {
      // Create table using execAsync
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS sensor_data (
          temperature REAL,
          humidity REAL,
          co2 REAL,
          timestamp INTEGER PRIMARY KEY
        );
      `);

      // Load last record
      const rows = await db.getAllAsync<SensorRecord>(
        `SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT 1;`
      );

      set({
        lastRecord: rows.length > 0 ? rows[0] : null,
        loading: false,
      });

      console.log("✅ Database initialized, last record:", rows[0] ?? "none");
    } catch (error: any) {
      console.error("❌ Database init failed:", error);
      set({ error: error.message || "Database init failed", loading: false });
    }
  },

  addSensorRecord: async (record) => {
    try {
      await db.runAsync(
        `INSERT INTO sensor_data (temperature, humidity, co2, timestamp)
         VALUES (?, ?, ?, ?);`,
        [record.temperature, record.humidity, record.co2, record.timestamp]
      );

      // Refresh lastRecord immediately
      set({ lastRecord: record });
      console.log("✅ Sensor record added");
    } catch (error) {
      console.error("❌ Failed to add sensor record:", error);
    }
  },

  addSensorRecords: async (records: SensorRecord[]) => {
    const { db } = get();
    if (!db) throw new Error("Database not initialized");

    if (records.length === 0) return;

    const placeholders = records.map(() => "(?, ?, ?, ?)").join(", ");
    const values = records.flatMap((r) => [
      r.temperature,
      r.humidity,
      r.co2,
      r.timestamp,
    ]);

    try {
      // Wrap everything in a transaction for speed & consistency
      await db.execAsync("BEGIN TRANSACTION;");

      await db.runAsync(
        `INSERT INTO sensor_data (temperature, humidity, co2, timestamp)
         VALUES ${placeholders};`,
        values
      );

      await db.execAsync("COMMIT;");

      // Optionally update lastRecord in store
      set({ lastRecord: records[records.length - 1] });

      console.log(`✅ Inserted ${records.length} records`);
    } catch (error) {
      console.error("❌ Failed to add sensor records:", error);
      await db.execAsync("ROLLBACK;");
    }
  },

  getRecentRecords: async (limit) => {
    try {
      const rows = await db.getAllAsync<SensorRecord>(
        `SELECT * FROM sensor_data ORDER BY timestamp DESC LIMIT ?;`,
        [limit]
      );
      return rows;
    } catch (error) {
      console.error("❌ Failed to fetch recent records:", error);
      return [];
    }
  },
}));
