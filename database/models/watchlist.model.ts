import mongoose, { Document, model, Model, models, Schema } from "mongoose";

// Define the interface for the Watchlist document
export interface WatchlistItem extends Document {
  userId: string;
  symbol: string;
  company: string;
  addedAt: Date;
}

// Create the Watchlist schema
const WatchlistSchema = new Schema<WatchlistItem>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  symbol: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  },
  company: {
    type: String,
    required: true,
    trim: true,
  },
  addedAt: {
    type: Date,
    default: Date.now,
  },
});

// Add compound index on userId + symbol to prevent duplicates
WatchlistSchema.index({ userId: 1, symbol: 1 }, { unique: true });

// Use the models?.Watchlist || model pattern to avoid hot-reload issues
export const Watchlist: Model<WatchlistItem> = 
  models?.Watchlist || model<WatchlistItem>("Watchlist", WatchlistSchema);