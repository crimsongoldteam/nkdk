import { describe, expect, expectTypeOf, it } from "vitest"
import { metadataItemLinkRule, metadataItemLinksRule } from "./types"

describe("построители metadata-ссылок", () => {
  it.each([
    { kind: "object", roots: ["Catalog"] },
    { kind: "member", owner: "explicit", memberKinds: ["Form"] },
    { kind: "dataTable", roots: ["InformationRegister"], validation: "translateOnly" },
    { kind: "dataTableField", tableProperty: "mainTable", validation: "resolve" },
  ] as const)("сохраняет цель $kind и её ограничения без пересечения с object", (target) => {
    const single = metadataItemLinkRule({ yaml: "Форма", metadataTarget: target })
    const multiple = metadataItemLinksRule({ yaml: "Формы", metadataTarget: target })
    expectTypeOf(single.metadataTarget).toEqualTypeOf<typeof target>()
    expectTypeOf(multiple.metadataTarget).toEqualTypeOf<typeof target>()
    expect(single.metadataTarget).toEqual(target)
    expect(multiple.metadataTarget).toEqual(target)
  })

  it("оставляет object целью по умолчанию", () => {
    const single = metadataItemLinkRule({ yaml: "Объект" })
    const multiple = metadataItemLinksRule({ yaml: "Объекты" })
    expectTypeOf(single.metadataTarget).toEqualTypeOf<{ readonly kind: "object" }>()
    expectTypeOf(multiple.metadataTarget).toEqualTypeOf<{ readonly kind: "object" }>()
    expect(single.metadataTarget).toEqual({ kind: "object" })
    expect(multiple.metadataTarget).toEqual({ kind: "object" })
  })
})
