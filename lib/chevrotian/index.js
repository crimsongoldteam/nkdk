// Импорт из chevrotain.js
const Chevrotain = require("./chevrotain");

// Реэкспорт нужных функций
exports.createToken = Chevrotain.createToken;
exports.createTokenInstance = Chevrotain.createTokenInstance;
exports.Lexer = Chevrotain.Lexer;
exports.CstParser = Chevrotain.CstParser;
exports.EOF = Chevrotain.EOF;
exports.EMPTY_ALT = Chevrotain.EMPTY_ALT;

// Экспорт по умолчанию
module.exports = Chevrotain;
