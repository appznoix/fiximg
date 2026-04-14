const fs = require('fs');
const { removeBackground } = require('@imgly/background-removal-node');

async function run() {
    const [inputPath, outputPath] = process.argv.slice(2);

    if (!inputPath || !outputPath) {
        console.error('Uso: node bg-worker.js <input> <output>');
        process.exit(1);
    }

    try {
        const blob = await removeBackground(inputPath);
        const buffer = Buffer.from(await blob.arrayBuffer());
        fs.writeFileSync(outputPath, buffer);
        process.exit(0);
    } catch (error) {
        console.error(error.message);
        process.exit(1);
    }
}

run();
