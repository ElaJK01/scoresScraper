import {getAllCzechScores, getAllPagesIds, getScoresFromNewButtons} from './library/czechWebFn.js';
import {getAllPolishHorses, getHorseData} from './library/polishHorsesFn.js';
import cron from 'node-cron';
import {checkNewPolishHorses, writeToJson} from './library/helpers.js';
import {map, path, includes, pipe, filter, isNotNil, prop, flatten, concat} from 'ramda';
import fs from 'node:fs';

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
    const currentHorsesIds = map((horse) => path(['horseData', 'id'], horse), oldHorsesData);
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
