import axios from 'axios';
import util from 'node:util';
import {convertDate, writeToCsv} from './helpers.js';
import {map, propOr} from 'ramda';

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
  const races = map((data) => {
    const {id, name, order, place, placeBefore, jockeyWeight, record, prize, jockey, horse, trainer, race} = data;
    const {date, prizes, currency, temperature, weather, description, country, category, city, style, trackType} = race;
    const jockeyName = `${propOr('', 'firstName', jockey)} ${propOr('', 'lastName', jockey)}`;
    const trainerName = `${propOr('', 'firstName', trainer)} ${propOr('', 'lastName', trainer)}`;
    const raceCountry = propOr('', 'englishName', country);
    const raceCity = propOr('', 'name', city);

    return {
      raceId: id,
      raceDate: convertDate(date),
      year: convertDate(date).slice(6, 10),
      siteId: '',
      name: name || '',
      order: order || '',
      place: place || '',
      prize: prize || '',
      jockey: jockeyName,
      jockeyWeight,
      time: '',
      trainer: trainerName,
      country: raceCountry,
      city: raceCity,
    };
  }, horseRacesData);
  return {horseCareerData: horseCareerData || {}, races};
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
  const {
    id,
    name,
    suffix,
    dateOfBirth,
    sex,
    sexForStatistics,
    breed,
    horseFromPolishBreeding,
    note,
    mother,
    father,
    color,
    trainer,
    raceOwners,
    breeders,
    raceSex,
  } = horseData;
  const basicInfo = {
    id,
    name,
    dateOfBirth,
    sex,
    breed,
    horseFromPolishBreeding,
    breeders: map((breeder) => ({name: propOr('', 'name', breeder)}), breeders),
    suffix,
    mother: {name: mother.name, sex: mother.sex, breed: mother.breed, suffix: mother.suffix},
    father: {name: father.name, sex: father.sex, breed: father.breed, suffix: father.suffix},
    color,
    trainer: `${propOr('', 'firstName', trainer)} ${propOr('', 'lastName', trainer)}`,
    raceOwners: map((owner) => ({name: propOr('', 'name', owner)}), raceOwners),
  };
  return {...basicInfo, ...horseScores};
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
