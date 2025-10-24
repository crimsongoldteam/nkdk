import { expect, it } from "vitest"
import { mergeHorizontally } from "./mergeHorizontally"

it("should merge arrays horizontally", () => {
  const mock = [
    ["header 1", "text1"],
    ["header 2", "text2"],
  ]

  const expectedResult = ["header 1 #header 2", "text1    +text2   "]

  const result = mergeHorizontally(...mock)
  expect(result).toEqual(expectedResult)
})

it("should wrap to new line when second array is much larger", () => {
  const mock = [
    ["header 1", "text1"],
    ["header 2", "long text", "text3", "text4"],
  ]

  const expectedResult = [
    "header 1#header 2",
    "text1   +        ",
    "--------+        ",
    "text2            ",
    "text3            ",
    "text4            ",
  ]

  const result = mergeHorizontally(...mock)
  expect(result).toEqual(expectedResult)
})

it("should handle multiple arrays with wrapping", () => {
  const mock = [
    ["header 1", "text1"],
    ["header 2", "text2", "text3", "text4"],
    ["header 3", "text5", "text6", "text7", "text8"],
  ]

  const expectedResult = [
    "header 1#header 2#header 3",
    "text1   +        +text5   ",
    "--------+        +text6   ",
    "text2            +text7   ",
    "text3            +text8   ",
    "text4            +        ",
  ]

  const result = mergeHorizontally(...mock)
  expect(result).toEqual(expectedResult)
})

it("should handle multiple arrays with wrapping", () => {
  const mock = [
    ["header 1", "text1"],
    ["header 2", "text2", "text3", "text4"],
    ["header 3", "text5", "text6", "text7", "text8", "text9", "text10", "text11"],
  ]

  const expectedResult = [
    "header 1#header 2#header 3",
    "text1   +        +        ",
    "--------+        +        ",
    "text2            +        ",
    "text3            +        ",
    "text4            +        ",
    "-----------------+        ",
    "text5                     ",
    "text6                     ",
    "text7                     ",
    "text8                     ",
    "text9                     ",
    "text10                    ",
    "text11                    ",
  ]

  const result = mergeHorizontally(...mock)
  expect(result).toEqual(expectedResult)
})

// #Вертикальная группа
//   Поле1

// #Вертикальная группа 1 #Вертикальная группа 2
//   #Вертикальная группа 1
//     Поле1
//     Поле2
//   ###
//       Поле3
