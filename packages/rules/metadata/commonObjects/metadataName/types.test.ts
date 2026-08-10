import { describe, expect, it } from "vitest"
import { isMetadataNameYAML } from "./types"

describe("MetadataName", () => {
  it("should be start with a letter or underscore", () => {
    expect(isMetadataNameYAML("test")).toBeTruthy()
    expect(isMetadataNameYAML("_test")).toBeTruthy()
    expect(isMetadataNameYAML("Тест")).toBeTruthy()
    expect(isMetadataNameYAML("test1")).toBeTruthy()

    expect(isMetadataNameYAML("1test")).toBeFalsy()
  })

  it("shouldn't contain any special characters and spaces", () => {
    expect(isMetadataNameYAML("test!")).toBeFalsy()
    expect(isMetadataNameYAML("test ")).toBeFalsy()
    expect(isMetadataNameYAML("test\t")).toBeFalsy()
    expect(isMetadataNameYAML("test\n")).toBeFalsy()
    expect(isMetadataNameYAML("test\r")).toBeFalsy()
    expect(isMetadataNameYAML("test\f")).toBeFalsy()
    expect(isMetadataNameYAML("test\v")).toBeFalsy()
    expect(isMetadataNameYAML("test\b")).toBeFalsy()
  })
})
