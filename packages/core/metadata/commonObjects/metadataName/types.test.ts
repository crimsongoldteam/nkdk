import { is } from "typia"
import { describe, expect, it } from "vitest"
import { MetadataEnterpriseName } from "./types"

describe("MetadataName", () => {
  it("should be start with a letter or underscore", () => {
    expect(is<MetadataEnterpriseName>("test")).toBeTruthy()
    expect(is<MetadataEnterpriseName>("_test")).toBeTruthy()
    expect(is<MetadataEnterpriseName>("Тест")).toBeTruthy()
    expect(is<MetadataEnterpriseName>("test1")).toBeTruthy()

    expect(is<MetadataEnterpriseName>("1test")).toBeFalsy()
  })

  it("shouldn't contain any special characters and spaces", () => {
    expect(is<MetadataEnterpriseName>("test!")).toBeFalsy()
    expect(is<MetadataEnterpriseName>("test ")).toBeFalsy()
    expect(is<MetadataEnterpriseName>("test\t")).toBeFalsy()
    expect(is<MetadataEnterpriseName>("test\n")).toBeFalsy()
    expect(is<MetadataEnterpriseName>("test\r")).toBeFalsy()
    expect(is<MetadataEnterpriseName>("test\f")).toBeFalsy()
    expect(is<MetadataEnterpriseName>("test\v")).toBeFalsy()
    expect(is<MetadataEnterpriseName>("test\b")).toBeFalsy()
  })
})
