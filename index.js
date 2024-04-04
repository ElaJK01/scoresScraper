import puppeteer from "puppeteer";

const getScores = async() => {
  // Start a Puppeteer session with:
  // - a visible browser (`headless: false` - easier to debug because you'll see the browser in action)
  // - no default viewport (`defaultViewport: null` - website page will in full width and height)
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
  });

  // Open a new page
  const page = await browser.newPage();

  // On this new page:
  // - open the "http://dostihyjc.cz/index.php?page=5" website
  // - wait until the dom content is loaded (HTML is ready)
  await page.goto("http://dostihyjc.cz/index.php?page=5", {
    waitUntil: "domcontentloaded",
  });

  const clickDateButton = await page.evaluate(() => {
    const dateRegexp = new RegExp('\\d{2}([.\\-])\\d{2}([.\\-])\\d{4}');
    const leftButtonList = document.querySelectorAll(".button-left");
    const dateButtons = [...leftButtonList].filter((node) => dateRegexp.test(node.innerText))
    dateButtons[0].click()
    const raceTitle = document.querySelector(".text8").innerText
    const tableTitle = document.querySelector(".hlavicka_dostihu").innerText
    const tables = document.querySelectorAll(".ram")
    const tabs = Array.from(tables, table => {
      const rows = Array.from(table.querySelectorAll('tr'));
      const cells = rows.map(row => {
        const columns = Array.from(row.querySelectorAll('td'));
        const headers = Array.from(row.querySelectorAll('th'), header => header.innerText)
        return columns.map((column) =>   column.innerText).concat(headers)

      })
      return {...cells}
    })

    const isEmptyObject = (obj) => {
      for (const prop in obj) {
        if (Object.hasOwn(obj, prop)) {
          return false;
        }
      }
      return true;
    }

    const judges = tabs.pop()
    return {raceTitle, tabs: tabs.filter(el => !isEmptyObject(el)), judges}
  });


console.log(clickDateButton)


  //await browser.close();


}

getScores();
