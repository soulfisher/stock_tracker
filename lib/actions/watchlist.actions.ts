"use server";

import { connectToDatabase } from "@/database/mongoose";
import { Watchlist } from "@/database/models/watchlist.model";

/**
 * Get watchlist symbols for a user by their email
 * @param email User's email address
 * @returns Array of stock symbols in the user's watchlist
 */
export const getWatchlistSymbolsByEmail = async (
  email: string,
): Promise<string[]> => {
  try {
    // Connect to the database
    const mongoose = await connectToDatabase();
    const db = mongoose.connection.db;
    if (!db) throw new Error("Mongoose connection not connected");

    // Find the user by email
    const user = await db.collection("user").findOne({ email });

    // If no user found, return empty array
    if (!user) {
      return [];
    }

    // Get the user's ID (either id or _id)
    const userId = user.id || user._id.toString();

    // Query the watchlist for this user
    const watchlistItems = await Watchlist.find({ userId })
      .select("symbol")
      .lean();

    // Return just the symbols as strings
    return watchlistItems.map((item) => item.symbol);
  } catch (error) {
    console.error("Error fetching watchlist symbols:", error);
    return [];
  }
};
