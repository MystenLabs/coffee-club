import cors from "cors";
import express, { Request, Response } from "express";
import { RequestHandler } from "express";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());

const aggregators = [
  "https://aggregator.walrus-testnet.walrus.space",
  // "https://wal-aggregator-testnet.staketab.org",
  // "https://walrus-testnet-aggregator.redundex.com",
  // "https://walrus-testnet-aggregator.nodes.guru",
  // "https://aggregator.walrus.banansen.dev",
  // "https://walrus-testnet-aggregator.everstake.one",
  // "https://publisher.walrus-testnet.walrus.space",
  // "https://wal-publisher-testnet.staketab.org",
  // "https://walrus-testnet-publisher.redundex.com",
  // "https://walrus-testnet-publisher.nodes.guru",
  // "https://publisher.walrus.banansen.dev",
  // "https://walrus-testnet-publisher.everstake.one",
];

function getRandomAggregator(): string {
  return aggregators[Math.floor(Math.random() * aggregators.length)];
}

app.get("/", (req: Request, res: Response) => {
  res.send("Hello, TypeScript Express!");
});

const BLOB_IDS: { [key: string]: string } = {
  "0x55ab1a8e9a9d57d9784d03cd78e0e9c73845addb36982b0ab14f8bab6f2206ae":
    "J9W9Sp_SaAGST4YXr1cKONnwAA91aIo5cnEwgFYKZJI",
};

const imageHandler: RequestHandler<{ cafeId: string }> = async (req, res) => {
  const { cafeId } = req.params;

  const blobId = BLOB_IDS[cafeId!];
  if (!blobId) {
    res.status(404).send("Blob not found for the given cafeId.");
    return;
  }

  try {
    const aggregator = getRandomAggregator();
    const blobUrl = `${aggregator}/v1/blobs/${blobId}`;
    console.log(`Fetching blob from: ${blobUrl}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    let response;
    try {
      response = await fetch(blobUrl, { signal: controller.signal });
    } finally {
      clearTimeout(timeout);
    }

    if (!response.ok) {
      res.status(502).send(`Failed to fetch blob: ${response.statusText}`);
      return;
    }

    const contentType = "image/png"; // Force it to PNG
    res.setHeader("Content-Type", contentType);
    res.setHeader("Content-Disposition", `inline; filename="${blobId}.png"`);

    if (response.body) {
      const { Readable } = require("stream");
      const nodeStream = Readable.from(response.body as any);
      nodeStream.pipe(res);
    } else {
      res.status(502).send("No response body received from aggregator.");
    }
  } catch (error) {
    console.error("Error fetching blob:", error);
    res.status(500).send("Internal Server Error");
  }
};

app.get("/image/:cafeId", imageHandler);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
