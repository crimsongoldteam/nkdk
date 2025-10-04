const fs = require('fs');
const path = require('path');

// Создаем папку build в каталоге out если её нет
const buildDir = path.join(__dirname, '..', 'out', 'build');
if (!fs.existsSync(buildDir)) {
    fs.mkdirSync(buildDir, { recursive: true });
}

// Копируем файл из dist в out/build
const sourceFile = path.join(__dirname, '..', 'dist', 'nakidka-core.cjs.js');
const targetFile = path.join(buildDir, 'nakidka-core.cjs.js');

if (fs.existsSync(sourceFile)) {
    fs.copyFileSync(sourceFile, targetFile);
    console.log('✅ Скопирован nakidka-core.cjs.js в папку out/build');
} else {
    console.error('❌ Файл nakidka-core.cjs.js не найден в папке dist');
    console.error('Выполните сначала: pnpm web:build:lib');
    process.exit(1);
}
