import { describe, expect, it } from "vitest"
import { tokenize } from "../tokenizer/tokenizer"
import { parseTree } from "./treeParser"
import { ParseElementType, TreeNode } from "./types"

describe("parseTree", () => {
  it("should parse one item", () => {
    const mock = `text`

    const tokens = tokenize(mock)

    const result = parseTree(tokens)
    const simplified = simplifyTreeNodes(result)

    expect(simplified).toEqual([
      {
        content: "text",
        type: "LabelDecoration",
        childItems: [],
      },
    ])
  })

  it("should parse two lines", () => {
    const mock = `text
text2`

    const tokens = tokenize(mock)
    const result = parseTree(tokens)
    const simplified = result.map(simplifyTreeNode)

    expect(simplified).toEqual([
      {
        content: "text",
        type: "LabelDecoration",
        childItems: [],
      },
      {
        content: "text2",
        type: "LabelDecoration",
        childItems: [],
      },
    ])
  })

  it("should parse two line items with one indent", () => {
    const mock = `#group1
  text2`

    const tokens = tokenize(mock)
    const result = parseTree(tokens)
    const simplified = simplifyTreeNodes(result)

    expect(simplified).toEqual([
      {
        content: "#group1",
        type: "VerticalGroup",
        childItems: [
          {
            content: "text2",
            type: "LabelDecoration",
            childItems: [],
          },
        ],
      },
    ])
  })

  it("should parse text items with wrong indents", () => {
    const mock = `text1
  text2`

    const tokens = tokenize(mock)
    const result = parseTree(tokens)
    const simplified = simplifyTreeNodes(result)

    expect(simplified).toEqual([
      {
        content: "text1",
        type: "LabelDecoration",
        childItems: [],
      },
      {
        content: "text2",
        type: "LabelDecoration",
        childItems: [],
      },
    ])
  })

  it("should parse two line items with tab indent", () => {
    const mock = `text1
\ttext2`

    const tokens = tokenize(mock)
    const result = parseTree(tokens)
    const simplified = simplifyTreeNodes(result)

    expect(simplified).toEqual([
      {
        content: "text1",
        type: "LabelDecoration",
        childItems: [],
      },
      {
        content: "text2",
        type: "LabelDecoration",
        childItems: [],
      },
    ])
  })

  it("should parse group item with two child items", () => {
    const mock = `#text1
  text2
  text3`

    const tokens = tokenize(mock)
    const result = parseTree(tokens)
    const simplified = result.map(simplifyTreeNode)

    expect(simplified).toEqual([
      {
        content: "#text1",
        type: "VerticalGroup",
        childItems: [
          {
            content: "text2",
            type: "LabelDecoration",
            childItems: [],
          },
          {
            content: "text3",
            type: "LabelDecoration",
            childItems: [],
          },
        ],
      },
    ])
  })

  it("should parse two groups hierarchy", () => {
    const mock = `#text1
  text2
  #text3
    text4`

    const tokens = tokenize(mock)
    const result = parseTree(tokens)
    const simplified = result.map(simplifyTreeNode)

    expect(simplified).toEqual([
      {
        content: "#text1",
        type: "VerticalGroup",
        childItems: [
          {
            content: "text2",
            type: "LabelDecoration",
            childItems: [],
          },
          {
            content: "#text3",
            type: "VerticalGroup",
            childItems: [
              {
                content: "text4",
                type: "LabelDecoration",
                childItems: [],
              },
            ],
          },
        ],
      },
    ])
  })

  it("should parse one line group item without header and name", () => {
    const mock = `% % text1; text2`

    const tokens = tokenize(mock)
    const result = parseTree(tokens)
    const simplified = result.map(simplifyTreeNode)

    expect(simplified).toEqual([
      {
        content: "% %",
        type: "OneLineGroup",
        childItems: [
          {
            content: "text1",
            type: "LabelDecoration",
            childItems: [],
          },
          {
            content: "text2",
            type: "LabelDecoration",
            childItems: [],
          },
        ],
      },
    ])
  })

  it("should parse one line group item with header and name", () => {
    const mock = `===group header{GroupName}; text1; text2`

    const tokens = tokenize(mock)
    const result = parseTree(tokens)
    const simplified = result.map(simplifyTreeNode)

    expect(simplified).toEqual([
      {
        content: "===group header{GroupName}",
        type: "OneLineGroup",
        childItems: [
          {
            content: "text1",
            type: "VerticalGroup",
          },
          {
            content: "text2",
            type: "VerticalGroup",
          },
        ],
      },
    ])
  })
})

const simplifyTreeNodes = (
  nodes: TreeNode[]
): { content: string; type: ParseElementType; childItems: { content: string; type: ParseElementType }[] }[] => {
  return nodes.map((node) => simplifyTreeNode(node))
}

// Вспомогательная функция для извлечения строки из токенов
const tokensToString = (tokens: any[]): string => {
  return tokens
    .map((token) => token.image)
    .join("")
    .trim()
}

// Вспомогательная функция для преобразования TreeNode в читаемый формат для тестов
const simplifyTreeNode = (
  node: TreeNode
): { content: string; type: ParseElementType; childItems: { content: string; type: ParseElementType }[] } => {
  const result: {
    content: string
    type: ParseElementType
    childItems?: { content: string; type: ParseElementType }[]
  } = {
    content: tokensToString(node.tokens),
    type: node.type,
    childItems: node.childItems.map(simplifyTreeNode),
  }

  return result
}
