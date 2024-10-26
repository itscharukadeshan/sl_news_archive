/** @format */

const fs = require("fs");
const path = require("path");

const inputFilePath = "../data/archive-all.json";
const checkSumFilePath = "../data/checkSums.json";
const archiveDir = "../data/archive";
const duplicateFilePath = "../data/duplicates.json";

function loadCheckSums() {
  if (fs.existsSync(checkSumFilePath)) {
    const data = fs.readFileSync(checkSumFilePath, "utf-8");
    return new Set(JSON.parse(data));
  }
  return new Set();
}

function saveCheckSums(checkSums) {
  fs.writeFileSync(
    checkSumFilePath,
    JSON.stringify(Array.from(checkSums), null, 2),
    "utf-8"
  );
}

function loadExistingData(sourceDir, date) {
  const filePath = path.join(sourceDir, `archive_${date}.json`);
  if (fs.existsSync(filePath)) {
    const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    return Array.isArray(data) ? data : [];
  }
  return [];
}

async function cleanArchive() {
  const existingCheckSums = loadCheckSums();
  const newCheckSums = new Set(existingCheckSums);

  if (!fs.existsSync(inputFilePath)) {
    console.error("Input archive file not found.");
    return;
  }

  const archiveData = JSON.parse(fs.readFileSync(inputFilePath, "utf-8"));
  const duplicates = {};

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

        if (
          existingCheckSums.has(article.checkSum) ||
          newCheckSums.has(article.checkSum)
        ) {
          console.log(
            `Duplicate article detected based on checkSum: ${article.title}`
          );

          if (!duplicates[source]) {
            duplicates[source] = [];
          }
          duplicates[source].push(article);
        } else {
          newCheckSums.add(article.checkSum);
          mergedData.push(article);
        }
      });

      const outputFilePath = path.join(
        sourceDir,
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

  console.log("Archive updated and saved.");
}

cleanArchive().catch((error) =>
  console.error("Error cleaning archive:", error)
);
