import {getAllCzechScores} from './library/czechWebFn.js';
import {getAllPolishHorses} from './library/polishHorsesFn.js';

getAllCzechScores()
  .then((res) => console.log('finished writing czech scores to csv'))
  .catch((err) => console.log('could not write czech scores to csv'));

getAllPolishHorses()
  .then((res) => console.log('finished writing polish data to csv'))
  .catch((err) => console.log('could not write polish horses data to csv'));
