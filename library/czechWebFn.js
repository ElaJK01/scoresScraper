import puppeteer from 'puppeteer';
import {transformRowsArray, writeToCsv} from './helpers.js';
import util from 'node:util';

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
          return data.push({[`page${i}`]: res});
        })
        .catch((err) => console.log(`can not take data from page ${datesButtonTexts[i]}: ${err}`));
    }
  }
  return {year: pageYear, pages: data};
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
  const links = [
    {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=1`, country: 'CR', startYear: 1989},
    {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=2`, country: 'Slovensko', startYear: 1989},
    {baseUrl: `http://dostihyjc.cz/index.php?page=5&stat=3`, country: 'abroad', startYear: 1997},
  ];
  let data = [];

  for (let i = 0; i < links.length; i++) {
    await getScores(links[i].baseUrl, links[i].startYear)
      .then((res) => data.push({country: links[i].country, results: res}))
      .catch(console.error);
  }

  console.log(util.inspect(data, {depth: null, colors: true}));

  await writeToCsv(data, 'czech_races_data');
};
