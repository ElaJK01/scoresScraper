import axios from 'axios';
import util from 'node:util';
import {writeToCsv} from './helpers.js';

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

export const getHorseData = async (horseId) => {
  const horseData = await axios
    .get(`https://homas.pkwk.org/homas/race/search/horse/${horseId}`)
    .then((response) => response.data)
    .catch((error) => console.log(`no data about horse id number ${horseId} due to: ${error}`));
  const horseScores = await getHorsesScores(horseId)
    .then((response) => {
      return response;
    })
    .catch((error) => `no data with scores of horse ${horseId}: ${error}`);
  return {horseData: horseData || {}, horseScores};
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
      const horseData = await getHorseData(horseId);
      data.push(horseData);
    }

    //console.log(util.inspect(data, {depth: null, colors: true}));
    //await writeToCsv(data, 'polish_horses_data');
    return data;
  }
};
