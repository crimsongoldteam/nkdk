import type { ScenarioLayer, ScenarioMatrix, ScenarioOperation } from "./types"
import { createRootPropertyOperations } from "./root-property-operations"

type MatrixDeclarations = Pick<
  ScenarioMatrix,
  "configurationOperations" | "structuralOperations" | "childPropertyOperations" | "orderSetupOperations" | "orderOperations" | "roots" | "children" | "forms"
>

export const recoveryProbeBlockKey = "roots:create:probe"

export function createInitialScenarioLayers(matrix: MatrixDeclarations): readonly ScenarioLayer[] {
  const roots = matrix.roots.map(({ key, changes, dependsOn }): ScenarioOperation => ({
    key, kind: "create-object", changes, dependsOn,
  }))
  const children = matrix.children.map(({ key, ownerKey, changes, dependsOn }): ScenarioOperation => ({
    key,
    kind: "add-child",
    ownerKey,
    changes,
    dependsOn: [...new Set([ownerKey, ...dependsOn])],
  }))
  const forms = matrix.forms.map(({ key, ownerKey, changes }): ScenarioOperation => ({
    key, kind: "add-form", ownerKey, changes, dependsOn: [ownerKey],
  }))
  const rootProperties = createRootPropertyOperations(matrix.roots)
  const configurationOperations = matrix.configurationOperations ?? []
  const structuralOperations = matrix.structuralOperations ?? []
  const childPropertyOperations = matrix.childPropertyOperations ?? []
  const orderSetupOperations = matrix.orderSetupOperations ?? []
  const orderOperations = matrix.orderOperations ?? []

  return [
    ...(configurationOperations.length === 0 ? [] : [
      layer("configuration:change", "configuration:comment", configurationOperations),
    ]),
    layer("roots:create", "object:catalog", roots, 12),
    ...(rootProperties.length === 0 ? [] : [
      layer("roots:properties", "change:object:catalog:comment", rootProperties),
    ]),
    layer("children:create", "child:catalog:attributes", children),
    ...(childPropertyOperations.length === 0 ? [] : [
      layer("children:properties", "change:child:catalog:attributes:property", childPropertyOperations),
      layer("children:properties:restore", `restore:${childPropertyOperations.at(-1)?.key ?? ""}`, restore(childPropertyOperations)),
    ]),
    ...(orderSetupOperations.length === 0 ? [] : [
      layer("children:order:setup", "order-setup:attributes", orderSetupOperations),
      layer("children:order:change", "order:attributes", orderOperations),
      layer("children:order:restore", `restore:${orderOperations.at(-1)?.key ?? ""}`, restore(orderOperations)),
      layer("children:order:remove", `remove:${orderSetupOperations.at(-1)?.key ?? ""}`, reverse(orderSetupOperations)),
    ]),
    layer("forms:create", "form:catalog", forms),
    ...(structuralOperations.length === 0 ? [] : [
      layer("structural:change", "structural:catalog-attribute-length", structuralOperations),
      layer(
        "structural:restore",
        "restore:structural:task-business-process-link",
        restore(structuralOperations),
      ),
    ]),
    layer("forms:remove", "remove:form:task", reverse(forms)),
    layer("children:remove", "remove:child:task:commands", reverse(children)),
    layer("roots:remove", "remove:object:ws-reference", removeRoots(matrix.roots)),
    ...(configurationOperations.length === 0 ? [] : [
      layer(
        "configuration:restore",
        "restore:configuration:command-interface",
        restore(configurationOperations),
      ),
    ]),
  ]
}

function layer(
  key: string,
  preferredProbeKey: string,
  operations: readonly ScenarioOperation[],
  bulkBlockSize?: number,
): ScenarioLayer {
  const probeOperationKey = operations.some(({ key: operationKey }) => operationKey === preferredProbeKey)
    ? preferredProbeKey
    : operations[0]?.key
  if (probeOperationKey === undefined) throw new Error(`Слой ${key} не содержит операций`)
  return { key, componentPath: "cf", probeOperationKey, bulkBlockSize, operations }
}

function reverse(operations: readonly ScenarioOperation[]): readonly ScenarioOperation[] {
  return operations.toReversed().map((operation) => ({
    key: `remove:${operation.key}`,
    kind: "remove",
    targetKey: operation.key,
    changes: operation.changes.map(({ path, before, after }) => ({ path, before: after, after: before })),
    dependsOn: [],
  }))
}

function restore(operations: readonly ScenarioOperation[]): readonly ScenarioOperation[] {
  return operations.toReversed().map((operation) => ({
    key: `restore:${operation.key}`,
    kind: "change",
    targetKey: operation.targetKey,
    changes: operation.changes.map(({ path, before, after }) => ({ path, before: after, after: before })),
    dependsOn: [],
  }))
}

function removeRoots(roots: MatrixDeclarations["roots"]): readonly ScenarioOperation[] {
  return roots.toReversed().map((root) => ({
    key: `remove:${root.key}`,
    kind: "remove",
    targetKey: root.key,
    changes: root.changes.map(({ path, before, after }) => ({
      path,
      before: root.propertyChanges.find((change) => change.path === path)?.after ?? after,
      after: before,
    })),
    dependsOn: [],
  }))
}
