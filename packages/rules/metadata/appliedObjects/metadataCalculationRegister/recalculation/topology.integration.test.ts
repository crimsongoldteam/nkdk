import { describe, expect, it } from "vitest"

import { metadataRules } from "../../../composition/metadataRules"
import {
  createMetadataExecutionRegistrySets,
  withMetadataExecutionRegistrySets,
} from "../../../composition/metadataExecutionContext"
import { compileRegisteredMetadataResourceTopology } from "../../../resourceTopology/adapters/registeredRules"

describe("Recalculation resource topology", () => {
  it("maps semantic properties and record-set module to calculation-register XML", () => {
    const topology = withMetadataExecutionRegistrySets(
      createMetadataExecutionRegistrySets(metadataRules),
      () => compileRegisteredMetadataResourceTopology(),
    )
    const assignment = topology.assignments.find(
      (candidate) => candidate.projectPattern ===
        "РегистрРасчета/{ownerName}/Перерасчеты/{itemName}/Свойства.yaml",
    )

    expect(assignment).toMatchObject({
      ownerProjectPattern: "РегистрРасчета/{ownerName}/Свойства.yaml",
      itemRule: { itemType: "MetadataCalculationRegisterRecalculation" },
      xmlDocuments: [expect.objectContaining({
        xmlPattern: "CalculationRegisters/{ownerName}/Recalculations/{itemName}.xml",
        role: "metadata",
      })],
      externalFiles: expect.arrayContaining([expect.objectContaining({
        projectPattern:
          "РегистрРасчета/{ownerName}/Перерасчеты/{itemName}/МодульНабораЗаписей.bsl",
        xmlPattern:
          "CalculationRegisters/{ownerName}/Recalculations/{itemName}/Ext/RecordSetModule.bsl",
      })]),
    })
    expect(topology.assignments.some((candidate) =>
      candidate.projectPattern.includes("Recalculation.xml") ||
      candidate.projectPattern.includes("Свойства.xml"))).toBe(false)
  })
})
