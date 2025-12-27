import { is } from "typia"
import { describe, expect, it } from "vitest"
import { MetadataName } from "./types"

describe("MetadataName", () => {
  it("should be start with a letter or underscore", () => {
    expect(is<MetadataName>("test")).toBeTruthy()
    expect(is<MetadataName>("_test")).toBeTruthy()
    expect(is<MetadataName>("Тест")).toBeTruthy()
    expect(is<MetadataName>("test1")).toBeTruthy()

    expect(is<MetadataName>("1test")).toBeFalsy()
  })

  it("shouldn't contain any special characters and spaces", () => {
    expect(is<MetadataName>("test!")).toBeFalsy()
    expect(is<MetadataName>("test ")).toBeFalsy()
    expect(is<MetadataName>("test\t")).toBeFalsy()
    expect(is<MetadataName>("test\n")).toBeFalsy()
    expect(is<MetadataName>("test\r")).toBeFalsy()
    expect(is<MetadataName>("test\f")).toBeFalsy()
    expect(is<MetadataName>("test\v")).toBeFalsy()
    expect(is<MetadataName>("test\b")).toBeFalsy()
  })
})
