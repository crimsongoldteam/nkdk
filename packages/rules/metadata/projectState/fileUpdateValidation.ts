import { CollectableElementTypeToYAML } from "../ruleRuntime/formElement/types"
import type { MetadataProjectResourceKind } from "../projectDefinition/resources"
import { memberKindToYAML, rootToYAML } from "@nkdk/runtime/rule-kit"
import type { ProjectStateFileUpdateBatch, ProjectStateImportIndexContribution } from "./contracts/fileUpdate"
import { currentRuleRegistrySet } from "@nkdk/runtime/rule-kit"

export const PROJECT_STATE_HASH_BYTE_LENGTH = 8
const HASH_BYTE_LENGTH = PROJECT_STATE_HASH_BYTE_LENGTH
export function assertProjectStateFileUpdateBatch(value: unknown): asserts value is ProjectStateFileUpdateBatch {
  const batch = requiredRecord(value, "ProjectStateFileUpdateBatch")
  assertExactKeys(batch, ["updates", "hashBytes"], "ProjectStateFileUpdateBatch")
  if (!Array.isArray(batch["updates"])) throw new Error("updates должен быть массивом")
  if (!(batch["hashBytes"] instanceof Uint8Array)) throw new Error("hashBytes должен быть Uint8Array")

  const hashBytes = batch["hashBytes"]
  const expectedLength = batch["updates"].length * HASH_BYTE_LENGTH
  if (hashBytes.byteOffset !== 0) throw new Error("hashBytes должен владеть ArrayBuffer с нулевого смещения")
  if (hashBytes.byteLength !== expectedLength || hashBytes.buffer.byteLength !== expectedLength) {
    throw new Error(`hashBytes должен занимать ${expectedLength} байт`)
  }

  batch["updates"].forEach((update, index) => assertProjectStateFileUpdate(update, `updates[${index}]`))
}

export function assertProjectStateImportFinalFileState(value: unknown, path: string): void {
  const update = requiredRecord(value, path)
  assertPortableData(update, path)
  if (update["kind"] === "resource") {
    assertExactKeys(update, ["kind", "projectPath", "componentPath", "resourceKind", "targets"], path)
    assertProjectStateFileUpdate(update, path)
    assertPortableData(update, path)
    return
  }
  if (update["kind"] !== "yaml") throw new Error(`${path}.kind имеет неизвестное значение`)
  assertExactKeys(update, [
    "kind",
    "projectPath",
    "componentPath",
    "resourceKind",
    "yamlRole",
    "localValidation",
    "pendingReferences",
    "pendingChecks",
    "dependencies",
  ], path)
  assertProjectStateFileUpdate({
    ...update,
    targets: [],
    owners: [],
    fields: [],
    forms: [],
  }, path)
}

export function assertProjectStateImportIndexContribution(
  value: unknown,
  path: string,
): asserts value is ProjectStateImportIndexContribution {
  const contribution = requiredRecord(value, path)
  assertExactKeys(contribution, [
    "projectPath",
    "componentPath",
    "resourceKind",
    "yamlRole",
    "targets",
    "owners",
    "fields",
    "forms",
    "structuredDocuments",
  ], path)
  assertProjectStateFileUpdate({
    ...contribution,
    kind: "yaml",
    localValidation: { contributedFacts: false, diagnostics: [], schemaDiagnostics: [] },
    pendingReferences: [],
    pendingChecks: [],
    dependencies: [],
    structuredDocuments: contribution["structuredDocuments"] ?? [],
  }, path)
}

function assertProjectStateFileUpdate(value: unknown, path: string): void {
  const update = requiredRecord(value, path)
  assertPortableData(update, path)
  assertString(update["kind"], `${path}.kind`)
  if (update["kind"] === "resource") {
    assertExactKeys(update, ["kind", "projectPath", "componentPath", "resourceKind", "yamlRole", "targets"], path)
    assertIdentity(update, path, "resource")
    assertTargets(update["targets"], `${path}.targets`)
    return
  }
  if (update["kind"] !== "yaml") throw new Error(`${path}.kind имеет неизвестное значение`)

  assertExactKeys(
    update,
    [
      "kind",
      "projectPath",
      "componentPath",
      "resourceKind",
      "yamlRole",
      "localValidation",
      "targets",
      "pendingReferences",
      "owners",
      "fields",
      "forms",
      "pendingChecks",
      "dependencies",
      "structuredDocuments",
      "validationContextDependencies",
    ],
    path
  )
  assertIdentity(update, path, "yaml")
  assertLocalValidation(update["localValidation"], `${path}.localValidation`)
  assertTargets(update["targets"], `${path}.targets`)
  assertRows(
    update["pendingReferences"],
    `${path}.pendingReferences`,
    ["yamlPath", "canonical", "target", "constraint", "tagged", "propertyStateMode"],
    (row, rowPath) => {
      assertYamlPath(row["yamlPath"], `${rowPath}.yamlPath`)
      assertString(row["canonical"], `${rowPath}.canonical`)
      assertParsedMetadataTarget(row["target"], `${rowPath}.target`)
      assertMetadataTargetConstraint(row["constraint"], `${rowPath}.constraint`)
      if (row["tagged"] !== undefined && row["tagged"] !== "xml") {
        throw new Error(`${rowPath}.tagged должен быть xml`)
      }
      if (row["propertyStateMode"] !== undefined
        && row["propertyStateMode"] !== "control"
        && row["propertyStateMode"] !== "notify"
        && row["propertyStateMode"] !== "extend") {
        throw new Error(`${rowPath}.propertyStateMode имеет неизвестное значение`)
      }
    }
  )
  assertRows(update["owners"], `${path}.owners`, ["owner", "facts"], (row, rowPath) => {
    assertOwnerRef(row["owner"], `${rowPath}.owner`)
    assertOwnerFacts(row["facts"], `${rowPath}.facts`)
  })
  assertRows(update["fields"], `${path}.fields`, [
    "owner",
    "name",
    "kind",
    "typeInfo",
    "targetName",
    "sourceCollection",
    "parentName",
    "table",
    "tableHasColumns",
  ], (row, rowPath) => {
    assertOwnerRef(row["owner"], `${rowPath}.owner`)
    assertString(row["name"], `${rowPath}.name`)
    if (!["attribute", "standardAttribute", "tabularSection", "dimension", "resource", "addressingAttribute"].includes(String(row["kind"]))) {
      throw new Error(`${rowPath}.kind неизвестен`)
    }
    assertTypeInfo(row["typeInfo"], `${rowPath}.typeInfo`)
    assertOptionalString(row["targetName"], `${rowPath}.targetName`)
    assertOptionalString(row["sourceCollection"], `${rowPath}.sourceCollection`)
    assertOptionalString(row["parentName"], `${rowPath}.parentName`)
    if (row["table"] !== undefined) assertDataPathTableInfo(row["table"], `${rowPath}.table`)
    assertOptionalBoolean(row["tableHasColumns"], `${rowPath}.tableHasColumns`)
  })
  assertFormRows(update["forms"], `${path}.forms`)
  assertRows(update["structuredDocuments"] ?? [], `${path}.structuredDocuments`, [
    "documentKind", "representation", "logicalAddress", "workingProjectPath", "componentKind", "name", "yamlPath", "payload",
  ], (row, rowPath) => {
    for (const key of ["documentKind", "representation", "logicalAddress", "workingProjectPath", "componentKind", "name"] as const) {
      assertString(row[key], `${rowPath}.${key}`)
    }
    assertYamlPath(row["yamlPath"], `${rowPath}.yamlPath`)
    assertOptionalString(row["payload"], `${rowPath}.payload`)
  })
  assertRows(update["pendingChecks"], `${path}.pendingChecks`, [
    "kind",
    "yamlPath",
    "location",
    "owner",
    "value",
    "policyInput",
    "elementType",
    "hasValuesPicture",
    "tableContext",
    "policy",
    "itemType",
    "type",
    "tagged",
    "transport",
    "canonicalTarget",
    "missing",
  ], assertPendingCheck)
  if (!Array.isArray(update["dependencies"]) || !update["dependencies"].every((item) => typeof item === "string")) {
    throw new Error(`${path}.dependencies должен быть массивом строк`)
  }
  assertRows(
    update["validationContextDependencies"] ?? [],
    `${path}.validationContextDependencies`,
    ["key", "version"],
    (row, rowPath) => {
      assertString(row["key"], `${rowPath}.key`)
      if (row["key"] === "") throw new Error(`${rowPath}.key должен быть непустой строкой`)
      assertString(row["version"], `${rowPath}.version`)
    },
  )
  assertPortableData(update, path)
}

function assertTargets(value: unknown, path: string): void {
  assertRows(value, path, ["kind", "canonical", "details", "fileBacked"], (row, rowPath) => {
    if (!["object", "member", "value"].includes(String(row["kind"]))) throw new Error(`${rowPath}.kind неизвестен`)
    assertString(row["canonical"], `${rowPath}.canonical`)
    if (row["details"] !== undefined) assertReferenceDetails(row["details"], `${rowPath}.details`)
    if (row["fileBacked"] !== undefined) assertFileBackedTargetLocation(row["fileBacked"], `${rowPath}.fileBacked`)
  })
}

function assertFileBackedTargetLocation(value: unknown, path: string): void {
  const location = requiredRecord(value, path)
  assertExactKeys(location, ["itemProjectPath", "ownerProjectPath"], path)
  assertRelativeProjectPath(location["itemProjectPath"], `${path}.itemProjectPath`)
  assertRelativeProjectPath(location["ownerProjectPath"], `${path}.ownerProjectPath`)
}

function assertRelativeProjectPath(value: unknown, path: string): void {
  assertString(value, path)
  if (value.startsWith("/") || value.includes("\\") || value.split("/").includes("..")) {
    throw new Error(`${path} должен быть нормализованным относительным путём`)
  }
}

function assertReferenceDetails(value: unknown, path: string): void {
  const details = requiredRecord(value, path)
  assertExactKeys(details, ["kind", "typeInfo", "styleItemType"], path)
  assertOptionalStringIn(details["kind"], ["attribute", "standardAttribute"], `${path}.kind`)
  assertOptionalStringIn(details["styleItemType"], ["Color", "Font", "Border"], `${path}.styleItemType`)
  if (details["typeInfo"] === undefined) return
  const typeInfo = requiredRecord(details["typeInfo"], `${path}.typeInfo`)
  assertExactKeys(typeInfo, ["kinds", "sourceText", "definedTypes"], `${path}.typeInfo`)
  assertOptionalStringArray(typeInfo["kinds"], `${path}.typeInfo.kinds`)
  assertOptionalString(typeInfo["sourceText"], `${path}.typeInfo.sourceText`)
  assertOptionalStringArray(typeInfo["definedTypes"], `${path}.typeInfo.definedTypes`)
}

const METADATA_ROOT_NAMES = Object.keys(rootToYAML)
const METADATA_MEMBER_KINDS = Object.keys(memberKindToYAML)
const METADATA_OBJECT_PATH_KINDS = ["Table", "Cube", "DimensionTable", "Function"]
const DATA_PATH_VALUE_KINDS = [
  "unknown",
  "any",
  "boolean",
  "dateTime",
  "Picture",
  "scalar",
  "typeDescription",
  "object",
  "tableSource",
  "dynamicList",
  "constantSet",
  "registerRecords",
  "platformSource",
  "standardPeriod",
  "unsupportedIntermediate",
]
function elementTypes(): readonly string[] {
  const contextual = currentRuleRegistrySet<{ formElements: ReadonlyMap<string, object> }>()
  return contextual === undefined
    ? Object.keys(CollectableElementTypeToYAML)
    : [...contextual.formElements.keys()]
}

function assertParsedMetadataTarget(value: unknown, path: string): void {
  const target = requiredRecord(value, path)
  if (target["kind"] === "dataTable") {
    assertExactKeys(target, ["kind", "root", "objectName", "objectSegments", "tableSegments", "virtualTable"], path)
    assertRootedTarget(target, path)
    if (target["tableSegments"] !== undefined) {
      assertRows(target["tableSegments"], `${path}.tableSegments`, ["kind", "name"], (segment, segmentPath) => {
        assertStringIn(segment["kind"], ["TabularSection"], `${segmentPath}.kind`)
        assertString(segment["name"], `${segmentPath}.name`)
      })
    }
    if (target["virtualTable"] !== undefined) assertString(target["virtualTable"], `${path}.virtualTable`)
    return
  }
  if (target["kind"] === "dataTableField") {
    assertExactKeys(target, ["kind", "fieldName", "table", "segments", "serviceValue"], path)
    assertString(target["fieldName"], `${path}.fieldName`)
    if (target["table"] !== undefined) assertParsedMetadataTarget(target["table"], `${path}.table`)
    if (target["segments"] !== undefined) assertMemberSegments(target["segments"], `${path}.segments`)
    assertOptionalBoolean(target["serviceValue"], `${path}.serviceValue`)
    return
  }
  if (target["kind"] === "object") {
    assertExactKeys(target, ["kind", "root", "objectName", "segments"], path)
    assertStringIn(target["root"], METADATA_ROOT_NAMES, `${path}.root`)
    assertString(target["objectName"], `${path}.objectName`)
    if (target["segments"] !== undefined) assertObjectSegments(target["segments"], `${path}.segments`)
    return
  }
  if (target["kind"] === "member") {
    assertExactKeys(target, ["kind", "root", "objectName", "objectSegments", "segments"], path)
    assertRootedTarget(target, path)
    assertMemberSegments(target["segments"], `${path}.segments`)
    return
  }
  if (target["kind"] !== "value") throw new Error(`${path}.kind имеет неизвестное значение`)
  if (target["valueKind"] === "emptyRef") {
    assertExactKeys(target, ["kind", "root", "objectName", "valueKind"], path)
  } else {
    assertExactKeys(target, ["kind", "root", "objectName", "valueKind", "valueName"], path)
    assertStringIn(target["valueKind"], ["predefinedValue", "enumValue"], `${path}.valueKind`)
    assertString(target["valueName"], `${path}.valueName`)
  }
  assertStringIn(target["root"], METADATA_ROOT_NAMES, `${path}.root`)
  assertString(target["objectName"], `${path}.objectName`)
}

function assertRootedTarget(target: Record<string, unknown>, path: string): void {
  assertStringIn(target["root"], METADATA_ROOT_NAMES, `${path}.root`)
  assertString(target["objectName"], `${path}.objectName`)
  if (target["objectSegments"] !== undefined) {
    assertObjectSegments(target["objectSegments"], `${path}.objectSegments`)
  }
}

function assertMemberSegments(value: unknown, path: string): void {
  assertRows(value, path, ["kind", "name"], (segment, segmentPath) => {
    assertStringIn(segment["kind"], METADATA_MEMBER_KINDS, `${segmentPath}.kind`)
    assertString(segment["name"], `${segmentPath}.name`)
  })
}

function assertObjectSegments(value: unknown, path: string): void {
  assertRows(value, path, ["kind", "objectName"], (segment, segmentPath) => {
    assertStringIn(
      segment["kind"],
      [...METADATA_ROOT_NAMES, ...METADATA_OBJECT_PATH_KINDS],
      `${segmentPath}.kind`
    )
    assertString(segment["objectName"], `${segmentPath}.objectName`)
  })
}

function assertMetadataTargetConstraint(value: unknown, path: string): void {
  const constraint = requiredRecord(value, path)
  if (constraint["kind"] === "dataTable") {
    assertExactKeys(constraint, ["kind", "roots", "owner", "validation"], path)
    assertOptionalRootArray(constraint["roots"], `${path}.roots`)
    assertOptionalStringIn(constraint["owner"], ["this"], `${path}.owner`)
    assertOptionalStringIn(constraint["validation"], ["resolve", "translateOnly"], `${path}.validation`)
    return
  }
  if (constraint["kind"] === "dataTableField") {
    assertExactKeys(constraint, ["kind", "tableProperty", "validation"], path)
    assertString(constraint["tableProperty"], `${path}.tableProperty`)
    assertOptionalStringIn(constraint["validation"], ["resolve", "translateOnly"], `${path}.validation`)
    return
  }
  if (constraint["kind"] === "object") {
    assertExactKeys(constraint, [
      "kind",
      "roots",
      "allowedObjectPaths",
      "scope",
      "allowNested",
      "nestedObjectRoots",
      "filters",
    ], path)
    assertOptionalRootArray(constraint["roots"], `${path}.roots`)
    assertOptionalTargetPaths(constraint["allowedObjectPaths"], `${path}.allowedObjectPaths`, METADATA_OBJECT_PATH_KINDS)
    assertOptionalStringIn(constraint["scope"], ["project", "owner"], `${path}.scope`)
    assertOptionalBoolean(constraint["allowNested"], `${path}.allowNested`)
    assertOptionalRootArray(constraint["nestedObjectRoots"], `${path}.nestedObjectRoots`)
    assertOptionalTargetFilters(constraint["filters"], `${path}.filters`)
    return
  }
  if (constraint["kind"] === "member") {
    assertExactKeys(constraint, [
      "kind",
      "owner",
      "roots",
      "objectRoots",
      "nestedObjectRoots",
      "allowedObjectPaths",
      "allowedMemberPaths",
      "memberKinds",
      "filters",
      "allowOwner",
      "typeProperty",
    ], path)
    assertStringIn(constraint["owner"], ["this", "explicit", "type"], `${path}.owner`)
    assertOptionalString(constraint["typeProperty"], `${path}.typeProperty`)
    assertOptionalRootArray(constraint["roots"], `${path}.roots`)
    assertOptionalRootArray(constraint["objectRoots"], `${path}.objectRoots`)
    assertOptionalRootArray(constraint["nestedObjectRoots"], `${path}.nestedObjectRoots`)
    assertOptionalTargetPaths(constraint["allowedObjectPaths"], `${path}.allowedObjectPaths`, METADATA_OBJECT_PATH_KINDS)
    assertOptionalTargetPaths(
      constraint["allowedMemberPaths"],
      `${path}.allowedMemberPaths`,
      [...METADATA_OBJECT_PATH_KINDS, ...METADATA_MEMBER_KINDS]
    )
    assertOptionalStringArray(constraint["memberKinds"], `${path}.memberKinds`, METADATA_MEMBER_KINDS)
    assertOptionalTargetFilters(constraint["filters"], `${path}.filters`)
    assertOptionalBoolean(constraint["allowOwner"], `${path}.allowOwner`)
    return
  }
  if (constraint["kind"] === "value") {
    assertExactKeys(constraint, ["kind", "roots", "valueKinds", "allowEmptyRef"], path)
    assertOptionalRootArray(constraint["roots"], `${path}.roots`)
    assertOptionalStringArray(
      constraint["valueKinds"],
      `${path}.valueKinds`,
      ["predefinedValue", "enumValue", "emptyRef"]
    )
    assertOptionalBoolean(constraint["allowEmptyRef"], `${path}.allowEmptyRef`)
    return
  }
  if (constraint["kind"] === "type") {
    assertExactKeys(constraint, ["kind", "roots", "typeKinds", "primitives"], path)
    assertOptionalRootArray(constraint["roots"], `${path}.roots`)
    assertOptionalStringArray(constraint["typeKinds"], `${path}.typeKinds`, ["ref", "object", "primitive"])
    assertOptionalStringArray(
      constraint["primitives"],
      `${path}.primitives`,
      ["string", "decimal", "dateTime", "boolean", "ValueStorage"]
    )
    return
  }
  if (constraint["kind"] !== "dataPath") throw new Error(`${path}.kind имеет неизвестное значение`)
  assertExactKeys(
    constraint,
    ["kind", "context", "allowedKinds", "allowComposite", "allowOpaqueMultipleValue"],
    path
  )
  if (constraint["context"] !== "form") throw new Error(`${path}.context имеет неизвестное значение`)
  assertOptionalStringArray(constraint["allowedKinds"], `${path}.allowedKinds`)
  assertOptionalBoolean(constraint["allowComposite"], `${path}.allowComposite`)
  assertOptionalBoolean(constraint["allowOpaqueMultipleValue"], `${path}.allowOpaqueMultipleValue`)
}

function assertOptionalTargetFilters(value: unknown, path: string): void {
  if (value === undefined) return
  assertRows(value, path, ["kind", "type", "values"], (filter, filterPath) => {
    if (["directMember", "stringIndexedAttribute", "inputByStringField"].includes(String(filter["kind"]))) {
      assertExactKeys(filter, ["kind"], filterPath)
      return
    }
    if (filter["kind"] === "hasType") {
      assertExactKeys(filter, ["kind", "type"], filterPath)
      assertStringIn(
        filter["type"],
        ["string", "decimal", "dateTime", "boolean", "ValueStorage", "UUID"],
        `${filterPath}.type`
      )
      return
    }
    if (filter["kind"] !== "styleItemType") throw new Error(`${filterPath}.kind имеет неизвестное значение`)
    assertExactKeys(filter, ["kind", "values"], filterPath)
    assertStringArray(filter["values"], `${filterPath}.values`, ["Color", "Font", "Border"])
  })
}

function assertOptionalTargetPaths(value: unknown, path: string, allowedSegments: readonly string[]): void {
  if (value === undefined) return
  if (!Array.isArray(value)) throw new Error(`${path} должен быть массивом путей`)
  value.forEach((targetPath, index) => {
    if (!Array.isArray(targetPath) || targetPath.length === 0) throw new Error(`${path}[${index}] должен быть путём`)
    assertStringIn(targetPath[0], METADATA_ROOT_NAMES, `${path}[${index}][0]`)
    targetPath.slice(1).forEach((segment, segmentIndex) =>
      assertStringIn(segment, allowedSegments, `${path}[${index}][${segmentIndex + 1}]`)
    )
  })
}

function assertOptionalRootArray(value: unknown, path: string): void {
  assertOptionalStringArray(value, path, METADATA_ROOT_NAMES)
}

function assertOwnerFacts(value: unknown, path: string): void {
  const facts = requiredRecord(value, path)
  assertExactKeys(facts, [
    "type",
    "commonAttributeOwnerLinks",
    "owners",
    "task",
    "registerRecords",
    "chartOfAccounts",
    "extDimensionTypes",
    "accountingFlags",
    "extDimensionAccountingFlags",
    "registerType",
    "periodicity",
    "correspondence",
    "maxExtDimensionCount",
    "actionPeriod",
    "basePeriod",
    "chartOfCalculationTypes",
    "schedule",
    "scheduleValue",
    "scheduleDate",
    "dependenceOnCalculationTypes",
    "baseCalculationTypes",
    "attributes",
    "dimensions",
    "resources",
    "addressingAttributes",
    "tabularSections",
    "standardAttributes",
    "commands",
    "predefined",
    "enumValues",
  ], path)
  if (facts["type"] !== undefined) assertTypeDescription(facts["type"], `${path}.type`)
  for (const key of ["commonAttributeOwnerLinks", "owners", "registerRecords", "baseCalculationTypes"] as const) {
    assertOptionalStringArray(facts[key], `${path}.${key}`)
  }
  for (const key of [
    "task", "chartOfAccounts", "extDimensionTypes", "registerType", "periodicity", "correspondence",
    "maxExtDimensionCount", "actionPeriod", "basePeriod", "chartOfCalculationTypes", "schedule",
    "scheduleValue", "scheduleDate", "dependenceOnCalculationTypes",
  ] as const) {
    assertOptionalString(facts[key], `${path}.${key}`)
  }
  for (const key of [
    "accountingFlags",
    "extDimensionAccountingFlags",
    "attributes",
    "dimensions",
    "resources",
    "addressingAttributes",
    "standardAttributes",
    "commands",
    "predefined",
    "enumValues",
  ] as const) {
    assertOptionalNamedTypeItems(facts[key], `${path}.${key}`)
  }
  if (facts["tabularSections"] !== undefined) {
    assertRows(
      facts["tabularSections"],
      `${path}.tabularSections`,
      ["name", "attributes", "standardAttributes"],
      (section, sectionPath) => {
        assertString(section["name"], `${sectionPath}.name`)
        assertNamedTypeItems(section["attributes"], `${sectionPath}.attributes`)
        assertOptionalNamedTypeItems(section["standardAttributes"], `${sectionPath}.standardAttributes`)
      }
    )
  }
}

function assertOptionalNamedTypeItems(value: unknown, path: string): void {
  if (value !== undefined) assertNamedTypeItems(value, path)
}

function assertNamedTypeItems(value: unknown, path: string): void {
  assertRows(value, path, ["name", "type"], (item, itemPath) => {
    assertString(item["name"], `${itemPath}.name`)
    if (item["type"] !== undefined) assertTypeDescription(item["type"], `${itemPath}.type`)
  })
}

function assertTypeDescription(value: unknown, path: string): void {
  const description = requiredRecord(value, path)
  assertExactKeys(description, ["type", "typeId", "stringQualifiers", "numberQualifiers", "dateQualifiers"], path)
  assertStringArray(description["type"], `${path}.type`)
  assertOptionalStringArray(description["typeId"], `${path}.typeId`)
  if (description["stringQualifiers"] !== undefined) {
    const qualifiers = requiredRecord(description["stringQualifiers"], `${path}.stringQualifiers`)
    assertExactKeys(qualifiers, ["length", "allowedLength"], `${path}.stringQualifiers`)
    assertNumber(qualifiers["length"], `${path}.stringQualifiers.length`)
    assertStringIn(qualifiers["allowedLength"], ["Variable", "Fixed"], `${path}.stringQualifiers.allowedLength`)
  }
  if (description["numberQualifiers"] !== undefined) {
    const qualifiers = requiredRecord(description["numberQualifiers"], `${path}.numberQualifiers`)
    assertExactKeys(qualifiers, ["digits", "fractionDigits", "allowedSign"], `${path}.numberQualifiers`)
    assertNumber(qualifiers["digits"], `${path}.numberQualifiers.digits`)
    assertNumber(qualifiers["fractionDigits"], `${path}.numberQualifiers.fractionDigits`)
    assertStringIn(qualifiers["allowedSign"], ["Any", "Nonnegative"], `${path}.numberQualifiers.allowedSign`)
  }
  if (description["dateQualifiers"] !== undefined) {
    const qualifiers = requiredRecord(description["dateQualifiers"], `${path}.dateQualifiers`)
    assertExactKeys(qualifiers, ["dateFractions"], `${path}.dateQualifiers`)
    assertOptionalStringIn(
      qualifiers["dateFractions"],
      ["Date", "Time", "DateTime"],
      `${path}.dateQualifiers.dateFractions`
    )
  }
}

function assertIdentity(
  update: Record<string, unknown>,
  path: string,
  expectedResourceKind: MetadataProjectResourceKind
): void {
  assertString(update["projectPath"], `${path}.projectPath`)
  assertString(update["componentPath"], `${path}.componentPath`)
  if (update["resourceKind"] !== expectedResourceKind) {
    throw new Error(`${path}.resourceKind не соответствует kind`)
  }
  if (update["yamlRole"] !== undefined && !["configuration", "properties", "form"].includes(String(update["yamlRole"]))) {
    throw new Error(`${path}.yamlRole имеет неизвестное значение`)
  }
  if (expectedResourceKind === "yaml" && update["yamlRole"] === undefined) {
    throw new Error(`${path}.yamlRole обязателен для YAML`)
  }
}

function assertLocalValidation(value: unknown, path: string): void {
  const result = requiredRecord(value, path)
  assertExactKeys(result, ["contributedFacts", "diagnostics", "schemaDiagnostics"], path)
  if (typeof result["contributedFacts"] !== "boolean") throw new Error(`${path}.contributedFacts должен быть boolean`)
  assertRows(result["diagnostics"], `${path}.diagnostics`, [
    "line",
    "col",
    "severity",
    "source",
    "message",
    "path",
  ], assertDiagnostic)
  assertRows(result["schemaDiagnostics"], `${path}.schemaDiagnostics`, [
    "line",
    "col",
    "severity",
    "source",
    "message",
    "path",
  ], assertDiagnostic)
}

function assertFormRows(value: unknown, path: string): void {
  if (!Array.isArray(value)) throw new Error(`${path} должен быть массивом`)
  value.forEach((item, index) => {
    const row = requiredRecord(item, `${path}[${index}]`)
    if (row["kind"] === "root") {
      assertExactKeys(row, ["kind", "owner", "name", "source"], `${path}[${index}]`)
      assertOwnerRef(row["owner"], `${path}[${index}].owner`)
      assertString(row["name"], `${path}[${index}].name`)
      const source = requiredRecord(row["source"], `${path}[${index}].source`)
      assertExactKeys(source, ["kind", "name", "typeInfo", "table", "tableHasColumns"], `${path}[${index}].source`)
      if (source["kind"] !== "formAttribute") throw new Error(`${path}[${index}].source.kind неизвестен`)
      assertString(source["name"], `${path}[${index}].source.name`)
      assertTypeInfo(source["typeInfo"], `${path}[${index}].source.typeInfo`)
      if (source["table"] !== undefined) {
        assertDataPathTableInfo(source["table"], `${path}[${index}].source.table`)
      }
      assertOptionalBoolean(source["tableHasColumns"], `${path}[${index}].source.tableHasColumns`)
    } else if (row["kind"] === "additionalColumn") {
      assertExactKeys(row, ["kind", "owner", "tablePath", "name", "source"], `${path}[${index}]`)
      assertOwnerRef(row["owner"], `${path}[${index}].owner`)
      assertString(row["tablePath"], `${path}[${index}].tablePath`)
      assertString(row["name"], `${path}[${index}].name`)
      const source = requiredRecord(row["source"], `${path}[${index}].source`)
      assertExactKeys(source, ["name", "targetName", "typeInfo"], `${path}[${index}].source`)
      assertString(source["name"], `${path}[${index}].source.name`)
      assertOptionalString(source["targetName"], `${path}[${index}].source.targetName`)
      assertTypeInfo(source["typeInfo"], `${path}[${index}].source.typeInfo`)
    } else if (row["kind"] === "tabularElement") {
      assertExactKeys(row, ["kind", "owner", "name", "dataPath"], `${path}[${index}]`)
      assertOwnerRef(row["owner"], `${path}[${index}].owner`)
      assertString(row["name"], `${path}[${index}].name`)
      assertOptionalString(row["dataPath"], `${path}[${index}].dataPath`)
    } else {
      throw new Error(`${path}[${index}].kind имеет неизвестное значение`)
    }
    assertPortableData(row, `${path}[${index}]`)
  })
}

function assertRows(
  value: unknown,
  path: string,
  allowedKeys: readonly string[],
  validate?: (row: Record<string, unknown>, path: string) => void
): void {
  if (!Array.isArray(value)) throw new Error(`${path} должен быть массивом`)
  value.forEach((item, index) => {
    const row = requiredRecord(item, `${path}[${index}]`)
    assertExactKeys(row, allowedKeys, `${path}[${index}]`)
    validate?.(row, `${path}[${index}]`)
    assertPortableData(row, `${path}[${index}]`)
  })
}

function assertPendingCheck(row: Record<string, unknown>, path: string): void {
  assertYamlPath(row["yamlPath"], `${path}.yamlPath`)
  const location = requiredRecord(row["location"], `${path}.location`)
  assertExactKeys(location, ["line", "col", "path"], `${path}.location`)
  assertNumber(location["line"], `${path}.location.line`)
  assertNumber(location["col"], `${path}.location.col`)
  assertOptionalString(location["path"], `${path}.location.path`)
  if (row["kind"] === "fillValue") {
    assertString(row["itemType"], `${path}.itemType`)
    assertTypeDescriptionView(row["type"], `${path}.type`)
    assertMetadataTypedValue(row["value"], `${path}.value`)
    if (typeof row["tagged"] !== "boolean") throw new Error(`${path}.tagged должен быть boolean`)
    if (row["transport"] !== undefined && row["transport"] !== "DesignTimeRef") {
      throw new Error(`${path}.transport имеет неизвестное значение`)
    }
    return
  }
  if (row["kind"] === "addressableRequired") {
    assertString(row["canonicalTarget"], `${path}.canonicalTarget`)
    if (!Array.isArray(row["missing"]) || !row["missing"].every((item) => typeof item === "string")) {
      throw new Error(`${path}.missing должен быть массивом строк`)
    }
    return
  }
  if (row["kind"] !== "dataPath" || row["policy"] !== "formDataPath") throw new Error(`${path} имеет неизвестный вид`)
  assertOwnerRef(row["owner"], `${path}.owner`)
  assertString(row["value"], `${path}.value`)
  if (typeof row["tagged"] !== "boolean") throw new Error(`${path}.tagged должен быть boolean`)
  const policyInput = requiredRecord(row["policyInput"], `${path}.policyInput`)
  assertExactKeys(policyInput, ["yaml", "allowedKinds", "allowComposite"], `${path}.policyInput`)
  assertString(policyInput["yaml"], `${path}.policyInput.yaml`)
  if (
    policyInput["allowedKinds"] !== undefined &&
    (!Array.isArray(policyInput["allowedKinds"]) ||
      !policyInput["allowedKinds"].every((kind) => typeof kind === "string"))
  ) {
    throw new Error(`${path}.policyInput.allowedKinds должен быть массивом строк`)
  }
  if (policyInput["allowComposite"] !== undefined && typeof policyInput["allowComposite"] !== "boolean") {
    throw new Error(`${path}.policyInput.allowComposite должен быть boolean`)
  }
  assertOptionalStringIn(row["elementType"], elementTypes(), `${path}.elementType`)
  assertOptionalBoolean(row["hasValuesPicture"], `${path}.hasValuesPicture`)
  if (row["tableContext"] !== undefined) {
    const tableContext = requiredRecord(row["tableContext"], `${path}.tableContext`)
    assertExactKeys(tableContext, ["dataPath"], `${path}.tableContext`)
    assertString(tableContext["dataPath"], `${path}.tableContext.dataPath`)
  }
}

function assertTypeDescriptionView(value: unknown, path: string): void {
  const type = requiredRecord(value, path)
  assertExactKeys(type, ["type", "typeId", "stringQualifiers", "numberQualifiers", "dateQualifiers"], path)
  if (type["type"] !== undefined) assertStringArray(type["type"], `${path}.type`)
  if (type["typeId"] !== undefined) assertStringArray(type["typeId"], `${path}.typeId`)
  for (const key of ["stringQualifiers", "numberQualifiers", "dateQualifiers"] as const) {
    if (type[key] !== undefined) requiredRecord(type[key], `${path}.${key}`)
  }
}

function assertMetadataTypedValue(value: unknown, path: string): void {
  const typed = requiredRecord(value, path)
  assertString(typed["type"], `${path}.type`)
  if (typed["type"] === "valueList") {
    assertExactKeys(typed, ["type"], path)
    return
  }
  if (!("value" in typed)) throw new Error(`${path}.value отсутствует`)
  assertPortableData(typed["value"], `${path}.value`)
}

function assertDiagnostic(row: Record<string, unknown>, path: string): void {
  assertNumber(row["line"], `${path}.line`)
  assertNumber(row["col"], `${path}.col`)
  assertString(row["severity"], `${path}.severity`)
  assertString(row["source"], `${path}.source`)
  assertString(row["message"], `${path}.message`)
  assertOptionalString(row["path"], `${path}.path`)
}

function assertOwnerRef(value: unknown, path: string): void {
  const owner = requiredRecord(value, path)
  assertExactKeys(owner, ["kind", "name"], path)
  assertString(owner["kind"], `${path}.kind`)
  assertOptionalString(owner["name"], `${path}.name`)
}

function assertTypeInfo(value: unknown, path: string): void {
  const typeInfo = requiredRecord(value, path)
  assertExactKeys(typeInfo, ["kinds", "nextTypes", "terminalTypes", "definedTypes", "table", "isComposite", "sourceText"], path)
  assertStringArray(typeInfo["kinds"], `${path}.kinds`, DATA_PATH_VALUE_KINDS)
  if (!Array.isArray(typeInfo["nextTypes"])) throw new Error(`${path}.nextTypes должен быть массивом`)
  typeInfo["nextTypes"].forEach((owner, index) => assertOwnerRef(owner, `${path}.nextTypes[${index}]`))
  assertOptionalStringArray(typeInfo["terminalTypes"], `${path}.terminalTypes`)
  assertOptionalStringArray(typeInfo["definedTypes"], `${path}.definedTypes`)
  if (typeInfo["table"] !== undefined) assertDataPathTableInfo(typeInfo["table"], `${path}.table`)
  assertOptionalBoolean(typeInfo["isComposite"], `${path}.isComposite`)
  assertOptionalString(typeInfo["sourceText"], `${path}.sourceText`)
}

function assertDataPathTableInfo(value: unknown, path: string): void {
  const table = requiredRecord(value, path)
  if (["ValueTable", "ValueTree", "ValueList", "GanttChart", "DynamicList"].includes(String(table["kind"]))) {
    assertExactKeys(table, ["kind"], path)
    return
  }
  if (table["kind"] === "Registered") {
    assertExactKeys(table, ["kind", "type"], path)
    assertString(table["type"], `${path}.type`)
    return
  }
  if (table["kind"] === "RegisterRecordSet") {
    assertExactKeys(table, ["kind", "owner"], path)
    assertOwnerRef(table["owner"], `${path}.owner`)
    return
  }
  if (table["kind"] !== "TabularSection") throw new Error(`${path}.kind имеет неизвестное значение`)
  assertExactKeys(table, ["kind", "owner", "name"], path)
  assertOwnerRef(table["owner"], `${path}.owner`)
  assertString(table["name"], `${path}.name`)
}

function assertYamlPath(value: unknown, path: string): void {
  if (!Array.isArray(value) || !value.every((segment) => typeof segment === "string" || typeof segment === "number")) {
    throw new Error(`${path} должен быть YAML-путём`)
  }
}

function assertNumber(value: unknown, path: string): void {
  if (typeof value !== "number" || !Number.isFinite(value)) throw new Error(`${path} должен быть числом`)
}

function assertOptionalString(value: unknown, path: string): void {
  if (value !== undefined) assertString(value, path)
}

function assertOptionalBoolean(value: unknown, path: string): void {
  if (value !== undefined && typeof value !== "boolean") throw new Error(`${path} должен быть boolean`)
}

function assertOptionalStringIn(value: unknown, allowed: readonly string[], path: string): void {
  if (value !== undefined) assertStringIn(value, allowed, path)
}

function assertStringIn(value: unknown, allowed: readonly string[], path: string): void {
  assertString(value, path)
  if (!allowed.includes(value)) throw new Error(`${path} имеет неизвестное значение`)
}

function assertOptionalStringArray(value: unknown, path: string, allowed?: readonly string[]): void {
  if (value !== undefined) assertStringArray(value, path, allowed)
}

function assertStringArray(value: unknown, path: string, allowed?: readonly string[]): void {
  if (!Array.isArray(value)) throw new Error(`${path} должен быть массивом строк`)
  value.forEach((item, index) => {
    assertString(item, `${path}[${index}]`)
    if (allowed !== undefined && !allowed.includes(item)) {
      throw new Error(`${path}[${index}] имеет неизвестное значение`)
    }
  })
}

const FORBIDDEN_PORTABLE_KEYS = new Set(["rule", "parsed", "graph", "hash", "hashOffset", "fromYAML", "toYAML"])

export function assertProjectStatePortableData(value: unknown, path: string): void {
  assertPortableData(value, path)
}

function assertPortableData(value: unknown, path: string, seen = new Set<object>()): void {
  if (typeof value === "function") throw new Error(`${path} содержит функцию`)
  if (value === null || value === undefined || ["string", "number", "boolean"].includes(typeof value)) return
  if (typeof value !== "object") throw new Error(`${path} содержит непереносимое значение`)
  if (seen.has(value)) throw new Error(`${path} содержит циклическую ссылку`)
  seen.add(value)
  if (Array.isArray(value)) {
    assertPlainDenseArray(value, path)
    for (let index = 0; index < value.length; index += 1) {
      assertPortableData(value[index], `${path}[${index}]`, seen)
    }
    seen.delete(value)
    return
  }
  if (ArrayBuffer.isView(value) || value instanceof ArrayBuffer) {
    throw new Error(`${path} содержит бинарное значение вне hashBytes`)
  }
  const record = requiredRecord(value, path)
  for (const key of Reflect.ownKeys(record)) {
    if (typeof key === "symbol") throw new Error(`${path} содержит symbol-поле`)
    const descriptor = Object.getOwnPropertyDescriptor(record, key)!
    assertPlainDataProperty(descriptor, `${path}.${key}`)
    if (FORBIDDEN_PORTABLE_KEYS.has(key)) throw new Error(`${path}.${key} запрещён в переносимом DTO`)
    assertPortableData(descriptor.value, `${path}.${key}`, seen)
  }
  seen.delete(value)
}

function assertExactKeys(record: Record<string, unknown>, allowed: readonly string[], path: string): void {
  const allowedSet = new Set(allowed)
  for (const key of Reflect.ownKeys(record)) {
    if (typeof key === "symbol") throw new Error(`${path} содержит symbol-поле`)
    if (!allowedSet.has(key)) throw new Error(`${path}.${key} не является разрешённым полем`)
    assertPlainDataProperty(Object.getOwnPropertyDescriptor(record, key)!, `${path}.${key}`)
  }
}

function assertPlainDenseArray(value: unknown[], path: string): void {
  if (Object.getPrototypeOf(value) !== Array.prototype) throw new Error(`${path} должен быть обычным массивом`)
  const keys = Reflect.ownKeys(value)
  for (const key of keys) {
    if (typeof key === "symbol") throw new Error(`${path} содержит symbol-поле`)
    if (key === "length") continue
    const index = Number(key)
    if (!Number.isSafeInteger(index) || index < 0 || index >= value.length || String(index) !== key) {
      throw new Error(`${path}.${key} не является индексом массива`)
    }
    assertPlainDataProperty(Object.getOwnPropertyDescriptor(value, key)!, `${path}[${index}]`)
  }
  for (let index = 0; index < value.length; index += 1) {
    if (!Object.hasOwn(value, index)) throw new Error(`${path} не должен быть разреженным массивом`)
  }
}

function assertPlainDataProperty(descriptor: PropertyDescriptor, path: string): asserts descriptor is PropertyDescriptor & {
  readonly value: unknown
} {
  if (!("value" in descriptor) || !descriptor.enumerable) throw new Error(`${path} должен быть enumerable data property`)
}

function requiredRecord(value: unknown, path: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) throw new Error(`${path} должен быть объектом`)
  if (Object.getPrototypeOf(value) !== Object.prototype) throw new Error(`${path} должен быть обычным объектом`)
  return value as Record<string, unknown>
}

function assertString(value: unknown, path: string): asserts value is string {
  if (typeof value !== "string") throw new Error(`${path} должен быть строкой`)
}
