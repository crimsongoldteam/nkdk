import { IToken, tokenMatcher } from "chevrotain"
import * as t from "../tokenizer/lexer"
import { BuilderTreeNode } from "./types"

export const buildTree = (tokens: IToken[]): BuilderTreeNode[] => {
  const result: BuilderTreeNode[] = []
  const stack: { node: BuilderTreeNode; level: number }[] = []
  let currentLine: IToken[] = []
  let currentIndentTokens: IToken[] = []

  for (const token of tokens) {
    if (tokenMatcher(token, t.NewLine)) {
      if (currentLine.length === 0) continue

      const level = calculateLevelFromIndent(currentIndentTokens)
      const node: BuilderTreeNode = {
        tokens: currentLine,
        childItems: [],
      }

      while (stack.length > 0 && stack[stack.length - 1].level >= level) {
        stack.pop()
      }

      const parent = stack.length === 0 ? null : stack[stack.length - 1].node
      parent ? parent.childItems.push(node) : result.push(node)
      stack.push({ node, level })
      currentLine = []
      currentIndentTokens = []
      continue
    }

    if (tokenMatcher(token, t.Indent)) {
      currentIndentTokens.push(token)
      continue
    }

    currentLine.push(token)
  }

  if (currentLine.length === 0) return result

  const level = calculateLevelFromIndent(currentIndentTokens)
  const node: BuilderTreeNode = {
    tokens: currentLine,
    childItems: [],
  }

  while (stack.length > 0 && stack[stack.length - 1].level >= level) {
    stack.pop()
  }

  const parent = stack.length === 0 ? null : stack[stack.length - 1].node
  parent ? parent.childItems.push(node) : result.push(node)

  return result
}

const calculateLevelFromIndent = (indentTokens: IToken[]): number => {
  let level = 0

  for (const token of indentTokens) {
    const indentText = token.image
    for (let i = 0; i < indentText.length; i++) {
      if (indentText[i] === "\t") {
        level++
        continue
      }

      if (indentText[i] !== " ") continue

      let spaces = 0
      while (i < indentText.length && indentText[i] === " ") {
        spaces++
        i++
      }
      level += Math.ceil(spaces / 2)
      break
    }
  }

  return level
}
