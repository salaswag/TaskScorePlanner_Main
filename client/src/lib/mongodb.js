// Note: This file is for reference only as the backend uses in-memory storage
// The MongoDB connection would be handled server-side in a real implementation

export const MONGODB_URI = "mongodb+srv://salaswag:Borderbiz8k@clusterfortask.riwouqe.mongodb.net/";

// This would be used server-side with mongoose or native MongoDB driver
export const connectToMongoDB = async () => {
  try {
    // Connection logic would go here in server environment
    console.log("MongoDB connection configured");
  } catch (error) {
    console.error("MongoDB connection error:", error);
  }
};
