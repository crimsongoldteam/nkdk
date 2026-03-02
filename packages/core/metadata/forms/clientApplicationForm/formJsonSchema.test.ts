import { describe, expect, it } from "vitest"
import {
  buildClientApplicationFormJsonSchema,
  ClientApplicationFormJsonSchema,
} from "./formJsonSchema"
import { ClientApplicationFormRules } from "./rules"

describe("formJsonSchema", () => {
  it("выводит JSON Schema для формы приложения", () => {
    const schema = ClientApplicationFormJsonSchema as Record<string, unknown>
    const out = JSON.stringify(schema, null, 2)
    // eslint-disable-next-line no-console
    console.log(out)
    expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#")
    expect(schema.type).toBe("object")
    expect(schema.properties).toBeDefined()
    const props = schema.properties as Record<string, unknown>
    expect(props["Заголовок"]).toBeDefined()
    expect(props["Реквизиты"]).toBeDefined()
    expect(props["События"]).toBeDefined()
  })

  it("buildClientApplicationFormJsonSchema строит схему по переданным rules", () => {
    const schema = buildClientApplicationFormJsonSchema(
      ClientApplicationFormRules
    ) as Record<string, unknown>
    expect(schema.$schema).toBe("http://json-schema.org/draft-07/schema#")
    expect(schema.properties).toBeDefined()
  })
})
