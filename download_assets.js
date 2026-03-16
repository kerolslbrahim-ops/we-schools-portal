const fs = require('fs');
const https = require('https');
const path = require('path');

const dir = path.join(__dirname, 'assets');
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir);
}

function download(url, dest) {
    return new Promise((resolve, reject) => {
        const file = fs.createWriteStream(dest);
        https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36' } }, (response) => {
            if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
                return download(response.headers.location, dest).then(resolve).catch(reject);
            }
            response.pipe(file);
            file.on('finish', () => {
                file.close(resolve);
            });
        }).on('error', (err) => {
            fs.unlink(dest, () => reject(err));
        });
    });
}

async function main() {
    try {
        await download('https://unpkg.com/lucide@latest', path.join(dir, 'lucide.min.js'));
        console.log('Downloaded lucide');
        
        await download('https://giza.moe.gov.eg/Images/logo2.png', path.join(dir, 'logo2.png'));
        console.log('Downloaded logo2');
        
        // Download font CSS
        const cssPath = path.join(dir, 'cairo.css');
        await download('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap', cssPath);
        let css = fs.readFileSync(cssPath, 'utf8');
        
        const urlRegex = /url\((https:\/\/[^)]+)\)/g;
        let match;
        let fontIndex = 0;
        
        // Since urlRegex uses global flag, we have to match carefully.
        // It's safer to use String.prototype.matchAll
        const matches = [...css.matchAll(urlRegex)];
        for (const m of matches) {
            const fontUrl = m[1];
            const fontName = `cairo-${fontIndex++}.woff2`;
            await download(fontUrl, path.join(dir, fontName));
            console.log(`Downloaded ${fontName}`);
            css = css.replace(fontUrl, fontName);
        }
        
        fs.writeFileSync(cssPath, css);
        console.log('Downloaded fonts fully');
    } catch(err) {
        console.error('Error downloading assets:', err);
    }
}

main();
