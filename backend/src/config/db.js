import mongoose from 'mongoose';

/**
 * MongoDB Connection Configuration
 */
class Database {
  constructor() {
    this.isConnected = false;
  }

  /**
   * Connect to MongoDB Atlas
   */
  async connect() {
    if (this.isConnected) {
      console.log('✅ Database already connected');
      return;
    }

    try {
      const conn = await mongoose.connect(process.env.MONGO_URI, {
        maxPoolSize: 10,
        minPoolSize: 2,
        serverSelectionTimeoutMS: 30000,  // ← KEPT feature/payment (30s)
        socketTimeoutMS: 45000,
        connectTimeoutMS: 30000,          // ← KEPT feature/payment (30s)
        retryWrites: true,
        retryReads: true,
        family: 4,
        bufferCommands: true,
        autoIndex: process.env.NODE_ENV !== 'production'
      });

      this.isConnected = true;

      console.log(`✅ MongoDB Connected Successfully`);
      console.log(`📊 Database: ${conn.connection.name}`);
      console.log(`🌐 Host: ${conn.connection.host}`);
      console.log(`🔢 Port: ${conn.connection.port}`);

      this.setupEventListeners(conn);
      return conn;

    } catch (error) {
      console.error(`❌ MongoDB Connection Error: ${error.message}`);
      console.log('🔄 Retrying connection in 5 seconds...');
      setTimeout(() => this.connect(), 5000);
      throw error;
    }
  }

  /**
   * Setup MongoDB Event Listeners
   */
  setupEventListeners(conn) {
    mongoose.connection.on('connected', () => {
      console.log('✅ MongoDB connection established');
    });

    mongoose.connection.on('error', (err) => {
      console.error(`❌ MongoDB connection error: ${err.message}`);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('⚠️ MongoDB connection disconnected');
      this.isConnected = false;
    });

    mongoose.connection.on('reconnected', () => {
      console.log('✅ MongoDB reconnected successfully');
      this.isConnected = true;
    });

    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  /**
   * Disconnect from MongoDB gracefully
   */
  async disconnect() {
    if (!this.isConnected) return;
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('✅ MongoDB disconnected gracefully');
    } catch (error) {
      console.error(`❌ Error disconnecting from MongoDB: ${error.message}`);
    }
  }

  /**
   * Get connection status
   */
  getStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      readyStateText: this.getReadyStateText(mongoose.connection.readyState)
    };
  }

  getReadyStateText(state) {
    const states = {
      0: 'Disconnected',
      1: 'Connected',
      2: 'Connecting',
      3: 'Disconnecting'
    };
    return states[state] || 'Unknown';
  }

  /**
   * Health check for database
   */
  async healthCheck() {
    try {
      if (!this.isConnected) {
        return { status: 'disconnected', healthy: false };
      }
      await mongoose.connection.db.admin().ping();
      return {
        status: 'healthy',
        healthy: true,
        readyState: this.getReadyStateText(mongoose.connection.readyState),
        database: mongoose.connection.name
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        healthy: false,
        error: error.message
      };
    }
  }
}

// Export singleton instance
const db = new Database();
export default db;
export { mongoose };