import {getAllCzechScores, getAllPagesIds, getScoresFromNewButtons} from './library/czechWebFn.js';
import {getAllPolishHorses, getHorseData} from './library/polishHorsesFn.js';
import cron from 'node-cron';
import {checkNewPolishHorses, writeToJson} from './library/helpers.js';
import {JSONFilePreset} from 'lowdb/node';
import {
  pathOr,
  isEmpty,
  map,
  path,
  includes,
  pipe,
  filter,
  isNotNil,
  forEach,
  prop,
  propOr,
  flatten,
  length,
  equals,
  concat,
  slice,
} from 'ramda';
import util from 'node:util';
import fs from 'node:fs';

//const db = await JSONFilePreset('db.json', {polishHorses: [], czechRaces: []});

const czechRacesPath = `./downloads/czech_races_data.json`;

cron.schedule('52 8 * * *', async () => {
  //const today = new Date().toJSON().slice(0, 10);
  //const horses = pathOr([], ['data', 'polishHorses'], db);
  //const czechRaces = pathOr([], ['data', 'czechRaces'], db);
  // if (isEmpty(horses)) {
  //   //get all horses
  //   await getAllPolishHorses()
  //     .then((res) => {
  //       db.data.polishHorses = res;
  //     })
  //     .catch((err) => console.log('could not write polish horses data to db'));
  //   await db.write();
  // } else {
  //   //get new horses
  //   const allNewHorsesIdsFetched = await checkNewPolishHorses();
  //   const currentHorsesIds = map((horse) => path(['horseData', 'id'], horse), horses);
  //   const horsesToBeFetched = pipe(
  //     map((id) => (!includes(id, currentHorsesIds) ? id : null)),
  //     filter((id) => isNotNil(id))
  //   )(allNewHorsesIdsFetched);
  //   await forEach(async (id) => {
  //     const horseData = await getHorseData(id)
  //       .then((res) => res)
  //       .catch(console.error);
  //     await db.update(({polishHorses}) => polishHorses.push(horseData));
  //   }, horsesToBeFetched);
  // }
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
    const oldIds = map((element) => prop('id', element), oldData);
    //get new races
    const newIdList = await getAllPagesIds()
      .then((res) => flatten(res))
      .catch((err) => console.log(err));
    const newButtons = pipe(
      map((element) => (!includes(element.id, oldIds) ? element : null)),
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
});
