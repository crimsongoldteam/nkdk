import { describe, expect, expectTypeOf, it } from "vitest"
import { metadataItemLinkRule, metadataItemLinksRule } from "./types"

describe("построители metadata-ссылок", () => {
  it("сохраняет заданный вид цели без пересечения с object", () => {
    const target = { kind: "member", owner: "explicit", memberKinds: ["Form"] } as const
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
