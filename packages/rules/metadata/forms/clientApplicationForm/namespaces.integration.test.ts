import { describe, expect, it } from "vitest"
import { createConfigurationIndexCollector, parseXmlDocumentWithSaxes, withConfigurationIndexCollector } from "@nkdk/runtime"
import "../../../tests/metadataExecutionContext"
import { mockContextFromXML } from "../../../tests/mockContext"
import { recordClientApplicationFormNamespaces } from "./namespaces"

describe("пространства имён структурного XML формы", () => {
  it.each([false, true])("читает атрибуты без compatibility; dcssch: %s", (present) => {
    const attribute = present ? ' xmlns:dcssch="http://v8.1c.ru/8.1/data-composition-system/schema"' : ""
    const root = parseXmlDocumentWithSaxes(`<Form${attribute}/>`).roots[0]!
    Object.defineProperty(root, "compatibilityValue", { get() { throw new Error("Не читать compatibility") } })
    const collector = createConfigurationIndexCollector()
    recordClientApplicationFormNamespaces(
      withConfigurationIndexCollector(mockContextFromXML(), collector, "Форма.Тест"), root,
    )
    expect(collector.fragment("Форма.yaml").entities).toContainEqual({
      logicalAddress: "Форма.Тест.XMLNamespace.dcssch", xmlValue: present ? "present" : "absent",
    })
  })
})
