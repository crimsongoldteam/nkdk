import { CstNode, CstParser, Lexer } from "chevrotain"
import * as t from "./sectionLexer"

export function parseSections(text: string): CstNode {
  const lexingResult = lexer.tokenize(text)
  const tokens = lexingResult.tokens
  parser.input = tokens
  return parser.parse()
}

class SectionParser extends CstParser {
  constructor() {
    super(t.allTokens)
    this.performSelfAnalysis()
  }

  private readonly text = this.RULE("text", () => {
    this.MANY(() => {
      this.CONSUME(t.Text)
    })
    this.CONSUME(t.NewLine)
  })

  public readonly parse = this.RULE("parse", () => {
    this.MANY(() => {
      this.choice([
        () => {
          this.SUBRULE(this.sectionHeader)
        },
        () => {
          this.SUBRULE(this.text)
        },
      ])
    })
  })

  private readonly sectionHeader = this.RULE("sectionHeader", () => {
    this.CONSUME1(t.Dashes)
    this.MANY(() => {
      this.CONSUME2(t.Text)
    })
    this.CONSUME3(t.Dashes)

    this.CONSUME(t.NewLine)
  })

  private choice(tokens: (() => any)[]) {
    const items = tokens.map((t) => {
      return { ALT: t }
    })
    this.OR(items)
  }
}

const parser = new SectionParser()

const lexer = new Lexer(t.lexerDefinition)
