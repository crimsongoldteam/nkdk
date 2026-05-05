// import { describe, expect, it } from "vitest"
// import { mockContext } from "~/tests/mockContext"
// import { tokenize } from "../tokenizer/tokenizer"
// import { parseTree } from "./treeParser"
// import { ParseElementType, TreeNode } from "./types"

// describe("parseTree", () => {
//   it("should parse one item", () => {
//     const mock = `text`

//     const tokens = tokenize(mock)

//     const result = parseTree(mockContext, tokens)
//     const simplified = simplifyTreeNodes(result)

//     expect(simplified).toEqual([
//       {
//         content: "text",
//         type: "LabelDecoration",
//         childItems: [],
//       },
//     ])
//   })

//   it("should parse two lines", () => {
//     const mock = `text
// text2`

//     const tokens = tokenize(mock)
//     const result = parseTree(mockContext, tokens)
//     const simplified = result.map(simplifyTreeNode)

//     expect(simplified).toEqual([
//       {
//         content: "text",
//         type: "LabelDecoration",
//         childItems: [],
//       },
//       {
//         content: "text2",
//         type: "LabelDecoration",
//         childItems: [],
//       },
//     ])
//   })

//   it("should parse two line items with one indent", () => {
//     const mock = `#group1
//   text2`

//     const tokens = tokenize(mock)
//     const result = parseTree(mockContext, tokens)
//     const simplified = simplifyTreeNodes(result)

//     expect(simplified).toEqual([
//       {
//         content: "#group1",
//         type: "VerticalGroup",
//         childItems: [
//           {
//             content: "text2",
//             type: "LabelDecoration",
//             childItems: [],
//           },
//         ],
//       },
//     ])
//   })

//   it("should parse text items with wrong indents", () => {
//     const mock = `text1
//   text2`

//     const tokens = tokenize(mock)
//     const result = parseTree(mockContext, tokens)
//     const simplified = simplifyTreeNodes(result)

//     expect(simplified).toEqual([
//       {
//         content: "text1",
//         type: "LabelDecoration",
//         childItems: [],
//       },
//       {
//         content: "text2",
//         type: "LabelDecoration",
//         childItems: [],
//       },
//     ])
//   })

//   it("should parse two line items with tab indent", () => {
//     const mock = `text1
// \ttext2`

//     const tokens = tokenize(mock)
//     const result = parseTree(mockContext, tokens)
//     const simplified = simplifyTreeNodes(result)

//     expect(simplified).toEqual([
//       {
//         content: "text1",
//         type: "LabelDecoration",
//         childItems: [],
//       },
//       {
//         content: "text2",
//         type: "LabelDecoration",
//         childItems: [],
//       },
//     ])
//   })

//   describe("auto command bar", () => {
//     it("should parse as form AutoCommandBar if it is without name and first line", () => {
//       const mock = `<| Button1 >`

//       const tokens = tokenize(mock)
//       const result = parseTree(mockContext, tokens)
//       const simplified = result.map(simplifyTreeNode)

//       expect(simplified).toEqual([
//         {
//           content: "<| Button1 >",
//           type: "AutoCommandBar",
//           childItems: [],
//         },
//       ])
//     })

//     it("should parse as form AutoCommandBar it is without name and next item is table", () => {
//       const mock = `text
// <| Button1 >
// |Column1| {name}`

//       const tokens = tokenize(mock)
//       const result = parseTree(mockContext, tokens)
//       const simplified = result.map(simplifyTreeNode)

//       expect(simplified).toEqual([
//         {
//           content: "text",
//           type: "LabelDecoration",
//           childItems: [],
//         },
//         {
//           content: "|Column1| {name}",
//           type: "Table",
//           childItems: [],
//           autoCommandBar: {
//             content: "<| Button1 >",
//             type: "AutoCommandBar",
//             childItems: [],
//           },
//         },
//       ])
//     })

//     it("should parse as CommandBar if it is with name and next item is table", () => {
//       const mock = `<| Button1 > {name}
// |Column1| {name}`

//       const tokens = tokenize(mock)
//       const result = parseTree(mockContext, tokens)
//       const simplified = result.map(simplifyTreeNode)

//       expect(simplified).toEqual([
//         {
//           content: "<| Button1 > {name}",
//           type: "CommandBar",
//           childItems: [],
//         },
//         {
//           content: "|Column1| {name}",
//           type: "Table",
//           childItems: [],
//         },
//       ])
//     })

//     it("should parse as CommandBar if it is with name", () => {
//       const mock = `<| Button1 > {name}`

//       const tokens = tokenize(mock)
//       const result = parseTree(mockContext, tokens)
//       const simplified = result.map(simplifyTreeNode)

//       expect(simplified).toEqual([
//         {
//           content: "<| Button1 > {name}",
//           type: "CommandBar",
//           childItems: [],
//         },
//       ])
//     })

//     it("should parse as CommandBar if it isn't first line", () => {
//       const mock = `text1
// <| Button1 > {name}`

//       const tokens = tokenize(mock)
//       const result = parseTree(mockContext, tokens)
//       const simplified = result.map(simplifyTreeNode)

//       expect(simplified).toEqual([
//         {
//           content: "text1",
//           type: "LabelDecoration",
//           childItems: [],
//         },
//         {
//           content: "<| Button1 > {name}",
//           type: "CommandBar",
//           childItems: [],
//         },
//       ])
//     })
//   })

//   describe("groups", () => {
//     it("should parse group item with two child items", () => {
//       const mock = `#text1
//   text2
//   text3`

//       const tokens = tokenize(mock)
//       const result = parseTree(mockContext, tokens)
//       const simplified = result.map(simplifyTreeNode)

//       expect(simplified).toEqual([
//         {
//           content: "#text1",
//           type: "VerticalGroup",
//           childItems: [
//             {
//               content: "text2",
//               type: "LabelDecoration",
//               childItems: [],
//             },
//             {
//               content: "text3",
//               type: "LabelDecoration",
//               childItems: [],
//             },
//           ],
//         },
//       ])
//     })

//     it("should parse two groups hierarchy", () => {
//       const mock = `#text1
//   text2
//   #text3
//     text4`

//       const tokens = tokenize(mock)
//       const result = parseTree(mockContext, tokens)
//       const simplified = result.map(simplifyTreeNode)

//       expect(simplified).toEqual([
//         {
//           content: "#text1",
//           type: "VerticalGroup",
//           childItems: [
//             {
//               content: "text2",
//               type: "LabelDecoration",
//               childItems: [],
//             },
//             {
//               content: "#text3",
//               type: "VerticalGroup",
//               childItems: [
//                 {
//                   content: "text4",
//                   type: "LabelDecoration",
//                   childItems: [],
//                 },
//               ],
//             },
//           ],
//         },
//       ])
//     })

//     it("should parse one line group item without header and name", () => {
//       const mock = `% % text1; text2`

//       const tokens = tokenize(mock)
//       const result = parseTree(mockContext, tokens)
//       const simplified = result.map(simplifyTreeNode)

//       expect(simplified).toEqual([
//         {
//           content: "% %",
//           type: "OneLineHorizontalGroup",
//           childItems: [
//             {
//               content: "text1",
//               type: "LabelDecoration",
//               childItems: [],
//             },
//             {
//               content: "text2",
//               type: "LabelDecoration",
//               childItems: [],
//             },
//           ],
//         },
//       ])
//     })

//     it("should parse one line group item with header and name", () => {
//       const mock = `%group header{GroupName}% text1; text2`

//       const tokens = tokenize(mock)
//       const result = parseTree(mockContext, tokens)
//       const simplified = result.map(simplifyTreeNode)

//       expect(simplified).toEqual([
//         {
//           content: "%group header{GroupName}%",
//           type: "OneLineHorizontalGroup",
//           childItems: [
//             {
//               content: "text1",
//               type: "LabelDecoration",
//               childItems: [],
//             },
//             {
//               content: "text2",
//               type: "LabelDecoration",
//               childItems: [],
//             },
//           ],
//         },
//       ])
//     })
//   })
// })

// const simplifyTreeNodes = (
//   nodes: TreeNode[]
// ): { content: string; type: ParseElementType; childItems: { content: string; type: ParseElementType }[] }[] => {
//   return nodes.map((node) => simplifyTreeNode(node))
// }

// // Вспомогательная функция для извлечения строки из токенов
// const tokensToString = (tokens: any[]): string => {
//   return tokens
//     .map((token) => token.image)
//     .join("")
//     .trim()
// }

// interface SimplifyTreeNodeResult {
//   content: string
//   type: ParseElementType
//   childItems: { content: string; type: ParseElementType }[]
//   autoCommandBar?: {
//     content: string
//     type: ParseElementType
//     childItems: { content: string; type: ParseElementType }[]
//   }
// }
// // Вспомогательная функция для преобразования TreeNode в читаемый формат для тестов
// const simplifyTreeNode = (node: TreeNode): SimplifyTreeNodeResult => {
//   const result: SimplifyTreeNodeResult = {
//     content: tokensToString(node.tokens),
//     type: node.type,
//     childItems: node.childItems.map(simplifyTreeNode),
//   }
//   if (node.autoCommandBar) {
//     result.autoCommandBar = simplifyTreeNode(node.autoCommandBar)
//   }
//   return result
// }
