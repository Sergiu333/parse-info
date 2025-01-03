const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { downloadImage } = require('./downloadImages');

(async () => {
    const inputFilePath = path.join(__dirname, '../perfumes/produse.json');
    const produse = JSON.parse(fs.readFileSync(inputFilePath, 'utf-8'));

    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
     });

    const page = await browser.newPage();

    for (let produs of produse) {
        if (produs.detalii && produs.detalii.length > 0) {
            console.log(`Detalii deja procesate pentru: ${produs.nume}`);
            continue;
        } else {
            console.log(`Detalii GOALE pentru: ${produs.nume}`);
        }

        console.log(`Procesam detalii pentru: ${produs.nume}`);

        try {
            await page.goto(produs.link, { waitUntil: 'networkidle2' });

            await page.waitForSelector('.info-table__main', { timeout: 10000 });

            console.log('--------------------------------- Procesam detalii ---------------------------------');

            const detalii = await page.evaluate(() => {
                const detaliiArray = [];
                const rows = document.querySelectorAll('.info-table__main .info-table-row');

                rows.forEach(row => {
                    const title = row.querySelector('.info-table-row__title span')?.innerText.trim();
                    const entry = row.querySelector('.info-table-row__entry')?.innerText.trim();

                    if (title && entry) {
                        detaliiArray.push({ [title]: entry });
                    }
                });

                const description = document.querySelector('.perfume-page__description p:nth-of-type(1)')?.innerText.trim();
                const composition = document.querySelector('.perfume-page__description p:nth-of-type(2)')?.innerText.trim();

                if (description) detaliiArray.push({ "Descriere": description });
                if (composition) detaliiArray.push({ "Compozitie": composition });

                return detaliiArray;
            });

            console.log(' ---- Extrage pretul ----');
            const pret = await page.evaluate(() => {
                const pretObject = {
                    pret: ''
                };

                const priceElement = document.querySelector('.aromabox__items .aromabox__item-price');
                if (priceElement) {
                    const pretNou = priceElement.innerText.trim();
                    if (pretNou) {
                        pretObject.pret = pretNou;
                    }
                }

                return pretObject;
            });

            console.log(`Preț extras: ${pret.pret}`);

            detalii.push({ "pret": pret.pret });

            console.log(' ---- Extrage pozele dintr-un alt bloc ----');
            const poze = await page.evaluate(() => {
                const pozeArray = [];
                const pozeElements = document.querySelectorAll('.swiper-slide .gallery-thumbs__picture img'); // Selectorul pentru imagini

                pozeElements.forEach(img => {
                    const imgSrc = img.getAttribute('data-src') || img.getAttribute('src');
                    if (imgSrc) {
                        pozeArray.push(imgSrc);
                    }
                });

                return pozeArray;
            });

            console.log(`Poze extrase: ${poze.join(', ')}`);

            detalii.push({ "images_multiple": poze.length > 0 ? poze : [] });

            for (let imgUrl of poze) {
                await downloadImage(imgUrl);
            }

            produs.detalii = detalii;

            console.log(`Detalii extrase pentru: ${produs.nume}`);

            const outputFilePath = path.join(__dirname, 'produse_detaliate.json');
            fs.writeFileSync(outputFilePath, JSON.stringify(produse, null, 2));

            console.log(`Datele pentru ${produs.nume} au fost salvate.`);

        } catch (error) {
            console.error(`Eroare la procesarea produsului ${produs.nume}:`, error.message);
        }
    }

    await browser.close();
})();
