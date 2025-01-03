const fs = require('fs');
const path = require('path');

function saveData(data, fileName) {
    const filePath = path.join(__dirname, fileName);
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`Date salvate in: ${filePath}`);
}

module.exports = { saveData };
