import {getAllCzechScores, getAllPagesIds, getScoresFromNewButtons} from './library/czechWebFn.js';
import {getAllPolishHorses, getHorseData} from './library/polishHorsesFn.js';
import cron from 'node-cron';
import {checkNewPolishHorses} from './library/helpers.js';
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
} from 'ramda';
import util from 'node:util';

const db = await JSONFilePreset('db.json', {polishHorses: [], czechRaces: []});

cron.schedule('02 13 * * *', async () => {
  //const today = new Date().toJSON().slice(0, 10);
  const horses = pathOr([], ['data', 'polishHorses'], db);
  const czechRaces = pathOr([], ['data', 'czechRaces'], db);
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
  if (isEmpty(czechRaces)) {
    //get all races
    await getAllCzechScores()
      .then((res) => {
        db.data.czechRaces = res;
      })
      .catch((err) => console.log('could not write czech scores'));
    await db.write();
  } else {
    //get new races
    const newIdList = await getAllPagesIds()
      .then((res) => flatten(res))
      .catch((err) => console.log(err));
    const currentPageIds = pipe(map((element) => propOr('', 'id'), filter(!equals(''))))(czechRaces);
    console.log('current ids', currentPageIds);
    const newButtons = pipe(
      map((element) => (!includes(element.id, currentPageIds) ? element : null)),
      filter((id) => isNotNil(id))
    )(newIdList);
    console.log('buttons ids', newButtons, 'long:', length(newButtons));
    await getScoresFromNewButtons(newButtons)
      .then((response) => {
        console.log(util.inspect(response, {depth: null, colors: true}));
      })
      .catch((error) => console.log(error));
  }
});
