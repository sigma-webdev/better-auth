/**
 * Database Connection Manager
 *
 * This file handles the connection to our MongoDB database using Mongoose.
 *
 * How it works:
 * 1. We check if we have a MongoDB connection string in our environment variables
 * 2. We create a caching system to avoid creating multiple connections to the database
 * 3. The first time we connect, we store the connection in a global variable
 * 4. For all future connection requests, we reuse the existing connection
 *
 * Why this matters:
 * - In development, Next.js hot-reloads can cause multiple connection attempts
 * - In production, we want to reuse connections for better performance
 * - This approach prevents the "too many connections" error in MongoDB
 */

import mongoose from "mongoose";

// MongoDB connection string from environment variables
const MONGODB_URI = process.env.MONGODB_URI;

// Ensure MongoDB URI is defined in environment variables
if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable");
}

// Define a type for our cached connection
interface CachedConnection {
  conn: mongoose.Connection | null;
  promise: Promise<typeof mongoose> | null;
}

// Declare global namespace augmentation to avoid using 'any'
declare global {
  // eslint-disable-next-line no-var
  var mongooseConnection: CachedConnection | undefined;
}

// Use the global variable for caching or initialize it
const cached: CachedConnection = global.mongooseConnection || {
  conn: null,
  promise: null,
};

// Store in global for reuse between hot reloads in development
global.mongooseConnection = cached;

/**
 * Connects to MongoDB using Mongoose with connection caching.
 * @returns A promise that resolves to the Mongoose connection
 */
async function connectDB(): Promise<mongoose.Connection> {
  // Return existing connection if available
  if (cached.conn) {
    return cached.conn;
  }

  // Create new connection if none exists
  if (!cached.promise) {
    // We've already checked MONGODB_URI is defined above
    cached.promise = mongoose
      .connect(MONGODB_URI as string)
      .then((mongoose) => mongoose);
  }

  try {
    const mongoose = await cached.promise;
    cached.conn = mongoose.connection;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

export default connectDB;
