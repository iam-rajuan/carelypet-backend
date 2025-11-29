import http from "http";
import app from "./app";
import connectDB from "./config/db";

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI;

async function startServer() {
  try {
    await connectDB(MONGO_URI);
    console.log("MongoDB connected");

    const server = http.createServer(app);

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to start server:", message);
    process.exit(1);
  }
}

void startServer();
