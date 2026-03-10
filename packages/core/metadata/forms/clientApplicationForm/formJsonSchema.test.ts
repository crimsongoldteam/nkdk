import { describe, it } from "vitest"
import { mockContext } from "~/tests/mockContext"
import { exportClientApplicationFormToJSONSchema } from "./toJSONSchema"
import { ClientApplicationForm } from "./types"

describe.skip("formJsonSchema", () => {
  it("выводит JSON Schema для формы приложения", () => {
    const form = {
      itemType: "ClientApplicationForm",
      commands: [],
      childItems: [
        {
          itemType: "InputField",
          name: "name",
        },
      ],
    } satisfies ClientApplicationForm

    const schema = exportClientApplicationFormToJSONSchema({
      context: mockContext,
      value: form,
    })
    // const schema = ClientApplicationFormJsonSchema as Record<string, unknown>
    const out = JSON.stringify(schema, null, 2)
    // // eslint-disable-next-line no-console
    // writeFileSync(join(__dirname, "schema.json"), out)
    console.log(out)
  })
})
