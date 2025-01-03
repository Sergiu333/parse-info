const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function downloadImage(url) {
    const imagePath = path.join(__dirname, '../perfumes/images', path.basename(url));
    try {
        const response = await axios({ url, method: 'GET', responseType: 'stream' });
        const writer = fs.createWriteStream(imagePath);
        response.data.pipe(writer);

        await new Promise((resolve, reject) => {
            writer.on('finish', resolve);
            writer.on('error', reject);
        });

        console.log(`Imagine descarcata: ${imagePath}`);
    } catch (error) {
        console.error(`Eroare la descarcarea imaginii: ${url}`);
    }
}

module.exports = { downloadImage };
