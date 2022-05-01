var fs = require('fs');

const scraperObject = {
	url: 'https://www.spanish.academy/blog/1000-most-common-spanish-words-for-beginners/',
	async scraper(browser){  
		let page = await browser.newPage();
		console.log(`Navigating to ${this.url}...`);
		await page.goto(this.url);
		await page.waitForSelector('.blog_content');
    let categories = await page.$$eval('.blog_content > h2, h3', (links) => {
      const ignoredTitles = [
        'Start Today!',
        'Time Words',
        'Family Words',
        'The Five Senses',
        'Describing Words',
        'Physical Adjectives',
        'Animals',
        'Time to Eat!',
        'Transition Words',
        'Location Words',
        'School',
        'Ready to learn more Spanish vocabulary? Check these out!',
        'Join one of the 40,000 classes that we teach each month and you can experience results like these… ',
        'Talk About Your Health in Spanish',
        'Leave a Comment! Cancel reply',
        'About Us',
        'Resources',
        'Recent Posts'
      ]
      return links
      .filter(x => !ignoredTitles.some(y => x.textContent === y))
      .map(x => x.textContent);
    });
    
    let lists = await page.$$eval('.blog_content > ul', (list) => {
      return list.map((x) => {
        const listItems = Array.from(x.querySelectorAll('ul > li'));
        return listItems.map(li => {
          if (!li.textContent) {
            return null;
          }
          const content = li.textContent;
          const word = li.querySelector('em')?.textContent?.trim() ?? null;
          if (word && word != "") {
            return {
              foreignLanguage: "es",
              nativeLanguage: "en",
              foreignWord: word.replace(/[\—\- ]+$/, '').trim(),
              nativeWord: content.replace(word, '').replace(/[\—\- ]+/, '').trim(),
            }
          }
          return null;
        }).filter(x => !!x);
      });
    })

    lists = lists.map((x, idx) => x.map(y => ({...y, category: categories[idx]}))).flat().filter(x => x.category !== 'UNKNOWN')
    
    console.log(lists);
    // console.log(categories);
    var data = JSON.stringify(lists);
    fs.writeFile('MMM-Lingo-Starter.json', data, 'utf8', (e) => {
      if (e) {
        console.log(e);
      } else {
        console.log('wrote to MMM-Lingo-Starter.json')
      }
    });
	}
}

module.exports = scraperObject;