import { CstElement, CstParser, EOF, Lexer } from "chevrotain"
import * as t from "./regionsLexer"
import { ICSTRegions } from "./types"

export const parseRegions = (text: string): ICSTRegions => {
  const lexingResult = lexer.tokenize(text)
  const tokens = lexingResult.tokens
  parser.input = tokens
  const cst = parser.parse()
  return cst as ICSTRegions
}

export class RegionsParser extends CstParser {
  constructor() {
    super(t.allTokens)
    this.performSelfAnalysis()
  }

  public parse(): CstElement[] {
    return this.lines().children.line
  }

  public readonly lines = this.RULE("lines", () => {
    this.MANY(() => {
      this.SUBRULE(this.line)
    })
  })

  private readonly line = this.RULE("line", () => {
    this.choice([
      () => {
        this.SUBRULE(this.header)
      },
      () => {
        this.SUBRULE(this.text)
      },
    ])
  })

  private readonly text = this.RULE("text", () => {
    this.MANY(() => {
      this.CONSUME(t.Text)
    })
    this.SUBRULE(this.EOL)
  })

  private readonly header = this.RULE("header", () => {
    this.CONSUME1(t.Dashes)
    this.MANY(() => {
      this.CONSUME2(t.Text)
    })
    this.CONSUME3(t.Dashes)

    this.SUBRULE(this.EOL)
  })

  private readonly EOL = this.RULE("EOL", () => {
    this.OPTION({
      GATE: () => {
        return this.LA(1).tokenType != EOF
      },
      DEF: () => {
        this.MANY(() => {
          this.CONSUME(t.NewLine)
        })
      },
    })
  })

  private choice(tokens: (() => any)[]) {
    const items = tokens.map((t) => {
      return { ALT: t }
    })
    this.OR(items)
  }
}

const parser = new RegionsParser()

const lexer = new Lexer(t.lexerDefinition)
