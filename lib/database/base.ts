/**
 * Base Database Interface
 * Provides a common interface for all NoSQL database integrations
 * Following PRZ OS principles: Complete, Modular, and Resonance-aligned
 * 
 * SECURITY NOTE: All database implementations MUST:
 * - Use validateQuery() from lib/security.ts to prevent NoSQL injection
 * - Load credentials from environment variables, not config objects
 * - Sanitize all user inputs before queries
 */

/**
 * Generic database configuration
 * NOTE: For security, credentials (username/password) should be loaded
 * from environment variables in the adapter, not passed in config.
 */
export interface DatabaseConfig {
  host?: string;
  port?: number;
  database?: string | number; // Allow both string and number for database identifier
  [key: string]: unknown;
}

/**
 * Common database operations interface
 * All database adapters implement this interface for consistent usage
 * 
 * Type parameter T represents the document/record type.
 * Use Record<string, unknown> for flexible schemas.
 */
export interface DatabaseAdapter<T = Record<string, unknown>> {
  /**
   * Connect to the database
   * @returns Promise that resolves when connected
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the database
   * @returns Promise that resolves when disconnected
   */
  disconnect(): Promise<void>;

  /**
   * Insert a single document/record
   * @param collection Collection/table name
   * @param data Data to insert
   * @returns Promise with the inserted document ID
   */
  insertOne(collection: string, data: T): Promise<string>;

  /**
   * Insert multiple documents/records
   * @param collection Collection/table name
   * @param data Array of data to insert
   * @returns Promise with array of inserted document IDs
   */
  insertMany(collection: string, data: T[]): Promise<string[]>;

  /**
   * Find documents by query
   * @param collection Collection/table name
   * @param query Query object (will be validated for security)
   * @returns Promise with array of matching documents
   */
  find(collection: string, query: Record<string, unknown>): Promise<T[]>;

  /**
   * Find a single document by query
   * @param collection Collection/table name
   * @param query Query object (will be validated for security)
   * @returns Promise with the matching document or null
   */
  findOne(collection: string, query: Record<string, unknown>): Promise<T | null>;

  /**
   * Update documents matching query
   * @param collection Collection/table name
   * @param query Query object (will be validated for security)
   * @param update Update operations
   * @returns Promise with number of updated documents
   */
  update(collection: string, query: Record<string, unknown>, update: Partial<T>): Promise<number>;

  /**
   * Delete documents matching query
   * @param collection Collection/table name
   * @param query Query object (will be validated for security)
   * @returns Promise with number of deleted documents
   */
  delete(collection: string, query: Record<string, unknown>): Promise<number>;

  /**
   * Check if database connection is healthy
   * @returns Promise with boolean indicating health status
   */
  healthCheck(): Promise<boolean>;
}

/**
 * Database factory for creating database adapters
 */
export type DatabaseType = 'mongodb' | 'redis' | 'cassandra' | 'firebase' | 'firestore' | 'dynamodb' | 'couchbase' | 'neo4j';

export interface DatabaseFactory {
  createAdapter(type: DatabaseType, config: DatabaseConfig): DatabaseAdapter;
}
