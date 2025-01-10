const puppeteer = require('puppeteer');
const fs = require('fs');
const { autoScroll } = require('./autoScroll');
const { downloadImage } = require('./downloadImages');
const { saveData } = require('./saveData');

(async () => {
    const urlBase = 'https://aromo.ru/perfumes/page/';
    const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();

    let produse = [];
    let paginaCurenta = 877;

    const filePath = '../perfumes/produse.json';
    if (fs.existsSync(filePath)) {
        console.log('Se încarcă datele existente din produsele salvate...');
        const existingData = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        produse = existingData;
    }

    let hasNextPage = true;

    while (hasNextPage) {
        const url = `${urlBase}${paginaCurenta}/`;
        console.log(`Navigăm la URL-ul: ${url}`);
        await page.goto(url, { waitUntil: 'networkidle2' });

        console.log('Derulăm pagina pentru a încărca imaginile...');
        await autoScroll(page);

        console.log('Extragem datele produselor...');
        const produsePagina = await page.evaluate(() => {
            const produseArray = [];
            const produse = document.querySelectorAll('ul.catalog-list__list li');
            produse.forEach((produs) => {
                const nume = produs.querySelector('.block-offer-item__title')?.innerText.trim() || 'Nume indisponibil';
                const brand = produs.querySelector('.block-offer-item__brand')?.innerText.trim() || 'Brand indisponibil';
                const an = produs.querySelector('.block-offer-item__date-created')?.innerText.trim() || 'An indisponibil';
                const gender = produs.querySelector('.block-offer-item__panel-right .panel-right__row.block-offer-item__gender')?.innerText.trim() || 'Gen indisponibil';
                const type = produs.querySelector('.block-offer-item__caption')?.innerText.trim() || 'Type indisponibil';
                const rating = produs.querySelector('.rating.block-offer-item__rating')?.getAttribute('data-value') || 'Rating indisponibil';
                const imagine = produs.querySelector('.block-offer-item__picture-block img')?.src || 'Imagine indisponibila';
                const link = produs.querySelector('.block-offer-item__footer a')?.href || 'Link indisponibil';

                produseArray.push({ nume, brand, an, gender, type, rating, imagine, link });
            });
            return produseArray;
        });

        produse = produse.concat(produsePagina);

        for (const produs of produsePagina) {
            if (produs.imagine !== 'Imagine indisponibila') {
                await downloadImage(produs.imagine);
            }
        }

        saveData(produse, filePath);
        hasNextPage = produsePagina.length > 0;

        if (hasNextPage) {
            paginaCurenta++;
        }
    }

    await browser.close();
    console.log('Browserul a fost închis.');
})();
