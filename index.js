import puppeteer from "puppeteer";
import * as fs from 'fs'

const scrapeScores = async (page) => {
  const raceTitle = await page.$eval(".text8", title => title.innerText);
  const tablesTitles = await page.$$eval(".hlavicka_dostihu", titles => {
    return titles.map(title => title.innerText)
  });
  const tables = await page.$$eval(".ram", tables => {
    return tables.map((table) => table.innerText)
  })
  const judges = tables.pop()
  // if (tables.length > 0) {
  //   const tabs = tables.map(table => {
  //     const rows = table.querySelectorAll('tr');
  //     const cells = rows.map(
  //       row => {
  //         const columns = Array.from(row.querySelectorAll('td'));
  //         const headers = Array.from(row.querySelectorAll('th'), header => header.innerText)
  //         return columns.map((column) =>   column.innerText).concat(headers) }
  //     )
  //     return {...cells}
  //   })
  //   const isEmptyObject = (obj) => {
  //     for (const prop in obj) {
  //       if (Object.hasOwn(obj, prop)) {
  //         return false;
  //       }
  //     }
  //     return true;
  //   }
  //
  //   const judges = tabs.pop()
  //   return {raceTitle, tabs: tabs.filter(el => !isEmptyObject(el)), judges, tabTitles: tableTitle}
  // }
  // else {
  //   console.log('No race scores');
  // }
  // const tabs = Array.from(tables, ((table) => {
  //     const rows = Array.from(table.querySelectorAll('tr'))
  //     const cells = rows.map(row => {
  //       const columns = Array.from(row.querySelectorAll('td'));
  //       const headers = Array.from(row.querySelectorAll('th'), header => header.innerText)
  //       return columns.map((column) =>   column.innerText).concat(headers)
  //
  //     })
  //     return {...cells}
  //     //return rows.map(el => el.innerText);
  //   })
  // )
  return {raceDateTitle: raceTitle, tables, judges}
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
console.log('data', data)

//write data to csv
  const csv = JSON.stringify(data);
  const path = `./downloads/file${Date.now()}.csv`;
  fs.writeFile(path, csv, (err) => {
    if (err) { throw err; } else {
      console.log("File written successfully\n");
    }})

  //await browser.close();


}

getScores();
