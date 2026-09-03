import { expect, it } from "vitest"
import { ownerFormLinks } from "./formLinks"
import { parseMetadataTargetFromYAML } from "../metadataTargets"

it("общая ссылка на форму сохраняет владельца и разрешает общую форму", () => {
  const rule = ownerFormLinks.defaultObjectForm
  const owner = { root: "Catalog", objectName: "Товары" } as const
  expect(parseMetadataTargetFromYAML({ value: "ФормаЭлемента", constraint: rule.metadataTarget, owner }))
    .toMatchObject({ ok: true, canonical: "Catalog.Товары.Form.ФормаЭлемента" })
  expect(parseMetadataTargetFromYAML({ value: "ОбщаяФорма.Выбор", constraint: rule.metadataTarget, owner }))
    .toMatchObject({ ok: true, canonical: "CommonForm.Выбор" })
  expect(parseMetadataTargetFromYAML({ value: "Документ.Заказ", constraint: rule.metadataTarget, owner }).ok).toBe(false)
  expect(rule).toMatchObject({ yaml: "ОсновнаяФормаОбъекта", xmlParents: ["Properties"], defaultValueXMLRaw: "" })
})
