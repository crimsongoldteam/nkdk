import { describe, expect, it } from "vitest"
import { mockContextToXML } from "~/tests/mockContext"
import { exportChildTemplateNamesToXML } from "./toXML"

const rule = { type: "ChildTemplateNames" as const, xml: "Template", folderName: "Макеты", forReferenceOnly: true as const }

const ctxWithTemplates = (templates: string[]) => {
  const ctx = mockContextToXML()
  ctx.exportToXML.context!.templates = templates
  return ctx
}

describe("exportChildTemplateNamesToXML", () => {
  it("возвращает value при наличии макетов в round-trip-данных", () => {
    expect(
      exportChildTemplateNamesToXML({ context: mockContextToXML(), rule, value: ["Макет", "МакетПечати"] })
    ).toEqual(["Макет", "МакетПечати"])
  })

  it("возвращает макеты из контекста при пустом value (IO-путь)", () => {
    expect(
      exportChildTemplateNamesToXML({ context: ctxWithTemplates(["Макет"]), rule, value: [] })
    ).toEqual(["Макет"])
  })

  it("возвращает макеты из контекста при value = undefined", () => {
    expect(
      exportChildTemplateNamesToXML({ context: ctxWithTemplates(["Макет"]), rule, value: undefined })
    ).toEqual(["Макет"])
  })

  it("возвращает undefined при пустом value и пустом контексте макетов", () => {
    expect(
      exportChildTemplateNamesToXML({ context: mockContextToXML(), rule, value: [] })
    ).toBeUndefined()
  })
})
