import { expect, it } from "vitest"

import type { FormDataPathIndex } from "@nkdk/runtime/rule-kit"
import type { OwnerMetadata } from "./contracts"
import {
  createDataPathRegistrySet,
  type DataPathContribution,
} from "./registry"
import type { DataPathTableInfo } from "./types"

it("isolates every data path contribution between rule sets", () => {
  const owner = { ref: { kind: "Sample", name: "Item" } } as OwnerMetadata
  const table = { kind: "ValueTable" } as DataPathTableInfo
  const index = {} as FormDataPathIndex
  const contributions = (marker: string): readonly DataPathContribution[] => [
    { kind: "ownerKind", registration: { kind: marker, projectDir: marker, rule: { itemType: marker, properties: {} }, typeDescriptionBases: [`${marker}Ref`], registerRecordSetBases: [`${marker}RecordSet`], metadataLinkPrefixes: [`${marker}Link`], aliases: [`${marker}Alias`] } },
    { kind: "typeResolver", resolver: () => ({ kinds: ["scalar"], nextTypes: [], sourceText: marker }) },
    { kind: "objectFieldCollections", provider: () => [{ collection: marker, kind: "attribute" }] },
    { kind: "standardAttributeType", resolver: () => ({ kinds: ["scalar"], nextTypes: [], sourceText: marker }) },
    { kind: "virtualOwnerField", resolver: () => ({ name: marker, typeInfo: { kinds: [], nextTypes: [], sourceText: marker } }) },
    { kind: "tableColumn", resolver: () => ({ name: marker, typeInfo: { kinds: [], nextTypes: [], sourceText: marker } }) },
    { kind: "traversalTransition", resolver: () => ({ sourceName: marker, typeInfo: { kinds: [], nextTypes: [], sourceText: marker } }) },
    { kind: "opaqueTraversal", resolver: () => true },
    { kind: "registerRecordsItem", resolver: () => ({ owner: owner.ref, typeInfo: { kinds: [], nextTypes: [], sourceText: marker }, tableSource: { table, columns: new Map(), hasColumns: true } }) },
    { kind: "standardMembers", ownerKind: marker, members: [{ memberKind: "standardAttribute", family: "primitive", kind: "string", names: { internal: marker, yaml: marker }, phase: "index-time", sourceScope: "self" }] },
  ]
  const first = createDataPathRegistrySet(contributions("first"))
  const second = createDataPathRegistrySet(contributions("second"))

  expect(first.getOwnerKind("first")?.projectDir).toBe("first")
  expect(first.getOwnerKind("firstAlias")?.projectDir).toBe("first")
  expect(first.getOwnerKindByItemType("first")?.kind).toBe("first")
  expect(first.getOwnerKindByTypeDescriptionBase("firstRef")).toBe("first")
  expect(first.getOwnerKindByRegisterRecordSetBase("firstRecordSet")).toBe("first")
  expect(first.getOwnerKindByMetadataLinkPrefix("firstLink")).toBe("first")
  expect(first.getMetadataLinkPrefixesByOwnerKind("first")).toEqual(["firstLink"])
  expect(first.getOwnerKind("second")).toBeUndefined()
  expect(second.resolveType({ baseType: "x" })?.sourceText).toBe("second")
  expect(first.getObjectFieldCollections(owner)[0]?.collection).toBe("first")
  expect(first.resolveStandardAttributeType({ owner, internalName: "x", yamlName: "x" })?.sourceText).toBe("first")
  expect(first.resolveVirtualOwnerField({ owner, segment: "x" })?.name).toBe("first")
  expect(first.resolveTableColumn({ table, segment: "x", index })?.name).toBe("first")
  const transition = first.resolveTraversalTransition({
    owner,
    segment: "x",
    ownerCache: { get: () => ({ status: "not-found", diagnostics: [] }), listRefs: () => [] },
  })
  expect(transition?.kind === "warning" ? undefined : transition?.typeInfo.sourceText).toBe("first")
  expect(first.isOpaqueTraversal({ owner: owner.ref, segment: "x" })).toBe(true)
  expect(first.resolveRegisterRecordsItem({ owner, segment: "x" })?.typeInfo.sourceText).toBe("first")
  expect(first.getStandardMembers("first")[0]?.names.internal).toBe("first")
  expect(first.standardMemberInternalToYaml("first")).toBe("first")
  expect(first.standardMemberYamlToInternalForOwnerKind("first", "first")).toBe("first")
})

it("binds resolver providers to the owner kinds of their registry set", () => {
  const createRules = (ownerKind: string): readonly DataPathContribution[] => [
    {
      kind: "provider",
      create: (ownerKinds) => [
        { kind: "ownerKind", registration: { kind: ownerKind, projectDir: ownerKind, rule: { itemType: ownerKind, properties: {} }, metadataLinkPrefixes: ["Shared"] } },
        { kind: "typeResolver", resolver: () => ({ kinds: ["object"], nextTypes: [{ kind: ownerKinds.getByMetadataLinkPrefix("Shared") ?? "missing" }] }) },
      ],
    },
  ]
  const first = createDataPathRegistrySet(createRules("first"))
  const second = createDataPathRegistrySet(createRules("second"))

  expect(first.resolveType({ baseType: "x" })?.nextTypes[0]?.kind).toBe("first")
  expect(second.resolveType({ baseType: "x" })?.nextTypes[0]?.kind).toBe("second")
})
