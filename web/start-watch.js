#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🚀 Запуск автоматической сборки веб-приложения...');
console.log('📁 Отслеживание изменений в папке web/');
console.log('📦 Компиляция в папку web/dist/');
console.log('');

// Запуск vite build --watch
const viteProcess = spawn('pnpm', ['vite', 'build', '--watch'], {
    cwd: path.resolve(__dirname),
    stdio: 'inherit',
    shell: true
});

viteProcess.on('error', (error) => {
    console.error('❌ Ошибка при запуске Vite:', error);
    process.exit(1);
});

viteProcess.on('exit', (code) => {
    if (code !== 0) {
        console.error(`❌ Vite завершился с кодом ${code}`);
        process.exit(code);
    }
});

// Обработка сигналов для корректного завершения
process.on('SIGINT', () => {
    console.log('\n🛑 Остановка автоматической сборки...');
    viteProcess.kill('SIGINT');
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n🛑 Остановка автоматической сборки...');
    viteProcess.kill('SIGTERM');
    process.exit(0);
});
