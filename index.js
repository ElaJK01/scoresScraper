import {getAllCzechScores, getAllPagesIds, getScoresFromNewButtons} from './library/czechWebFn.js';
import {getAllPolishHorses, getHorseData} from './library/polishHorsesFn.js';
import cron from 'node-cron';
import {checkNewPolishHorses, mergeCzechAndPolishData, writeToJson} from './library/helpers.js';
import {map, path, includes, pipe, filter, isNotNil, prop, flatten, concat, propOr} from 'ramda';
import fs from 'node:fs';
import jsonexport from 'jsonexport';

const czechRacesPath = `./downloads/czech_races_data.json`;
const polishHorsesPath = `./downloads/polish_horses_data.json`;

cron.schedule('00 18 * * *', async () => {
  const today = new Date().toJSON().slice(0, 10);
  if (!fs.existsSync(polishHorsesPath)) {
    console.log('not exist');
    //get all horses
    const polishHorses = await getAllPolishHorses()
      .then((res) => {
        return res;
      })
      .catch((err) => console.log('could not write polish horses data to db'));
    await writeToJson(polishHorses, 'polish_horses_data');
  } else {
    //get new horses
    console.log('exist');
    const allNewHorsesIdsFetched = await checkNewPolishHorses();
    const oldHorsesData = JSON.parse(fs.readFileSync(polishHorsesPath, {encoding: 'utf8', flag: 'r'}));
    const currentHorsesIds = map((horse) => path(['id'], horse), oldHorsesData);
    const horsesToBeFetched = pipe(
      map((id) => (!includes(id, currentHorsesIds) ? id : null)),
      filter((id) => isNotNil(id))
    )(allNewHorsesIdsFetched);
    const newDataFetched = [];
    for (let i = 0; i < horsesToBeFetched.length; i++) {
      const id = horsesToBeFetched[i];
      const horseData = await getHorseData(id)
        .then((res) => res)
        .catch(console.error);
      newDataFetched.push(horseData);
    }
    const newData = concat(oldHorsesData, newDataFetched);
    await fs.unlinkSync(polishHorsesPath);
    await writeToJson(newData, 'polish_horses_data');
  }
  if (!fs.existsSync(czechRacesPath)) {
    //get all races
    console.log('not exists!');
    const data = await getAllCzechScores()
      .then((res) => {
        console.log('finished');
        return res;
      })
      .catch((err) => console.log('could not write czech scores'));
    await writeToJson(data, 'czech_races_data');
  } else {
    const oldData = JSON.parse(fs.readFileSync(czechRacesPath, {encoding: 'utf8', flag: 'r'}));
    const oldIds = flatten(
      map((element) => {
        const races = propOr([], 'races', element);
        return map((race) => prop('raceId', race), races);
      }, oldData)
    );
    //get new races
    const newIdList = await getAllPagesIds()
      .then((res) => flatten(res))
      .catch((err) => console.log(err));
    const newButtons = pipe(
      map((element) => (!includes(element.raceId, oldIds) ? element : null)),
      filter((id) => isNotNil(id))
    )(newIdList);
    const updatedData = await getScoresFromNewButtons(newButtons)
      .then((response) => {
        return concat(response, oldData);
      })
      .catch((error) => console.log(error));
    await fs.unlinkSync(czechRacesPath);
    await writeToJson(updatedData, 'czech_races_data');
  }
  setTimeout(async () => {
    if (fs.existsSync(polishHorsesPath) && fs.existsSync(czechRacesPath)) {
      console.log('checking to merge');
      const parsedPolishData = JSON.parse(fs.readFileSync(polishHorsesPath, {encoding: 'utf8', flag: 'r'}));
      const parsedCzechData = JSON.parse(fs.readFileSync(czechRacesPath, {encoding: 'utf8', flag: 'r'}));
      const mergedAllData = mergeCzechAndPolishData(parsedPolishData, parsedCzechData);
      const csvPath = `./csv/allData_${today}`;
      await jsonexport(mergedAllData, function (err, csv) {
        if (err) return console.error(err);
        fs.writeFile(csvPath, csv, 'utf-8', (err) => {
          if (err) {
            throw err;
          } else {
            console.log(`File written successfully with ${mergedAllData.length} horses`);
          }
        });
      });
    } else {
      console.log('not every data');
    }
  }, 5000);
});
