// import { IToken, Lexer, CstNode } from "chevrotain"
// import { Parser } from "./parser"
// import { multiModeLexerDefinition } from "./lexer"
// import { Visitor } from "./visitor"
// import { GroupVisitor } from "./groupVisitor"

// const lexer = new Lexer(multiModeLexerDefinition)
// const parser = new Parser()

// export function parseString(text: string, initToken?: IToken): CstNode[] {
//   const lexingResult = lexer.tokenize(text)
//   const tokens = initToken ? [initToken, ...lexingResult.tokens] : lexingResult.tokens
//   return parse(tokens)
// }

// export function parse(tokens: IToken[]): CstNode[] {
//   return parser.parseFields(tokens)
// }

// export function parseText(text: string): any {
//   const lexingResult = lexer.tokenize(text)

//   const groupsAST = parser.parseForm(lexingResult.tokens)

//   const groupVisitor = new GroupVisitor(parser)

//   const fullAST = groupVisitor.visit(groupsAST)

//   const result = new Visitor().visit(fullAST)
//   return result
// }
