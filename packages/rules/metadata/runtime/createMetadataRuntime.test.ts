import { Type } from "typebox"
import { describe, expect, it } from "vitest"

import { composeMetadataRules, defineMetadataRules } from "../ruleRuntime/definition"
import { emptyMetadataRules } from "../ruleRuntime/definition/testSupport"
import { defineMetadataItemRule } from "../ruleRuntime/metadataItem/ruleFactory"
import { exportMetadataItemToJSONSchema } from "../ruleRuntime/metadataItem/toJSONSchema"
import { createMetadataRuntime } from "./createMetadataRuntime"
import { createProjectStateService } from "../projectState/service"
import { defineMetadataItemCollectionRule } from "../ruleRuntime/metadataCollection/ruleFactory"
import { compileMetadataResourceTopology } from "../resourceTopology/core/compiler"
import { compileMetadataResourceTopologyForProjectSpecs } from "../resourceTopology/adapters/ruleTopology"
import { createMetadataItemProjectSchemaExporter } from "../projectDefinition/projectSpecHelpers"

const workers = {
  preparedYamlProject: new URL("file:///test/prepared.js"),
  importFromXml: new URL("file:///test/import.js"),
  fullSyncToXml: new URL("file:///test/sync.js"),
  generic: new URL("file:///test/generic.js"),
}

const runtimeOptions = {
  rules: emptyMetadataRules,
  workers,
  createProjectStateService,
}

function createRuntimePair(
  rulesWithValue: (
    value: string,
  ) => Parameters<typeof createMetadataRuntime>[0]["rules"],
) {
  return {
    first: createMetadataRuntime({
      ...runtimeOptions,
      rules: rulesWithValue("first"),
    }),
    second: createMetadataRuntime({
      ...runtimeOptions,
      rules: rulesWithValue("second"),
    }),
  }
}

describe("createMetadataRuntime", () => {
  it("binds project state to the generic worker entrypoint", async () => {
    const runtime = createMetadataRuntime({
      ...runtimeOptions,
      createWorkerPool(workerUrl) {
        const size = workerUrl === workers.generic ? 17 : -1
        return {
          async beginOperation() { throw new Error("not used") },
          async installProjectState() {},
          async clearProjectState() {},
          size: () => size,
          async close() {},
        }
      },
    })

    const state = runtime.projects.createState()
    expect(state.workers.size()).toBe(17)
    await runtime.close()
  })

  it("exposes the grouped services used by the composition root", async () => {
    const runtime = createMetadataRuntime(runtimeOptions)

    expect(runtime.projects.parsePath("cf", { allowRoot: true })).toBe("cf")
    expect(runtime.schemas.exportByName).toBeTypeOf("function")
    expect(runtime.import.configurationFromXml).toBeTypeOf("function")
    expect(runtime.sync.planToXml).toBeTypeOf("function")
    expect(runtime.sync.partial.prepare).toBeTypeOf("function")
    expect(runtime.sync.partial.readPending).toBeTypeOf("function")
    expect(runtime.sync.partial.markTransferring).toBeTypeOf("function")
    expect(runtime.sync.partial.markPreparedAfterRejection).toBeTypeOf("function")
    expect(runtime.sync.partial.markApplied).toBeTypeOf("function")
    expect(runtime.sync.partial.finalize).toBeTypeOf("function")
    expect(runtime.metadata.rename).toBeTypeOf("function")
    expect(runtime.metadata.findReferences).toBeTypeOf("function")

    await runtime.close()
  })

  it("isolates project state ownership and closes owned state once", async () => {
    const first = createMetadataRuntime(runtimeOptions)
    const second = createMetadataRuntime(runtimeOptions)
    const state = first.projects.createState()

    await expect(
      second.validation.validateProject({ projectDir: "test", projectState: state }),
    ).rejects.toThrow("другому runtime")
    await expect(second.sync.partial.prepare({
      context: { defaultLanguage: "ru", version: "2.20" },
      projectDir: "test",
      componentPath: "cf",
      projectState: state,
    })).rejects.toThrow("другому runtime")

    await first.close()
    await first.close()
    await expect(state.rebuild({ projectDir: "test" })).rejects.toThrow("закрыт")
    await second.close()
  })

  it("exports property schemas from the owning runtime rules", async () => {
    const itemRule = {
      itemType: "SampleItem",
      properties: {
        value: { type: "Sample", yaml: "Значение" },
      },
    }
    const rulesWithValue = (value: string) => defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        Sample: { exportToJSONSchema: () => Type.Literal(value) },
      },
      schemas: {
        SampleItem: {
          source: itemRule,
          export: ({ context, execution }) =>
            exportMetadataItemToJSONSchema({ context, rule: itemRule, execution }),
        },
      },
    })
    const { first, second } = createRuntimePair(rulesWithValue)

    const context = { defaultLanguage: "ru", version: "test" }
    const firstSchema = first.schemas.exportByName({ context, name: "SampleItem" })
    const secondSchema = second.schemas.exportByName({ context, name: "SampleItem" })

    expect(firstSchema).toMatchObject({
      properties: { "Значение": { const: "first" } },
    })
    expect(secondSchema).toMatchObject({
      properties: { "Значение": { const: "second" } },
    })

    await first.close()
    await second.close()
  })

  it("keeps the owning property execution through metadata item schema builders", async () => {
    const rulesWithValue = (value: string) => {
      const itemRule = {
        itemType: "BuiltSampleItem",
        properties: {
          value: { type: "BuiltSample", yaml: "Значение" },
        },
      }
      return composeMetadataRules(
        defineMetadataRules({
          ...emptyMetadataRules,
          propertyTypes: {
            BuiltSample: { exportToJSONSchema: () => Type.Literal(value) },
          },
        }),
        defineMetadataItemRule({
          propertyType: "BuiltSampleItem" as never,
          itemRule,
        }),
      )
    }
    const { first, second } = createRuntimePair(rulesWithValue)
    const context = { defaultLanguage: "ru", version: "test" }

    expect(first.schemas.exportByName({ context, name: "BuiltSampleItem" }))
      .toMatchObject({ properties: { "Значение": { const: "first" } } })
    expect(second.schemas.exportByName({ context, name: "BuiltSampleItem" }))
      .toMatchObject({ properties: { "Значение": { const: "second" } } })

    await first.close()
    await second.close()
  })

  it("keeps the owning property execution through collection schema builders", async () => {
    const rulesWithValue = (value: string) => {
      const itemRule = {
        itemType: "BuiltCollectionItem",
        properties: {
          value: { type: "BuiltCollectionValue", yaml: "Значение" },
        },
      }
      return composeMetadataRules(
        defineMetadataRules({
          ...emptyMetadataRules,
          propertyTypes: {
            BuiltCollectionValue: {
              exportToJSONSchema: () => Type.Literal(value),
            },
          },
        }),
        defineMetadataItemCollectionRule({
          propertyType: "BuiltCollection" as never,
          itemRule,
          yamlAsArray: true,
        }),
      )
    }
    const { first, second } = createRuntimePair(rulesWithValue)
    const context = { defaultLanguage: "ru", version: "test" }

    expect(first.schemas.exportByName({ context, name: "BuiltCollectionItem" }))
      .toMatchObject({
        type: "object",
        properties: { "Значение": { const: "first" } },
      })
    expect(second.schemas.exportByName({ context, name: "BuiltCollectionItem" }))
      .toMatchObject({
        type: "object",
        properties: { "Значение": { const: "second" } },
      })

    await first.close()
    await second.close()
  })

  it("uses system enumerations from the owning runtime when excluding implicit YAML", async () => {
    const itemRule = {
      itemType: "EnumerationOwner",
      properties: {
        value: {
          type: "SystemEnumeration",
          typeSE: "Probe",
          yaml: "Значение",
          implicitValueYAML: "internal",
        },
      },
    }
    const rulesWithImplicit = (implicitYaml: string) => defineMetadataRules({
      ...emptyMetadataRules,
      propertyTypes: {
        SystemEnumeration: {
          exportToJSONSchema: () => Type.Union([
            Type.Literal("first"),
            Type.Literal("second"),
          ]),
        },
      },
      systemEnumerations: {
        Probe: {
          fromYAML: { [implicitYaml]: "internal" },
          toYAML: { internal: implicitYaml },
        },
      },
      schemas: {
        EnumerationOwner: {
          source: itemRule,
          export: ({ context, execution }) =>
            exportMetadataItemToJSONSchema({ context, rule: itemRule, execution }),
        },
      },
    })
    const first = createMetadataRuntime({
      ...runtimeOptions,
      rules: rulesWithImplicit("first"),
    })
    const second = createMetadataRuntime({
      ...runtimeOptions,
      rules: rulesWithImplicit("second"),
    })
    const context = { defaultLanguage: "ru", version: "test" }

    expect(first.schemas.exportByName({
      context,
      name: "EnumerationOwner",
      mode: "inline",
      excludeImplicitValueYAML: true,
    })).toMatchObject({
      properties: { "Значение": { const: "second" } },
    })
    expect(second.schemas.exportByName({
      context,
      name: "EnumerationOwner",
      mode: "inline",
      excludeImplicitValueYAML: true,
    })).toMatchObject({
      properties: { "Значение": { const: "first" } },
    })

    await first.close()
    await second.close()
  })

  it("describes project structure from the owning runtime", async () => {
    const rulesWithDirectory = (dir: string) => defineMetadataRules({
      ...emptyMetadataRules,
      projectSpecs: {
        [dir]: {
          dir,
          kind: dir,
          rule: { itemType: `Item-${dir}`, properties: {} },
          exportSchema: () => Type.Object({}),
        },
      },
      resourceTopology: [{
        revision: () => dir,
        compile: () => compileMetadataResourceTopology([]),
      }],
    })
    const first = createMetadataRuntime({
      ...runtimeOptions,
      rules: rulesWithDirectory("first"),
    })
    const second = createMetadataRuntime({
      ...runtimeOptions,
      rules: rulesWithDirectory("second"),
    })

    const directories = (runtime: typeof first) =>
      runtime.projects.describeStructure({ projectDir: "/project" }).node.children
        ?.filter((node) => node.kind === "directory")
        .map((node) => node.name)

    expect(directories(first)).toEqual(["first"])
    expect(directories(second)).toEqual(["second"])

    await first.close()
    await second.close()
  })

  it("exports project file schemas from the owning runtime", async () => {
    const rulesWithValue = (value: string) => {
      const rootRule = {
        itemType: "RuntimeConfiguration",
        properties: {
          value: { type: "RuntimeProjectValue", yaml: "Значение" },
        },
      }
      const rootSpec = {
        dir: "",
        kind: "configuration",
        rule: rootRule,
        exportSchema: createMetadataItemProjectSchemaExporter(rootRule),
      }
      return defineMetadataRules({
        ...emptyMetadataRules,
        propertyTypes: {
          RuntimeProjectValue: {
            exportToJSONSchema: () => Type.Literal(value),
          },
        },
        projectSpecs: { "": rootSpec },
        resourceTopology: [{
          revision: () => value,
          compile: () => compileMetadataResourceTopologyForProjectSpecs([rootSpec]),
        }],
      })
    }
    const { first, second } = createRuntimePair(rulesWithValue)
    const context = { defaultLanguage: "ru", version: "test" }

    expect(first.schemas.exportForProjectFile({
      context,
      filePath: "Конфигурация.yaml",
      mode: "inline",
    })).toMatchObject({ properties: { "Значение": { const: "first" } } })
    expect(second.schemas.exportForProjectFile({
      context,
      filePath: "Конфигурация.yaml",
      mode: "inline",
    })).toMatchObject({ properties: { "Значение": { const: "second" } } })

    await first.close()
    await second.close()
  })
})
