/**
 * MongoDB Database Adapter
 * Implements the DatabaseAdapter interface for MongoDB
 * 
 * Installation: npm install mongodb
 * Documentation: https://www.mongodb.com/docs/drivers/node/current/
 * 
 * SECURITY: Credentials are loaded from environment variables.
 * Set these before using:
 * - MONGODB_USERNAME (optional if using connection URI)
 * - MONGODB_PASSWORD (optional if using connection URI)
 */

import { DatabaseAdapter, DatabaseConfig } from './base';
import { validateQuery, requireEnv } from '../security';

export interface MongoDBConfig extends DatabaseConfig {
  uri?: string;
  host?: string;
  port?: number;
  database: string;
  authSource?: string;
  replicaSet?: string;
  ssl?: boolean;
  maxPoolSize?: number;
  maxIdleTimeMS?: number;
  serverSelectionTimeoutMS?: number;
  socketTimeoutMS?: number;
  connectTimeoutMS?: number;
}

/**
 * MongoDB adapter implementation
 * 
 * Example usage:
 * ```typescript
 * // Set environment variables first:
 * // MONGODB_USERNAME=myuser
 * // MONGODB_PASSWORD=mypass
 * 
 * const adapter = new MongoDBAdapter({
 *   host: 'localhost',
 *   port: 27017,
 *   database: 'mydb'
 * });
 * 
 * await adapter.connect();
 * const id = await adapter.insertOne('users', { name: 'John', email: 'john@example.com' });
 * const users = await adapter.find('users', { name: 'John' });
 * await adapter.disconnect();
 * ```
 */
export class MongoDBAdapter implements DatabaseAdapter<Record<string, unknown>> {
  private config: MongoDBConfig;
  private client: unknown | null = null;
  private db: unknown | null = null;

  constructor(config: MongoDBConfig) {
    this.config = config;
  }

  /**
   * Builds MongoDB connection URI from config
   * Loads credentials from environment variables for security
   */
  private getConnectionUri(): string {
    if (this.config.uri) {
      return this.config.uri;
    }

    const { host = 'localhost', port = 27017, database, authSource = 'admin' } = this.config;
    
    // Load credentials from environment variables
    const username = requireEnv('MONGODB_USERNAME', true);
    const password = requireEnv('MONGODB_PASSWORD', true);
    
    if (username && password) {
      // Encode credentials to handle special characters safely
      const encodedUser = encodeURIComponent(username);
      const encodedPass = encodeURIComponent(password);
      return `mongodb://${encodedUser}:${encodedPass}@${host}:${port}/${database}?authSource=${authSource}`;
    }
    
    return `mongodb://${host}:${port}/${database}`;
  }

  async connect(): Promise<void> {
    try {
      // Dynamic import to avoid requiring MongoDB as a hard dependency
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mongodb = await import('mongodb').catch(() => {
        throw new Error('MongoDB module not installed. Run: npm install mongodb');
      });
      const { MongoClient } = mongodb;
      
      const uri = this.getConnectionUri();
      const options = {
        maxPoolSize: this.config.maxPoolSize ?? 10,
        maxIdleTimeMS: this.config.maxIdleTimeMS ?? 30000,
        serverSelectionTimeoutMS: this.config.serverSelectionTimeoutMS ?? 5000,
        socketTimeoutMS: this.config.socketTimeoutMS ?? 45000,
        connectTimeoutMS: this.config.connectTimeoutMS ?? 10000,
        tls: this.config.ssl ?? false
      };

      const client = new MongoClient(uri, options);
      await client.connect();
      this.client = client;
      this.db = client.db(this.config.database);
    } catch (error) {
      throw new Error(`MongoDB connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.client as any).close();
      this.client = null;
      this.db = null;
    }
  }

  async insertOne(collection: string, data: Record<string, unknown>): Promise<string> {
    if (!this.db) throw new Error('Not connected to MongoDB');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (this.db as any).collection(collection).insertOne(data);
    return result.insertedId.toString();
  }

  async insertMany(collection: string, data: Record<string, unknown>[]): Promise<string[]> {
    if (!this.db) throw new Error('Not connected to MongoDB');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (this.db as any).collection(collection).insertMany(data);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Object.values(result.insertedIds).map((id: any) => id.toString());
  }

  async find(collection: string, query: Record<string, unknown>): Promise<Record<string, unknown>[]> {
    if (!this.db) throw new Error('Not connected to MongoDB');
    
    // Validate query to prevent NoSQL injection
    validateQuery(query);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (this.db as any).collection(collection).find(query).toArray();
  }

  async findOne(collection: string, query: Record<string, unknown>): Promise<Record<string, unknown> | null> {
    if (!this.db) throw new Error('Not connected to MongoDB');
    
    // Validate query to prevent NoSQL injection
    validateQuery(query);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (this.db as any).collection(collection).findOne(query);
  }

  async update(collection: string, query: Record<string, unknown>, update: Record<string, unknown>): Promise<number> {
    if (!this.db) throw new Error('Not connected to MongoDB');
    
    // Validate query to prevent NoSQL injection
    validateQuery(query);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (this.db as any).collection(collection).updateMany(query, { $set: update });
    return result.modifiedCount;
  }

  async delete(collection: string, query: Record<string, unknown>): Promise<number> {
    if (!this.db) throw new Error('Not connected to MongoDB');
    
    // Validate query to prevent NoSQL injection
    validateQuery(query);
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const result = await (this.db as any).collection(collection).deleteMany(query);
    return result.deletedCount;
  }

  async healthCheck(): Promise<boolean> {
    if (!this.client) return false;
    
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (this.client as any).db('admin').command({ ping: 1 });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * MongoDB-specific: Create an index on a collection
   * @param collection Collection name
   * @param keys Index specification
   * @param options Index options
   */
  async createIndex(collection: string, keys: Record<string, 1 | -1>, options?: Record<string, unknown>): Promise<string> {
    if (!this.db) throw new Error('Not connected to MongoDB');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (this.db as any).collection(collection).createIndex(keys, options);
  }

  /**
   * MongoDB-specific: Aggregate pipeline query
   * @param collection Collection name
   * @param pipeline Aggregation pipeline stages
   */
  async aggregate(collection: string, pipeline: Record<string, unknown>[]): Promise<Record<string, unknown>[]> {
    if (!this.db) throw new Error('Not connected to MongoDB');
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (this.db as any).collection(collection).aggregate(pipeline).toArray();
  }
}
