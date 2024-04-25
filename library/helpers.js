import jsonexport from 'jsonexport';
import fs from 'node:fs';

export const createEntries = (arr1, arr2) => {
  let entries = [];
  for (let i = 0; i < arr1.length; i++) {
    entries.push([arr1[i], arr2[i]]);
  }
  return new Map(entries);
};

export const transformRowsArray = (array) => {
  const headerKeys = array[0];
  const rows = array.slice(1);
  const rowsObjects = rows.map((row) => {
    return Object.fromEntries(createEntries(headerKeys, row));
  });
  return rowsObjects;
};

export const writeToCsv = async (data, text) => {
  const date = new Date(Date.now()).toISOString();
  const pathCsv = `./downloads/file_${text}_${date}.csv`;
  await jsonexport(data, function (err, csv) {
    if (err) return console.error(err);
    fs.writeFile(pathCsv, csv, 'utf-8', (err) => {
      if (err) {
        throw err;
      } else {
        console.log(`File written successfully with ${data.length} ${text}`);
      }
    });
  });
};
