import { describe, expect, it } from "vitest"
import { exportXMLRootToXML } from "./toXML"

describe("exportXMLRootToXML", () => {
  it("возвращает undefined при любом входе — обёртка обрабатывается оркестратором", () => {
    const result = exportXMLRootToXML()
    expect(result).toBeUndefined()
  })
})
