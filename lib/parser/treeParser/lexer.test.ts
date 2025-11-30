import type { IToken } from "chevrotain"
import { describe, expect, it } from "vitest"
import { lexer } from "./lexer"

describe("lexer", () => {
  it("should tokenize plain text followed by colon", () => {
    const mock = `text:`

    const expectedResult = [
      { type: "Text", value: "text" },
      { type: "Colon", value: ":" },
    ]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double-quoted escaped text containing colon", () => {
    const mock = `"text:"`

    const expectedResult = [{ type: "EscapedText", value: "text:" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double-quoted escaped text with newline escape sequence", () => {
    const mock = `"text\nwith\nnewlines"`

    const expectedResult = [{ type: "EscapedText", value: "text\nwith\nnewlines" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double-quoted escaped text with tab escape sequence", () => {
    const mock = `"text\twith\ttabs"`

    const expectedResult = [{ type: "EscapedText", value: "text\twith\ttabs" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double-quoted escaped text with backslash escape sequence", () => {
    const mock = `"text\\\\with\\\\backslashes"`

    const expectedResult = [{ type: "EscapedText", value: "text\\with\\backslashes" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double-quoted escaped text with escaped double quote", () => {
    const mock = `"text\\"with\\"quotes"`

    const expectedResult = [{ type: "EscapedText", value: 'text"with"quotes' }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double-quoted escaped text with escaped single quote", () => {
    const mock = `"text\\'with\\'single\\'quotes"`

    const expectedResult = [{ type: "EscapedText", value: "text'with'single'quotes" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double-quoted escaped text with unicode escape sequence", () => {
    const mock = `"text\\u0041\\u0042\\u0043"`

    const expectedResult = [{ type: "EscapedText", value: "textABC" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double-quoted escaped text with hexadecimal escape sequence", () => {
    const mock = `"text\\x41\\x42\\x43"`

    const expectedResult = [{ type: "EscapedText", value: "textABC" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double-quoted escaped text with multiple mixed escape sequences", () => {
    const mock = `"text\\n\\t\\\\\\"\\'\\u0041\\x42"`

    const expectedResult = [{ type: "EscapedText", value: "text\n\t\\\"'AB" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double-quoted escaped text containing cyrillic characters", () => {
    const mock = `"текст с кириллицей: привет"`

    const expectedResult = [{ type: "EscapedText", value: "текст с кириллицей: привет" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double-quoted escaped text with cyrillic characters and escape sequences", () => {
    const mock = `"текст\\nс\\tкириллицей"`

    const expectedResult = [{ type: "EscapedText", value: "текст\nс\tкириллицей" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize single-quoted escaped text", () => {
    const mock = `'text:with:colons'`

    const expectedResult = [{ type: "EscapedText", value: "text:with:colons" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize single-quoted escaped text with escape sequences", () => {
    const mock = `'text\\n\\twith\\'single\\'quotes'`

    const expectedResult = [{ type: "EscapedText", value: "text\n\twith'single'quotes" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize single-quoted escaped text with cyrillic characters", () => {
    const mock = `'текст с кириллицей и кавычками: привет'`

    const expectedResult = [
      { type: "EscapedText", value: "текст с кириллицей и кавычками: привет" },
    ]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize slash for page", () => {
    const mock = `/page`

    const expectedResult = [
      { type: "Slash", value: "/" },
      { type: "Text", value: "page" },
    ]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize double slash for pages", () => {
    const mock = `//pages`

    const expectedResult = [
      { type: "Slash", value: "/" },
      { type: "Slash", value: "/" },
      { type: "Text", value: "pages" },
    ]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize hash for vertical group", () => {
    const mock = `#group`

    const expectedResult = [
      { type: "Hash", value: "#" },
      { type: "Text", value: "group" },
    ]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize percent sign in text for horizontal group", () => {
    const mock = `%group`

    const expectedResult = [{ type: "Text", value: "%group" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize left angle bracket for button", () => {
    const mock = `<button`

    const expectedResult = [
      { type: "LAngle", value: "<" },
      { type: "Text", value: "button" },
    ]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize left angle bracket with vertical bar for command bar", () => {
    const mock = `<command|bar`

    const expectedResult = [
      { type: "LAngle", value: "<" },
      { type: "Text", value: "command" },
      { type: "VBar", value: "|" },
      { type: "Text", value: "bar" },
    ]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize vertical bar for table", () => {
    const mock = `col1|col2|col3`

    const expectedResult = [
      { type: "Text", value: "col1" },
      { type: "VBar", value: "|" },
      { type: "Text", value: "col2" },
      { type: "VBar", value: "|" },
      { type: "Text", value: "col3" },
    ]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize round brackets for radio button", () => {
    const mock = `radio()`

    const expectedResult = [
      { type: "Text", value: "radio" },
      { type: "RadioButtonUnchecked", value: "()" },
    ]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize square brackets for checkbox", () => {
    const mock = `checkbox[]`

    const expectedResult = [
      { type: "Text", value: "checkbox" },
      { type: "CheckboxUnchecked", value: "[]" },
    ]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize at sign for picture", () => {
    const mock = `@picture`

    const expectedResult = [{ type: "Picture", value: "@picture" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize at sign with identifier for picture", () => {
    const mock = `@picture123`

    const expectedResult = [{ type: "Picture", value: "@picture123" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })

  it("should tokenize at sign with cyrillic for picture", () => {
    const mock = `@картинка`

    const expectedResult = [{ type: "Picture", value: "@картинка" }]

    const result = simplifyTokens(lexer.tokenize(mock).tokens)

    expect(result).toEqual(expectedResult)
  })
})

const simplifyTokens = (tokens: IToken[]) => {
  return tokens.map((token) => {
    let value = token.image

    // Обработка EscapedText: убираем кавычки и обрабатываем escape-последовательности
    if (token.tokenType.name === "EscapedText") {
      // Убираем внешние кавычки (двойные или одинарные)
      const content = value.slice(1, -1)
      // Обрабатываем escape-последовательности JavaScript
      value = processJavaScriptEscapes(content)
    }

    return {
      type: token.tokenType.name,
      value: value,
    }
  })
}

/**
 * Обрабатывает escape-последовательности JavaScript в строке
 * Поддерживает: \n, \t, \r, \\, \", \', \uXXXX, \xXX
 */
function processJavaScriptEscapes(str: string): string {
  const escapes: Record<string, string> = {
    n: "\n",
    t: "\t",
    r: "\r",
    "\\": "\\",
    '"': '"',
    "'": "'",
  }

  let result = ""
  let i = 0

  while (i < str.length) {
    if (str[i] === "\\" && i + 1 < str.length) {
      const char = str[i + 1]
      if (escapes[char]) {
        result += escapes[char]
        i += 2
      } else if (char === "u" && /^[0-9A-Fa-f]{4}$/.test(str.slice(i + 2, i + 6))) {
        result += String.fromCharCode(parseInt(str.slice(i + 2, i + 6), 16))
        i += 6
      } else if (char === "x" && /^[0-9A-Fa-f]{2}$/.test(str.slice(i + 2, i + 4))) {
        result += String.fromCharCode(parseInt(str.slice(i + 2, i + 4), 16))
        i += 4
      } else {
        result += "\\" + char
        i += 2
      }
    } else {
      result += str[i++]
    }
  }

  return result
}
