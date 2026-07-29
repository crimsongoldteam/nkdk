import { expectTypeOf, it } from "vitest"

import type { BasePropertyRule } from "./types"

it("не содержит устаревшие поля порядка и присутствия", () => {
  type HasOrder = "order" extends keyof BasePropertyRule ? true : false
  type HasPresenceFromOrder =
    "configurationIndexPresenceFromOrder" extends keyof BasePropertyRule ? true : false

  expectTypeOf<HasOrder>().toEqualTypeOf<false>()
  expectTypeOf<HasPresenceFromOrder>().toEqualTypeOf<false>()
})
