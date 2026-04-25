import { describe, expect, it } from "vitest"
import { exportMetaDataObjectToXML } from "./toXML"

describe("exportMetaDataObjectToXML", () => {
  it("возвращает undefined при любом входе — обёртка обрабатывается оркестратором", () => {
    const result = exportMetaDataObjectToXML()
    expect(result).toBeUndefined()
  })
})
