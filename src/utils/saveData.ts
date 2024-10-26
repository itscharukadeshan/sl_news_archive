/** @format */

import fs from "fs";

async function saveJsonToFile(data: any, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    fs.writeFile(filePath, JSON.stringify(data, null, 2), (err) => {
      if (err) {
        return reject(err);
      }
      resolve();
    });
  });
}

export { saveJsonToFile };
