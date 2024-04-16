import puppeteer from 'puppeteer';
import * as fs from 'fs';
import {getScores} from './library/czechWebFn.js';
import axios from 'axios';

// const getAllCzechScores = async () => {
//
//   const links = [
//     {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=1`, country: 'CR', startYear: 1989},
//     {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=2`, country: 'Slovensko', startYear: 1989},
//     {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=3`, country: 'abroad', startYear: 1997},
//   ];
//   let data = [];
//
//   for (let i = 0; i < links.length; i++) {
//     await getScores(links[i].baseUrl, links[i].startYear)
//       .then((res) => data.push({country: links[i].country, results: res}))
//       .catch(console.error);
//   }
//   console.log('data', data);
//   //write data to csv
//   const csv = JSON.stringify(data);
//   const path = `./downloads/file_Czech_Data${Date.now()}.csv`;
//   fs.writeFile(path, csv, (err) => {
//     if (err) {
//       throw err;
//     } else {
//       console.log('File written successfully\n');
//     }
//   });

// };
//
// getAllCzechScores();

//get horse's scores
const getHorsesScores = async (horseId) => {
  const baseUrlCareer = `https://homas.pkwk.org/homas/race/search/horse/${horseId}/career`;
  const baseUrlRaces = `https://homas.pkwk.org/homas/race/search/horse/5${horseId}/races`;
  const horseCareerData = await axios
    .get(baseUrlCareer)
    .then((response) => {
      console.log('this horses career has been fetched');
      return response.data;
    })
    .catch(console.error);
  const horseRacesData = await axios
    .get(baseUrlRaces)
    .then((response) => {
      console.log('this horses scores has been fetched');
      return response.data;
    })
    .catch(console.error);
  return {horseCareerData: horseCareerData || [], horseRacesData: horseCareerData || []};
};

const getAllPolishHorses = async (browser) => {
  const response = await axios
    .get('https://homas.pkwk.org/homas/race/search/horse')
    .then((res) => {
      console.log('all horses have been fetched');
      return res;
    })
    .catch(console.error);
  const horses = response ? response.data.filter((horse) => horse.dateOfBirth >= 2004) : [];
  const horsesIds = horses.map((horse) => horse.id);
  let data = [];
  for (let i = 0; i < 2; i++) {
    const horseId = horsesIds[i];
    const horseData = await axios
      .get(`https://homas.pkwk.org/homas/race/search/horse/${horseId}`)
      .then((response) => response.data)
      .catch(console.error);
    const horseScores = await getHorsesScores(horseId)
      .then((response) => response)
      .catch(console.error);
    data.push({horseData: horseData || {}, horseScores: horseScores || {}});
  }
  console.log('data', data);
  //return data;
};

getAllPolishHorses();
