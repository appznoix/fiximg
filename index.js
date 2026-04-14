const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const readline = require('readline');
const { execSync } = require('child_process');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const inputDir = './';
const outputDir = './processed';
const tempDir = './tmp_bg';

// Ensure directories exist
[outputDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir);
    }
});

const getImages = () => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.avif'];
    return fs.readdirSync(inputDir).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return validExtensions.includes(ext) && fs.lstatSync(path.join(inputDir, file)).isFile();
    });
};

const showHelp = () => {
    console.log(`
Uso: node process-images.js [opções]

Opções:
  -p <prefixo>     Prefixo para o nome das imagens.
  -w <largura>     Largura máxima em pixels (padrão: 1080).
  -t               Ativa a remoção de fundo (transparência).
  -e <extensão>    Formato de saída: webp, png, jpg, avif (padrão: webp).
  -h               Mostra esta ajuda.

Exemplos:
  node process-images.js -p produto -w 1200 -e png
  node process-images.js -t -e webp
    `);
    process.exit(0);
};

// Parse command line arguments
const args = process.argv.slice(2);
let argPrefix = null;
let argWidth = null;
let argRemoveBg = false;
let argFormat = null;

for (let i = 0; i < args.length; i++) {
    if (args[i] === '-p' && args[i + 1]) {
        argPrefix = args[i + 1];
        i++;
    } else if (args[i] === '-w' && args[i + 1]) {
        argWidth = args[i + 1];
        i++;
    } else if (args[i] === '-t') {
        argRemoveBg = true;
    } else if (args[i] === '-e' && args[i + 1]) {
        argFormat = args[i + 1].toLowerCase().replace('.', '');
        i++;
    } else if (args[i] === '-h') {
        showHelp();
    }
}

const processImages = async (prefix, customWidth, removeBg, format) => {
    const images = getImages();
    if (images.length === 0) {
        console.log('Nenhuma imagem encontrada na pasta atual.');
        rl.close();
        return;
    }

    const widthLimit = customWidth ? parseInt(customWidth) : 1080;
    const targetFormat = format || 'webp';
    
    // Safety check for transparency
    let actualFormat = targetFormat;
    if (removeBg && !['webp', 'png'].includes(targetFormat)) {
        console.log(`Aviso: Formato '${targetFormat}' não suporta transparência. Usando 'webp' para remoção de fundo.`);
        actualFormat = 'webp';
    }

    console.log(`\nIniciando processamento de ${images.length} imagens:`);
    console.log(`- Prefixo: ${prefix || '(original)'}`);
    console.log(`- Largura: ${widthLimit}px`);
    console.log(`- Remover fundo: ${removeBg ? 'Sim' : 'Não'}`);
    console.log(`- Formato: ${actualFormat}\n`);

    for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const baseName = prefix 
            ? `${prefix}-${(i + 1).toString().padStart(3, '0')}`
            : path.parse(file).name;
        
        const fileName = `${baseName}.${actualFormat}`;
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, fileName);
        const tempPath = path.join(tempDir, `temp-${Date.now()}.png`);

        try {
            process.stdout.write(`[${i + 1}/${images.length}] Processando: ${file}... `);
            
            let imageSource = inputPath;

            if (removeBg) {
                // Call external worker to avoid DLL conflicts with sharp
                execSync(`node bg-worker.js "${inputPath}" "${tempPath}"`, { stdio: 'pipe' });
                imageSource = tempPath;
            }

            let imageProcessor = sharp(imageSource);
            
            if (!isNaN(widthLimit)) {
                imageProcessor = imageProcessor.resize({
                    width: widthLimit,
                    withoutEnlargement: true
                });
            }

            // Apply format and compression
            if (actualFormat === 'webp') {
                imageProcessor = imageProcessor.webp({ quality: 80 });
            } else if (actualFormat === 'png') {
                imageProcessor = imageProcessor.png({ compressionLevel: 9 });
            } else if (actualFormat === 'avif') {
                imageProcessor = imageProcessor.avif({ quality: 50 });
            } else {
                imageProcessor = imageProcessor.jpeg({ quality: 80, mozjpeg: true });
            }

            await imageProcessor.toFile(outputPath);
            
            // Clean up temp file
            if (fs.existsSync(tempPath)) {
                fs.unlinkSync(tempPath);
            }

            console.log(`OK -> ${fileName}`);
        } catch (error) {
            console.log(`ERRO: ${error.message}`);
            if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
        }
    }

    // Clean up temp directory
    if (fs.readdirSync(tempDir).length === 0) {
        fs.rmdirSync(tempDir);
    }

    console.log('\nProcessamento concluído! As imagens estão na pasta /processed.');
    rl.close();
};

const main = async () => {
    const images = getImages();
    if (images.length === 0) {
        console.log('\u26A0\uFE0F  Nenhuma imagem encontrada na pasta atual (.jpg, .png, .webp, .avif).');
        rl.close();
        process.exit(0);
    }

    let prefix = argPrefix;
    let width = argWidth;
    let removeBg = argRemoveBg;
    let format = argFormat;

    // Interactive questions if flags are missing
    if (prefix === null) {
        prefix = await new Promise(resolve => {
            rl.question('Digite o prefixo para as imagens (vazio = manter original): ', resolve);
        });
    }

    if (width === null) {
        width = await new Promise(resolve => {
            rl.question('Digite a largura máxima (padrão 1080): ', resolve);
        });
    }

    if (argRemoveBg === false) {
        const answer = await new Promise(resolve => {
            rl.question('Remover fundo? (s/N): ', resolve);
        });
        removeBg = answer.toLowerCase() === 's';
    }

    if (format === null) {
        format = await new Promise(resolve => {
            rl.question('Formato de saída (webp, png, jpg, avif) [padrão webp]: ', resolve);
        });
    }

    await processImages(prefix.trim(), width.trim(), removeBg, format.trim());
};

main();
