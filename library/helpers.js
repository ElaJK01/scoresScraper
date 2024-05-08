import jsonexport from 'jsonexport';
import fs from 'node:fs';
import axios from 'axios';

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
  const pathCsv = `./downloads/${text}.csv`;
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

export const checkNewPolishHorses = async () => {
  const allHorses = await axios
    .get('https://homas.pkwk.org/homas/race/search/horse')
    .then((res) => {
      console.log('all horses have been fetched');
      return res;
    })
    .catch((error) => console.log(`unable to get all horses data:`, error));
  const horses = allHorses ? allHorses.data.filter((horse) => horse.dateOfBirth >= 2004) : [];
  if (horses.length < 1) {
    console.log('no horses meeting the criteria');
  } else {
    const horsesIds = horses.map((horse) => horse.id);
    console.log('number of horses', horsesIds.length);
    return horsesIds;
  }
};

export const writeToJson = async (data, text) => {
  const pathJson = `./downloads/${text}.json`;
  fs.writeFile(pathJson, JSON.stringify(data), (err) => {
    if (err) {
      console.error(err);
    } else {
      // file written successfully
    }
  });
};
