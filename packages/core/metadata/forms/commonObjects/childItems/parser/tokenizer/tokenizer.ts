import { IToken } from "chevrotain"
import { lexer } from "./lexer"

export const tokenize = (text: string): IToken[] => {
  const result = lexer.tokenize(text)
  return result.tokens
}

// 1. Токенизируем
// 2. Строим дерево из токенов
// 3. Для каждой строки определяем тип элемента
// 4. Если это однострочная группа, то встраиваем ее в дерево
