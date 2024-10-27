/** @format */

import fs from "fs";
import path from "path";

const inputFilePath = path.join(__dirname, "../data/archive-all.json");
const checkSumFilePath = path.join(__dirname, "../data/checkSums.json");
const archiveDir = path.join(__dirname, "../data/archive");
const duplicateFilePath = path.join(__dirname, "../data/duplicates.json");

interface Article {
  title?: string;
  checkSum?: string;
  [key: string]: any;
}

interface ArchiveData {
  [source: string]: {
    data: Article[];
  };
}

interface DuplicateData {
  [source: string]: Article[];
}

function loadCheckSums(): Set<string> {
  if (fs.existsSync(checkSumFilePath)) {
    const data = fs.readFileSync(checkSumFilePath, "utf-8");
    return new Set(JSON.parse(data));
  }
  return new Set();
}

function saveCheckSums(checkSums: Set<string>): void {
  fs.writeFileSync(
    checkSumFilePath,
    JSON.stringify(Array.from(checkSums), null, 2),
    "utf-8"
  );
}

function loadExistingData(sourceDir: string, date: string): Article[] {
  const filePath = path.join(sourceDir, `archive_${date}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return Array.isArray(data) ? data : [];
  }
  return [];
}

async function cleanArchive(): Promise<void> {
  if (
    !fs.existsSync(inputFilePath) ||
    fs.readFileSync(inputFilePath, "utf-8").trim() === ""
  ) {
    console.error("Input archive file not found or empty. Skipping process.");
    return;
  }

  const existingCheckSums = loadCheckSums();
  const newCheckSums = new Set(existingCheckSums);
  const archiveData: ArchiveData = JSON.parse(
    fs.readFileSync(inputFilePath, "utf-8")
  );
  const duplicates: DuplicateData = {};

  const currentDate = new Date().toISOString().split("T")[0];
  const currentDateObj = new Date(currentDate);
  const year = currentDateObj.getFullYear();
  const monthName = currentDateObj.toLocaleString("default", { month: "long" });

  Object.keys(archiveData).forEach((source) => {
    const sourceContent = archiveData[source];
    const articles = sourceContent.data;

    if (Array.isArray(articles)) {
      const sourceDir = path.join(archiveDir, source, String(year), monthName);
      if (!fs.existsSync(sourceDir)) {
        fs.mkdirSync(sourceDir, { recursive: true });
      }

      const existingData = loadExistingData(sourceDir, currentDate);
      const mergedData = [...existingData];

      articles.forEach((article) => {
        if (!article.checkSum) {
          console.warn(
            `Article missing checkSum: ${article.title || "No Title"}`
          );
          return;
        }

        if (existingCheckSums.has(article.checkSum)) {
          if (!duplicates[source]) {
            duplicates[source] = [];
          }
          duplicates[source].push(article);
          console.log(
            `Duplicate article detected based on checkSum: ${article.title}`
          );
        } else {
          newCheckSums.add(article.checkSum);
          mergedData.push(article);
        }
      });

      const dailyArchiveDir = path.join(sourceDir, `archive_${currentDate}`);
      if (!fs.existsSync(dailyArchiveDir)) {
        fs.mkdirSync(dailyArchiveDir, { recursive: true });
      }

      const outputFilePath = path.join(
        dailyArchiveDir,
        `archive_${currentDate}.json`
      );
      fs.writeFileSync(
        outputFilePath,
        JSON.stringify(mergedData, null, 2),
        "utf-8"
      );
      console.log(`Updated archive for ${source} at ${outputFilePath}`);
    } else {
      console.warn(`Skipping non-array data entry for source: ${source}`);
    }
  });

  saveCheckSums(newCheckSums);

  if (Object.keys(duplicates).length > 0) {
    fs.writeFileSync(
      duplicateFilePath,
      JSON.stringify(duplicates, null, 2),
      "utf-8"
    );
    console.log(`Duplicate articles saved to ${duplicateFilePath}`);
  }

  fs.writeFileSync(inputFilePath, "", "utf-8");
  console.log("Cleared archive-all.json after processing.");
}

cleanArchive().catch((error) =>
  console.error("Error cleaning archive:", error)
);

export default cleanArchive;
