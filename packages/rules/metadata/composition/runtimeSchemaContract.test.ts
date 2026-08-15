import { expect, it } from "vitest"

import { metadataRules } from "./metadataRules"

const workers = {
  preparedYamlProject: new URL("file:///test/prepared.js"),
  importFromXml: new URL("file:///test/import.js"),
  fullSyncToXml: new URL("file:///test/sync.js"),
  generic: new URL("file:///test/generic.js"),
}

it("exports a named schema through the rules-bound runtime without legacy registration", async () => {
  const runtime = metadataRules.createRuntime({ workers })

  const schema = runtime.schemas.exportByName({
    context: { languages: { default: "ru", registered: ["ru"], registeredSet: new Set(["ru"]), version: '["ru",["ru"]]' }, version: "2.20" },
    name: "InputField",
    mode: "externalRefs",
  })

  expect(schema).toEqual(expect.objectContaining({ type: "object" }))
  await runtime.close()
})
