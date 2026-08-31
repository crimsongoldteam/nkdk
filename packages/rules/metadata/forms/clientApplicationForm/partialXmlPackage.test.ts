import { expect, it } from "vitest"
import { resolvePartialXmlPackagePolicy } from "../../partialSyncToXml/packagePolicy"
import { compileRegisteredMetadataResourceTopology } from "../../resourceTopology/adapters/registeredRules"


it("регистрирует состав частичного XML-пакета формы", () => {
  const topology = compileRegisteredMetadataResourceTopology()
  const assignment = topology.assignments.find(
    (candidate) => candidate.projectPattern === "Справочник/{ownerName}/Формы/{itemName}/Форма.yaml"
  )!
  const resolved = resolvePartialXmlPackagePolicy(topology)
  const policy = resolved.assignments.get(assignment.id)
  const metadata = assignment.xmlDocuments.find((document) => document.role === "metadata")!
  const body = assignment.xmlDocuments.find((document) => document.role === "body")!

  expect(policy).toMatchObject({
    loadDocumentIds: [metadata.id, body.id],
    structural: {
      includeOwnerAssignment: true,
      includeCurrentMemberSubtree: true,
      stopAtOwner: true,
    },
  })
  expect(policy?.yamlCompanionInputIds).toEqual([
    assignment.yamlCompanions.find(({ projectRole }) => projectRole === "form")?.id,
  ])
  expect(assignment.externalFiles.length).toBeGreaterThan(0)
  expect(assignment.externalFiles.every((file) => resolved.externalFiles.get(file.id)?.loadTarget)).toBe(true)

  const common = topology.assignments.find(
    (candidate) => candidate.projectPattern === "ОбщаяФорма/{ownerName}/Свойства.yaml"
  )!
  const commonMetadata = common.xmlDocuments.find((document) => document.role === "metadata")!
  const commonBody = common.xmlDocuments.find((document) => document.role === "body")!
  expect(resolved.assignments.get(common.id)?.loadDocumentIds).toEqual([
    commonMetadata.id,
    commonBody.id,
  ])
  expect(resolved.assignments.get(common.id)?.yamlCompanionInputIds).toEqual([
    common.yamlCompanions.find(({ projectRole }) => projectRole === "form")?.id,
  ])
})
