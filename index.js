const { exec } = require('child_process');

function runScript(scriptPath) {
    exec(`node ${scriptPath}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Eroare la executarea scriptului ${scriptPath}:`, error);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
            return;
        }
        console.log(`Rezultatul pentru ${scriptPath}:`, stdout);
    });
}

console.log('Se ruleaza scraper.js...');
runScript('src/scraper.js');

setTimeout(() => {
    console.log('Se ruleaza parse_details.js...');
    runScript('src/parse_details.js');
}, 60000);
