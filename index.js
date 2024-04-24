import {getAllCzechScores} from './library/czechWebFn.js';
import {getAllPolishHorses} from './library/polishHorsesFn.js';

getAllCzechScores()
  .then((res) => console.log('finished'))
  .catch((err) => console.log('could not write to csv'));

// getAllPolishHorses();
