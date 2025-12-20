import { describe, expect, it } from "vitest"
import { checkPascalEqually } from "./checkPascalEqually"

describe("checkPascalEqually", () => {
  it("should check single word", () => {
    expect(checkPascalEqually("Test", "Test")).toBeTruthy()
  })

  it("should check few words with small letters", () => {
    expect(checkPascalEqually("Test test", "TestTest")).toBeTruthy()
  })

  it("should check few words with capital letters", () => {
    expect(checkPascalEqually("Test Test", "TestTest")).toBeFalsy()
  })

  it("should check abbreviation", () => {
    expect(checkPascalEqually("USSR", "USSR")).toBeTruthy()
  })

  it("should check abbreviation with small letters", () => {
    expect(checkPascalEqually("Back in USSR", "BackInUSSR")).toBeTruthy()
  })

  it("should check pascal case", () => {
    expect(checkPascalEqually("TestTest", "TestTest")).toBeTruthy()
  })
})
