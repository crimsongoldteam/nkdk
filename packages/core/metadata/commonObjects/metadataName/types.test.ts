import { is } from "typia"
import { describe, expect, it } from "vitest"
import { MetadataNameEnterprise } from "./types"

describe("MetadataName", () => {
  it("should be start with a letter or underscore", () => {
    expect(is<MetadataNameEnterprise>("test")).toBeTruthy()
    expect(is<MetadataNameEnterprise>("_test")).toBeTruthy()
    expect(is<MetadataNameEnterprise>("Тест")).toBeTruthy()
    expect(is<MetadataNameEnterprise>("test1")).toBeTruthy()

    expect(is<MetadataNameEnterprise>("1test")).toBeFalsy()
  })

  it("shouldn't contain any special characters and spaces", () => {
    expect(is<MetadataNameEnterprise>("test!")).toBeFalsy()
    expect(is<MetadataNameEnterprise>("test ")).toBeFalsy()
    expect(is<MetadataNameEnterprise>("test\t")).toBeFalsy()
    expect(is<MetadataNameEnterprise>("test\n")).toBeFalsy()
    expect(is<MetadataNameEnterprise>("test\r")).toBeFalsy()
    expect(is<MetadataNameEnterprise>("test\f")).toBeFalsy()
    expect(is<MetadataNameEnterprise>("test\v")).toBeFalsy()
    expect(is<MetadataNameEnterprise>("test\b")).toBeFalsy()
  })
})
