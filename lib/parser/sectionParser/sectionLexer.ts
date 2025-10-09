import { createToken, IMultiModeLexerDefinition } from "chevrotain"

export const Dashes = createToken({
  name: "Dashes",
  pattern: /--+[ \t]*/,
  label: "---",
})

export const Text = createToken({
  name: "Text",
  pattern: /[a-zA-Zа-яА-ЯёЁ№!%0-9][a-zA-Zа-яА-ЯёЁ№!%0-9\t ]*/,
})

export const NewLine = createToken({
  name: "NewLine",
  pattern: /\n/,
  // line_breaks: true,
})

export const allTokens = [Dashes, Text, NewLine]

export const lexerDefinition: IMultiModeLexerDefinition = {
  modes: {
    default_mode: allTokens,
  },
  defaultMode: "default_mode",
}
