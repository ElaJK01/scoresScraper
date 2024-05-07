import puppeteer from 'puppeteer';
import {transformRowsArray, writeToCsv} from './helpers.js';
import util from 'node:util';
import {always, cond, equals, find, flatten, last, map, pipe, prop, propEq, slice, split} from 'ramda';

const LINKS = [
  {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=1`, country: 'CR', startYear: 1989},
  {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=2`, country: 'Slovensko', startYear: 1989},
  {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=3`, country: 'abroad', startYear: 1997},
];

export const scrapeScores = async (page) => {
  const raceTitle = await page.$eval('.text8', (title) => title.innerText);
  const tablesTitles = await page.$$eval('.hlavicka_dostihu', (titles) => {
    return titles.map((title) => title.innerText);
  });
  const tables = await page.$$eval('.ram', (tables) => {
    return tables
      .map((table) => table.innerText)
      .filter((string) => string !== '')
      .map((element) => element.split('\n').map((el) => el.split('\\')));
  });

  const extendedTables = [];
  //transform data from array with strings to array of objects representing one row of the score table
  tables.forEach((table, index) =>
    extendedTables.push({
      tableTitle: tablesTitles[index],
      tableRows: transformRowsArray(table.map((row) => row[0].split('\t'))),
    })
  );

  return {raceDateTitle: raceTitle, tables: extendedTables};
};

export const scrapePageYear = async (page) => {
  const pageUrl = await page.evaluate(() => document.location.href);
  const pageYear = pageUrl
    .split('&')
    .find((el) => el.includes('rok'))
    .split('=')
    .pop();

  const leftButtonList = await page.$$eval('.button-left', (buttons) => {
    return buttons.map((button) => button.innerText);
  });
  //check if button navigate to days data:
  const dateRegexp = new RegExp('\\d{2}([.\\-])\\d{2}([.\\-])\\d{4}');
  const datesButtonTexts = leftButtonList.filter((text) => dateRegexp.test(text));
  let data = [];
  //click every left button to navigate to page with race scores
  if (datesButtonTexts.length > 0) {
    for (let i = 0; i < datesButtonTexts.length; i++) {
      await page.click(`text=${datesButtonTexts[i]}`);
      await scrapeScores(page)
        .then((res) => {
          return data.push({id: datesButtonTexts[i], ...res});
        })
        .catch((err) => console.log(`can not take data from page ${datesButtonTexts[i]}: ${err}`));
    }
  }
  return map((page) => ({...page, year: pageYear}), data);
};

export const getScores = async (baseUrl, firstYear) => {
  // Start a Puppeteer session with:
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // Open a new page
  const page = await browser.newPage();

  //last page of pagination is current year
  const lastPage = new Date().getFullYear();

  //first page of pagination is firstYear
  let currentPage = firstYear;
  let dataAll = [];

  let lastPageReached = false;

  while (!lastPageReached) {
    const currentUrl = `${baseUrl}&rok=${currentPage}`;
    await page.goto(currentUrl, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });

    //check current url
    const URL = page.url();
    console.log(URL);

    await scrapePageYear(page)
      .then((res) => {
        return dataAll.unshift(res);
      })
      .catch((err) => console.log(err));

    if (currentPage === lastPage) {
      console.log('No more pages.');
      lastPageReached = true;
    } else {
      // increment the page counter
      currentPage++;
      new Promise((r) => setTimeout(r, 3000)); // 3 seconds
    }
  }
  await browser.close();
  return dataAll;
};

export const getAllCzechScores = async () => {
  let data = [];

  for (let i = 0; i < LINKS.length; i++) {
    await getScores(LINKS[i].baseUrl, LINKS[i].startYear)
      .then((res) => data.push(map((element) => map((el) => ({country: LINKS[i].country, ...el}), element), res)))
      .catch(console.error);
  }

  //console.log(util.inspect(data, {depth: null, colors: true}));

  //await writeToCsv(data, 'czech_races_data');
  return flatten(data);
};

//get buttons ids from year page
const getIds = async (page) => {
  const leftButtonList = await page.$$eval('.button-left', (buttons) => {
    return buttons.map((button) => button.innerText);
  });
  //check if button navigate to days data:
  const dateRegexp = new RegExp('\\d{2}([.\\-])\\d{2}([.\\-])\\d{4}');
  return leftButtonList.filter((text) => dateRegexp.test(text));
};

//get all id buttons from country url
export const getIdButtons = async (baseUrl, firstYear) => {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // Open a new page
  const page = await browser.newPage();

  //last page of pagination is current year
  const lastPage = new Date().getFullYear();

  //first page of pagination is firstYear
  let currentPage = firstYear;
  let dataAll = [];

  let lastPageReached = false;

  while (!lastPageReached) {
    const currentUrl = `${baseUrl}&rok=${currentPage}`;
    await page.goto(currentUrl, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });

    //check current url
    const URL = page.url();
    console.log(URL);

    await getIds(page)
      .then((res) => {
        const year = currentPage;
        const country = cond([
          [equals('stat=1'), always('CR')],
          [equals('stat=2'), always('Slovensko')],
          [equals('stat=3'), always('abroad')],
        ])(pipe(split('/'), last, split('&'), last)(baseUrl));
        return dataAll.unshift(map((id) => ({id, country, year}), res));
      })
      .catch((err) => console.log(err));

    if (currentPage === lastPage) {
      console.log('No more pages.');
      lastPageReached = true;
    } else {
      // increment the page counter
      currentPage++;
      new Promise((r) => setTimeout(r, 3000)); // 3 seconds
    }
  }
  await browser.close();
  return dataAll;
};

//get all id from all country pages
export const getAllPagesIds = async () => {
  const idList = [];
  for (let i = 0; i < LINKS.length; i++) {
    await getIdButtons(LINKS[i].baseUrl, LINKS[i].startYear)
      .then((res) => idList.push(res))
      .catch(console.error);
  }
  return idList;
};

export const getScoresFromNewButtons = async (buttons) => {
  let data = [];
  for (let i = 0; i < buttons.length; i++) {
    const {id, country, year} = buttons[i];
    console.log('id btn', id);
    const browser = await puppeteer.launch({
      headless: false,
      defaultViewport: null,
    });

    // Open a new page
    const page = await browser.newPage();
    const currentUrl = `${pipe(find(propEq(country, 'country')), prop('baseUrl'))(LINKS)}&rok=${year}`;
    await page.goto(currentUrl, {
      timeout: 60000,
      waitUntil: 'domcontentloaded',
    });
    await page.click(`text=${id}`);
    await scrapeScores(page)
      .then((res) => {
        return data.push({id, country, year, ...res});
      })
      .catch((err) => console.log(`can not take data from page ${id}: ${err}`));
    await browser.close();
  }
  return data;
};
