import {getAllCzechScores} from './library/czechWebFn.js';
import {getAllPolishHorses, getHorseData} from './library/polishHorsesFn.js';
import cron from 'node-cron';
import {checkNewPolishHorses} from './library/helpers.js';
import {JSONFilePreset} from 'lowdb/node';
import {pathOr, isEmpty, map, path, includes, pipe, filter, isNotNil, forEach} from 'ramda';
import axios from 'axios';

const db = await JSONFilePreset('db.json', {polishHorses: [], czechRaces: []});

// await getAllCzechScores()
//   .then((res) => console.log('finished writing czech scores to csv'))
//   .catch((err) => console.log('could not write czech scores to csv'));

cron.schedule('* 18 * * *', async () => {
  //const today = new Date().toJSON().slice(0, 10);
  const horses = pathOr([], ['data', 'polishHorses'], db);
  //todo: get czech scores
  if (isEmpty(horses)) {
    //get all horses
    await getAllPolishHorses()
      .then((res) => {
        db.data.polishHorses = res;
      })
      .catch((err) => console.log('could not write polish horses data to db'));
    await db.write();
  } else {
    //get new horses
    const allNewHorsesIdsFetched = await checkNewPolishHorses();
    const currentHorsesIds = map((horse) => path(['horseData', 'id'], horse), horses);
    const horsesToBeFetched = pipe(
      map((id) => (!includes(id, currentHorsesIds) ? id : null)),
      filter((id) => isNotNil(id))
    )(allNewHorsesIdsFetched);
    await forEach(async (id) => {
      const horseData = await getHorseData(id)
        .then((res) => res)
        .catch(console.error);
      await db.update(({polishHorses}) => polishHorses.push(horseData));
    }, horsesToBeFetched);
  }
});
