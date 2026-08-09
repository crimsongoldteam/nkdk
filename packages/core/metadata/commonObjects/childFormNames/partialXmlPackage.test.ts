import { expect, it } from "vitest"
import { registerCoreMetadata } from "../../register"
import { resolvePartialXmlPackagePolicy } from "../../partialSyncToXml/packagePolicy"
import { compileRegisteredMetadataResourceTopology } from "../../resourceTopology/registry"

registerCoreMetadata()

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
    loadDocumentIds: [metadata.id],
    structural: {
      includeOwnerAssignment: true,
      includeCurrentMemberSubtree: true,
      stopAtOwner: true,
    },
  })
  expect(policy?.loadDocumentIds).not.toContain(body.id)
  expect(assignment.externalFiles.length).toBeGreaterThan(0)
  expect(assignment.externalFiles.every((file) => resolved.externalFiles.get(file.id)?.loadTarget)).toBe(true)
})
