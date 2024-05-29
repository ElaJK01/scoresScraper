import jsonexport from 'jsonexport';
import fs from 'node:fs';
import axios from 'axios';
import {
  concat,
  equals,
  filter,
  flatten,
  includes,
  keys,
  map,
  pipe,
  prop,
  propOr,
  head,
  match,
  split,
  last,
  trim,
} from 'ramda';
import util from 'node:util';

export const createEntries = (arr1, arr2) => {
  let entries = [];
  for (let i = 0; i < arr1.length; i++) {
    entries.push([arr1[i], arr2[i]]);
  }
  return new Map(entries);
};

export const transformRowsArray = (array) => {
  const headerKeys = array[0];
  const rows = array.slice(1);
  const rowsObjects = rows.map((row) => {
    return Object.fromEntries(createEntries(headerKeys, row));
  });
  return rowsObjects;
};

export const writeToCsv = async (data, text) => {
  const date = new Date(Date.now()).toISOString();
  const pathCsv = `./downloads/${text}.csv`;
  await jsonexport(data, function (err, csv) {
    if (err) return console.error(err);
    fs.writeFile(pathCsv, csv, 'utf-8', (err) => {
      if (err) {
        throw err;
      } else {
        console.log(`File written successfully with ${data.length} ${text}`);
      }
    });
  });
};

export const checkNewPolishHorses = async () => {
  const allHorses = await axios
    .get('https://homas.pkwk.org/homas/race/search/horse')
    .then((res) => {
      console.log('all horses have been fetched');
      return res;
    })
    .catch((error) => console.log(`unable to get all horses data:`, error));
  const horses = allHorses ? allHorses.data.filter((horse) => horse.dateOfBirth >= 2004) : [];
  if (horses.length < 1) {
    console.log('no horses meeting the criteria');
  } else {
    const horsesIds = horses.map((horse) => horse.id);
    console.log('number of horses', horsesIds.length);
    return horsesIds;
  }
};

export const writeToJson = async (data, text) => {
  const pathJson = `./downloads/${text}.json`;
  fs.writeFile(pathJson, JSON.stringify(data), (err) => {
    if (err) {
      console.error(err);
    } else {
      // file written successfully
    }
  });
};

export const convertDate = (date) => {
  return new Date(date).toLocaleDateString();
};

export const deleteTablesWithoutScores = (tables) => {
  return filter((table) => includes('tableTitle', keys(table)), tables);
};

//returns array of horses with their races scores
export const transformCzechDataToHorsesList = (data) => {
  console.log(data);
  return pipe(
    map((raceDay) => {
      const {id, siteId, year, raceDateTitle} = raceDay;
      const tables = propOr([], 'tables', raceDay);
      const filteredTables = deleteTablesWithoutScores(tables);
      const extendedTables = map((table) => {
        const {tableTitle, tableRows} = table;
        return map((row) => ({raceId: id, siteId, year, raceDateTitle, tableTitle, ...row}), tableRows);
      }, filteredTables);

      return extendedTables;
    }),
    flatten
  )(data);
};

export const arrayWithNoDuplicates = (arr) => {
  const stringifiesSet = new Set(map((e) => JSON.stringify(e), arr));
  const arrFromSet = Array.from(stringifiesSet);
  return map((e) => JSON.parse(e), arrFromSet);
};

//filtered data without duplicates (by horse name - jméno koně)
export const cleanData = (data) => {
  const filteredHorses = map((horse) => {
    const filtered = filter((n) => equals(prop('jméno koně', n), prop('jméno koně', horse)), data);
    return {'jméno koně': prop('jméno koně', horse), races: map((el) => ({...el}), filtered)};
  }, data);
  return arrayWithNoDuplicates(filteredHorses);
};

export const cutDateFromTitle = (string) => {
  return match(/(0\d{1}|1[0-2]).([0-2]\d{1}|3[0-1]).(19|20)\d{2}/, string)[0];
};

export const cutCityFromTitle = (string) => {
  return pipe(split('-'), last, trim)(string);
};

export const cutCountryFromRaceId = (string) => {
  return pipe(split(' '), last)(string);
};

export const mergeCzechAndPolishData = (polish, czech) => {
  const polishChanged = map((row) => {
    return {
      id: propOr('', 'id', row),
      name: propOr('', 'name', row),
      dateOfBirth: propOr('', 'dateOfBirth', row),
      sex: propOr('', 'sex', row),
      breed: propOr('', 'breed', row),
      horseFromPolishBreeding: propOr('', 'horseFromPolishBreeding', row),
      breeders: propOr([], 'breeders', row),
      suffix: propOr('', 'suffix', row),
      mother: propOr({}, 'mother', row),
      father: propOr({}, 'father', row),
      color: propOr({}, 'color', row),
      trainer: propOr('', 'trainer', row),
      raceOwners: propOr([], 'raceOwners', row),
      races: propOr([], 'races', row),
      dataSource: 'PKWK site',
    };
  }, polish);

  const czechChanged = map((row) => {
    const races = pipe(
      propOr([], 'races'),
      map((el) => ({
        raceId: propOr('', 'raceId', el),
        raceDate: pipe(propOr('', 'raceDateTitle'), cutDateFromTitle)(el),
        name: propOr('', 'tableTitle', el),
        order: propOr('', 'st.č.', el),
        place: pipe(propOr('', 'poř.'), head)(el),
        prize: null,
        jockey: propOr('', 'jezdec', el),
        jockeyWeight: propOr('', 'váha', el),
        time: propOr('', 'čas', el),
        trainer: propOr('', 'trenér', el),
        country: pipe(propOr('', 'raceId'), cutCountryFromRaceId)(el),
        city: pipe(propOr('', 'raceDateTitle'), cutCityFromTitle)(el),
      }))
    )(row);
    return {
      id: '',
      name: propOr('', 'jméno koně', row),
      dateOfBirth: '',
      sex: '',
      breed: '',
      horseFromPolishBreeding: '',
      breeders: [],
      suffix: '',
      mother: {name: '', sex: '', breed: '', suffix: ''},
      father: {name: '', sex: '', breed: '', suffix: ''},
      color: {id: '', polishName: '', polishShortName: '', englishName: '', englishShortName: ''},
      trainer: '',
      raceOwners: [],
      races: races,
      dataSource: 'Jockey Club Ceske republiky site',
    };
  }, czech);

  return concat(polishChanged, czechChanged);
};
