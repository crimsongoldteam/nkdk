import { is } from "typia"
import { describe, expect, it } from "vitest"
import { MetadataNameYAML } from "./types"

describe("MetadataName", () => {
  it("should be start with a letter or underscore", () => {
    expect(is<MetadataNameYAML>("test")).toBeTruthy()
    expect(is<MetadataNameYAML>("_test")).toBeTruthy()
    expect(is<MetadataNameYAML>("Тест")).toBeTruthy()
    expect(is<MetadataNameYAML>("test1")).toBeTruthy()

    expect(is<MetadataNameYAML>("1test")).toBeFalsy()
  })

  it("shouldn't contain any special characters and spaces", () => {
    expect(is<MetadataNameYAML>("test!")).toBeFalsy()
    expect(is<MetadataNameYAML>("test ")).toBeFalsy()
    expect(is<MetadataNameYAML>("test\t")).toBeFalsy()
    expect(is<MetadataNameYAML>("test\n")).toBeFalsy()
    expect(is<MetadataNameYAML>("test\r")).toBeFalsy()
    expect(is<MetadataNameYAML>("test\f")).toBeFalsy()
    expect(is<MetadataNameYAML>("test\v")).toBeFalsy()
    expect(is<MetadataNameYAML>("test\b")).toBeFalsy()
  })
})
