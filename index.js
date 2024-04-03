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

  const searchScores = await page.evaluate(() => {
    const dateRegexp = new RegExp('\\d{2}([.\\-])\\d{2}([.\\-])\\d{4}');
    const leftButtonList = document.querySelectorAll(".button-left");
    const dateButton = [...leftButtonList].filter((node) => dateRegexp.test(node.innerText))
    dateButton[0].click()
    const tableTitle = document.querySelector(".text8").innerText
    console.log('title', tableTitle)


    return 'clicked' +dateButton[1].innerText
  });
  console.log('search scores', searchScores);


  //await browser.close();


}

getScores();
