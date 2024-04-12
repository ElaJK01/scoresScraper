import puppeteer from 'puppeteer';
import * as fs from 'fs';
import {getScores} from './library/czechWebFn.js';

const getAllCzechScores = async () => {
  const startTime = new Date().getTime();

  const links = [
    {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=1`, country: 'CR', startYear: 1989},
    {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=2`, country: 'Slovensko', startYear: 1989},
    {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=3`, country: 'abroad', startYear: 1997},
  ];
  let data = [];

  for (let i = 0; i < links.length; i++) {
    await getScores(links[i].baseUrl, links[i].startYear)
      .then((res) => data.push({country: links[i].country, results: res}))
      .catch(console.error);
  }
  console.log('data', data);
  //write data to csv
  const csv = JSON.stringify(data);
  const path = `./downloads/file_Czech_Data${Date.now()}.csv`;
  fs.writeFile(path, csv, (err) => {
    if (err) {
      throw err;
    } else {
      console.log('File written successfully\n');
    }
  });
  const endTime = new Date().getTime();
  const timeTaken = endTime - startTime;
  console.log('Function took ' + timeTaken + ' milliseconds');
};

getAllCzechScores();
