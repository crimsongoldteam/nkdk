import { expect, it } from "vitest"

import { defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { parseMetadataYaml } from "../../yaml/parseMetadataYaml"
import { createValidationRegistrySet } from "./validationRegistrySet"

it("uses the local YAML validator from its own definition", () => {
  const createRules = (message: string) =>
    defineMetadataRules({
      ...emptyMetadataRules,
      validation: [
        {
          kind: "localYamlValue" as const,
          propertyType: "Sample",
          validate: () => [
            {
              filePath: "project/Sample.yaml",
              line: 1,
              col: 1,
              message,
              severity: "error" as const,
              source: "structure" as const,
            },
          ],
        },
      ],
    })
  const first = createValidationRegistrySet(createRules("first"))
  const second = createValidationRegistrySet(createRules("second"))
  const input = {
    type: "Sample",
    filePath: "project/Sample.yaml",
    parsed: parseMetadataYaml("{}"),
    value: "value",
    yamlPath: [],
    owner: { dir: "project", name: "Sample" },
  }

  expect(first.validateLocalValue(input).diagnostics[0]?.message).toBe("first")
  expect(second.validateLocalValue(input).diagnostics[0]?.message).toBe("second")
})
