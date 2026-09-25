/** @format */

import express, { Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import {
  archive,
  archiveAll,
  isArchiveAllBusy,
  isValidArchiveUrl,
} from "./services/archive";
import { PORT } from "./config";
import { Urls } from "./constants/Urls";
import { cacheGet, cacheSet, CACHE_TTL } from "./utils/cache";

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: "100kb" }));

const scrapeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, try again later." },
});
app.use(["/archive", "/archive-all"], scrapeLimiter);

app.get("/", (_req: Request, res: Response) => {
  res.send("Hello World!");
});

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok" });
});

app.get("/archive", async (req: Request, res: Response) => {
  const url = req.query.url as string | undefined;

  if (!url) {
    res.status(400).json({
      error: "Missing required query parameter: url",
      validUrls: Object.values(Urls),
    });
    return;
  }

  if (!isValidArchiveUrl(url)) {
    res.status(400).json({
      error: "Invalid URL: check the docs for valid URLs and try again.",
      validUrls: Object.values(Urls),
    });
    return;
  }

  const cached = cacheGet(`archive:${url}`);
  if (cached !== undefined) {
    res.json(cached);
    return;
  }

  try {
    const data = await archive(url);
    cacheSet(`archive:${url}`, data, CACHE_TTL.ARCHIVE);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Scrape failed",
    });
  }
});

app.get("/archive-all", async (_req: Request, res: Response) => {
  if (isArchiveAllBusy()) {
    res
      .status(503)
      .json({ error: "Archive-all already in progress, try again later." });
    return;
  }

  const cached = cacheGet(`archive-all`);
  if (cached !== undefined) {
    res.json(cached);
    return;
  }

  try {
    const data = await archiveAll();
    cacheSet(`archive-all`, data, CACHE_TTL.ARCHIVE_ALL);
    res.json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Archive-all failed",
    });
  }
});

let server: ReturnType<typeof app.listen> | null = null;

if (require.main === module) {
  server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
  // Don't hold the event loop open forever on idle keep-alive sockets.
  server.timeout = 60_000;

  const shutdown = (signal: string) => {
    console.log(`Received ${signal}, shutting down...`);
    if (server) {
      server.close(() => process.exit(0));
      // Force-exit if connections don't drain.
      setTimeout(() => process.exit(0), 10_000).unref();
    } else {
      process.exit(0);
    }
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

export default app;
