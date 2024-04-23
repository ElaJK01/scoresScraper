import * as fs from 'fs';
import {getScores} from './library/czechWebFn.js';
import {getAllPolishHorses} from './library/polishHorsesFn.js';
import * as util from 'node:util';

const getAllCzechScores = async () => {
  const links = [
    // {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=1`, country: 'CR', startYear: 1989},
    // {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=2`, country: 'Slovensko', startYear: 1989},
    {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=3`, country: 'abroad', startYear: 1997},
  ];
  let data = [];

  for (let i = 0; i < links.length; i++) {
    await getScores(links[i].baseUrl, links[i].startYear)
      .then((res) => data.push({country: links[i].country, results: res}))
      .catch(console.error);
  }

  console.log(util.inspect(data, {depth: null, colors: true}));

  //write data to csv
  const json = JSON.stringify(data);
  const path = `./downloads/file_Czech_Data${Date.now()}.json`;
  fs.writeFile(path, json, 'utf-8', (err) => {
    if (err) {
      throw err;
    } else {
      console.log('File written successfully\n');
    }
  });
};
//
getAllCzechScores();

// getAllPolishHorses();
