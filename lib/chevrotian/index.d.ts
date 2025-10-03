// Импорт из бандла
import * as Chevrotain from "./chevrotain"

// Экспорт функций и классов из бандла
export const createToken = Chevrotain.createToken
export const createTokenInstance = Chevrotain.createTokenInstance
export const Lexer = Chevrotain.Lexer
export const CstParser = Chevrotain.CstParser
export const EOF = Chevrotain.EOF
export const EMPTY_ALT = Chevrotain.EMPTY_ALT

// Экспорт типов
export interface IToken {
  image: string
  startOffset: number
  endOffset?: number
  startLine?: number
  endLine?: number
  startColumn?: number
  endColumn?: number
  tokenTypeIdx?: number
  tokenType?: TokenType
}

export interface TokenType {
  name: string
  PATTERN?: RegExp | string
  GROUP?: string
  LONGER_ALT?: TokenType
  CATEGORIES?: TokenType[]
  LABEL?: string
  POP_MODE?: boolean
  PUSH_MODE?: string
  tokenTypeIdx?: number
  categoryMatches?: number[]
  categoryMatchesMap?: { [idx: number]: TokenType }
  isParent?: boolean
}

export interface CstNode {
  name: string
  children: CstChildrenDictionary
  recoveredNode?: boolean
  resyncedTokens?: IToken[]
  location?: {
    startOffset: number
    endOffset?: number
    startLine?: number
    endLine?: number
    startColumn?: number
    endColumn?: number
  }
}

export interface CstChildrenDictionary {
  [ruleName: string]: (CstNode | IToken)[]
}

export type CstElement = CstNode | IToken

export interface IMultiModeLexerDefinition {
  modes: { [modeName: string]: TokenType[] }
  defaultMode: string
}

export default Chevrotain
//# sourceMappingURL=index.d.ts.map
