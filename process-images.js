const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const inputDir = './';
const outputDir = './processed';

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

const getImages = () => {
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp'];
    return fs.readdirSync(inputDir).filter(file => {
        const ext = path.extname(file).toLowerCase();
        return validExtensions.includes(ext) && fs.lstatSync(path.join(inputDir, file)).isFile();
    });
};

const processImages = async (prefix, customWidth) => {
    const images = getImages();
    if (images.length === 0) {
        console.log('Nenhuma imagem encontrada na pasta atual.');
        rl.close();
        return;
    }

    console.log(`Processando ${images.length} imagens...`);

    for (let i = 0; i < images.length; i++) {
        const file = images[i];
        const fileName = prefix 
            ? `${prefix}-${(i + 1).toString().padStart(3, '0')}.jpg`
            : `${path.parse(file).name}.jpg`;
        const inputPath = path.join(inputDir, file);
        const outputPath = path.join(outputDir, fileName);

        try {
            let imageProcessor = sharp(inputPath);
            
            if (customWidth) {
                const width = parseInt(customWidth);
                if (!isNaN(width)) {
                    imageProcessor = imageProcessor.resize(width);
                }
            }

            await imageProcessor
                .jpeg({ quality: 80, mozjpeg: true }) // Compression
                .toFile(outputPath);
            
            console.log(`[${i + 1}/${images.length}] OK: ${file} -> ${fileName}`);
        } catch (error) {
            console.error(`Erro ao processar ${file}:`, error.message);
        }
    }

    console.log('\nProcessamento concluído! As imagens estão na pasta /processed.');
    rl.close();
};

rl.question('Digite o prefixo para as imagens (deixe vazio para manter o nome original): ', (prefix) => {
    rl.question('Digite a largura máxima (ex: 1080, deixe vazio para original): ', (width) => {
        processImages(prefix.trim(), width.trim());
    });
});
