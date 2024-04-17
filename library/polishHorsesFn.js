import axios from 'axios';
import * as fs from 'node:fs';

//get horse's scores
export const getHorsesScores = async (horseId) => {
  const baseUrlCareer = `https://homas.pkwk.org/homas/race/search/horse/${horseId}/career`;
  const baseUrlRaces = `https://homas.pkwk.org/homas/race/search/horse/${horseId}/races`;
  const horseCareerData = await axios
    .get(baseUrlCareer)
    .then((response) => {
      return response.data;
    })
    .catch(console.error);
  const horseRacesData = await axios
    .get(baseUrlRaces)
    .then((response) => {
      return response.data;
    })
    .catch(console.error);
  console.log(`${horseId} -this horses scores has been fetched`);
  return {horseCareerData: horseCareerData || {}, horseRacesData: horseRacesData || []};
};

export const getAllPolishHorses = async (browser) => {
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
  for (let i = 0; i < horsesIds.length; i++) {
    const horseId = horsesIds[i];
    const horseData = await axios
      .get(`https://homas.pkwk.org/homas/race/search/horse/${horseId}`)
      .then((response) => response.data)
      .catch(console.error);
    const horseScores = await getHorsesScores(horseId)
      .then((response) => {
        return response;
      })
      .catch(console.error);
    data.push({horseData: horseData || {}, horseScores});
  }
  fs.writeFile('./downloads/horses.json', JSON.stringify(data), (err) => {
    // Checking for errors
    if (err) throw err;
    // Success
    console.log('Done writing', horsesIds.length, 'horses data');
  });
  //return data;
};
