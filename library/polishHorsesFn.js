import axios from 'axios';
import * as fs from 'node:fs';
import jsonexport from 'jsonexport';
import util from 'node:util';

//get horse scores
export const getHorsesScores = async (horseId) => {
  const baseUrlCareer = `https://homas.pkwk.org/homas/race/search/horse/${horseId}/career`;
  const baseUrlRaces = `https://homas.pkwk.org/homas/race/search/horse/${horseId}/races`;
  const horseCareerData = await axios
    .get(baseUrlCareer)
    .then((response) => {
      return response.data;
    })
    .catch((error) => console.log(`can not fetch career data of horse with id number ${horseId} due to:`, error));
  const horseRacesData = await axios
    .get(baseUrlRaces)
    .then((response) => {
      return response.data;
    })
    .catch((error) => console.log(`can not fetch races data of horse with id number ${horseId} due to:`, error));
  console.log(`horse id number: ${horseId} - scores have been fetched`);
  return {horseCareerData: horseCareerData || {}, horseRacesData: horseRacesData || []};
};

export const getAllPolishHorses = async () => {
  const response = await axios
    .get('https://homas.pkwk.org/homas/race/search/horse')
    .then((res) => {
      console.log('all horses have been fetched');
      return res;
    })
    .catch((error) => console.log(`unable to get all horses data:`, error));
  const horses = response ? response.data.filter((horse) => horse.dateOfBirth >= 2004) : [];
  if (horses.length < 1) {
    console.log('no horses meeting the criteria');
  } else {
    const horsesIds = horses.map((horse) => horse.id);
    let data = [];
    for (let i = 0; i < horsesIds.length; i++) {
      const horseId = horsesIds[i];
      const horseData = await axios
        .get(`https://homas.pkwk.org/homas/race/search/horse/${horseId}`)
        .then((response) => response.data)
        .catch((error) => console.log(`no data about horse id number ${horseId} due to: ${error}`));
      const horseScores = await getHorsesScores(horseId)
        .then((response) => {
          return response;
        })
        .catch((error) => `no data with scores of horse ${horseId}: ${error}`);
      data.push({horseData: horseData || {}, horseScores});
    }

    console.log(util.inspect(data, {depth: null, colors: true}));

    const date = new Date(Date.now()).toISOString();
    const pathCsv = `./downloads/file_polish_horses${date}.csv`;
    //write data to csv
    await jsonexport(data, function (err, csv) {
      if (err) return console.error(err);
      fs.writeFile(pathCsv, csv, 'utf-8', (err) => {
        if (err) {
          throw err;
        } else {
          console.log(`File written successfully with ${data.length} horses data`);
        }
      });
    });

    //write data to json
    // fs.writeFile(`./downloads/horses_${Date.now()}.json`, JSON.stringify(data), 'utf-8', (err) => {
    //   // Checking for errors
    //   if (err) throw err;
    //   // Success
    //   console.log('Done writing', horsesIds.length, 'horses data');
    // });
  }
};
