import puppeteer from "puppeteer";
import * as fs from 'fs'

const scrapeScores = async (page) => {
  const raceTitle = await page.$eval(".text8", title => title.innerText);
  const tablesTitles = await page.$$eval(".hlavicka_dostihu", titles => {
    return titles.map(title => title.innerText)
  });
  const tables = await page.$$eval(".ram", tables => {
    return tables.map((table) => table.innerText).filter(string => string !== '').map(element => [element])
  })

  const extendedTables = []
  tables.forEach((table, index) => extendedTables.push({tableTitle: tablesTitles[index], tableRows: table}) )
  const judges = extendedTables.pop()

  return {raceDateTitle: raceTitle, tables: extendedTables, judges}
}
const getScores = async() => {
  // Start a Puppeteer session with:
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // Open a new page
  const page = await browser.newPage();

  // On this new page:
  await page.goto("http://dostihyjc.cz/index.php?page=5", {
    waitUntil: "domcontentloaded",
  });

  //Find left menu with navigation buttons
  const leftButtonList =  await page.$$eval(".button-left", buttons => {
      return buttons.map(button => button.innerText)
    })
  //check if button navigate to days data:
  const dateRegexp = new RegExp('\\d{2}([.\\-])\\d{2}([.\\-])\\d{4}');
  const datesButtonTexts = leftButtonList.filter(text => dateRegexp.test(text))
  let data = []
  //click every left button to nvigate to page with race scores
  if (datesButtonTexts.length > 0) {
    for (let i = 0; i < datesButtonTexts.length; i++) {
          await page.click(`text=${datesButtonTexts[i]}`)
          await scrapeScores(page).then(res => data.push({[`page${i}`]: res})).catch(err => console.log(err))
    }
  } else {console.log('nothing to collect')}

//write data to csv
  const csv = JSON.stringify(data);
  const path = `./downloads/file${Date.now()}.csv`;
  fs.writeFile(path, csv, (err) => {
    if (err) { throw err; } else {
      console.log("File written successfully\n");
    }})

  await browser.close();

}

getScores();
