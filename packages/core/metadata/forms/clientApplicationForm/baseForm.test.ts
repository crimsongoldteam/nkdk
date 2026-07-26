import { describe, expect, it } from "vitest"
import { mockContextToXML } from "../../../tests/mockContext"
import { createConfigurationIndexCollector } from "../../configurationIndex/collector/writer"
import { encodeConfigurationIndex } from "../../configurationIndex/encode"
import { createConfigurationIndexExportRuntime } from "../../configurationIndex/exportRuntime"
import {
  createConfigurationIndexReader,
  snapshotConfigurationIndex,
} from "../../configurationIndex/sharedSnapshot"
import { sampleIndex } from "../../configurationIndex/testData"
import type { ClientApplicationFormYAML } from "./types"
import { buildClientApplicationBaseForm } from "./baseForm"
import { convertClientApplicationFormFromYAMLToXML } from "./fromYAMLToXML"
import { createImportSharedMetadata } from "../../importFromXml/metadataSnapshot"
import {
  createLayeredImportReferenceSnapshot,
  createLayeredOwnerMetadataCache,
} from "../../importFromXml/componentReferenceIndex"
import { createValidationOwnerFacts } from "../../validation/dataPath/ownerFacts"
import { buildObjectFieldIndex } from "../../validation/dataPath/objectFields"
import { MetadataCatalogRules } from "../../appliedObjects/metadataCatalog/rules"

describe("client application BaseForm", () => {
  it("builds a full form body through regular rules and strips root namespaces", () => {
    const baseYaml = {
      Заголовок: { ru: "Основная форма" },
      Ширина: 80,
    } as ClientApplicationFormYAML
    const extensionYaml = {
      Заголовок: { ru: "Форма расширения" },
      Ширина: 100,
    } as ClientApplicationFormYAML

    const baseForm = buildClientApplicationBaseForm({
      context: mockContextToXML(),
      baseYaml,
      extensionYaml,
      formName: "ФормаЭлемента",
    })
    const result = convertClientApplicationFormFromYAMLToXML({
      context: mockContextToXML(),
      yaml: extensionYaml,
      name: "ФормаЭлемента",
      baseFormXML: baseForm,
    })

    expect(baseForm).not.toHaveProperty("_xmlns")
    expect(baseForm._version).toBe("2.20")
    expect(baseForm.Width).toBe(80)
    expect(result.formXML.BaseForm).toEqual(baseForm)
    expect(result.formXML.Width).toBe(100)
  })

  it("does not add BaseForm details to the result index collector", () => {
    const collector = createConfigurationIndexCollector()
    const source = createConfigurationIndexReader(
      snapshotConfigurationIndex(encodeConfigurationIndex(sampleIndex()))
    )
    const baseContext = mockContextToXML()
    const configurationIndex = createConfigurationIndexExportRuntime({
      source,
      collector,
      targetProjectPath:
        "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
      logicalAddress: "Справочник.Товары.Форма.ФормаЭлемента",
    })
    const context = {
      ...baseContext,
      exportToXML: { ...baseContext.exportToXML, configurationIndex },
    }

    buildClientApplicationBaseForm({
      context,
      baseYaml: { Ширина: 80 } as ClientApplicationFormYAML,
      extensionYaml: { Ширина: 100 } as ClientApplicationFormYAML,
      formName: "ФормаЭлемента",
    })

    expect(collector.fragment(configurationIndex.targetProjectPath))
      .toEqual({
        targetProjectPath:
          "Справочник/Товары/Формы/ФормаЭлемента/Форма.yaml",
        identities: [],
        xmlNodes: [],
        xmlValues: [],
      })
  })

  it("строит внутреннее имя стандартного реквизита по индексу итоговой формы", () => {
    const baseForm = buildClientApplicationBaseForm({
      context: contextWithLayeredCatalogOwner(),
      baseYaml: {
        Реквизиты: {
          Объект: { Тип: "СправочникОбъект.СправочникПолный" },
        },
        Элементы: {
          Код: {
            Вид: "ПолеВвода",
            ПутьКДанным: "Объект.Код",
          },
        },
      } as ClientApplicationFormYAML,
      extensionYaml: {
        Реквизиты: {
          Объект: { Тип: "СправочникОбъект.СправочникПолный" },
        },
      } as ClientApplicationFormYAML,
      formName: "ФормаЭлемента",
    })
    const childItems = Array.isArray(baseForm.ChildItems)
      ? baseForm.ChildItems
      : baseForm.ChildItems?.ChildItem
    const first = Array.isArray(childItems) ? childItems[0] : childItems

    expect(first?.InputField?.DataPath).toBe("Объект.Code")
  })
})

function contextWithLayeredCatalogOwner() {
  const context = mockContextToXML()
  const ref = { kind: "Справочник", name: "СправочникПолный" }
  const filePath = "/project/cf/Справочник/СправочникПолный/Свойства.yaml"
  const initialFacts = createValidationOwnerFacts({
    ref,
    filePath,
    fieldIndex: {
      fields: new Map(),
      standardAttributeAliases: new Map(),
      diagnostics: [],
    },
    model: { itemType: "MetadataCatalog" },
  })
  const fieldIndex = buildObjectFieldIndex({
    ref,
    facts: initialFacts,
    rule: MetadataCatalogRules,
  })
  return {
    ...context,
    exportToYAML: {
      toTyped: false,
      ownerMetadataCache: createLayeredOwnerMetadataCache({
        projectDir: "/project/cfe/Расширение",
        snapshots: createLayeredImportReferenceSnapshot({
          local: createImportSharedMetadata([]),
          base: createImportSharedMetadata([{ ...initialFacts, fieldIndex }]),
        }),
      }),
    },
  }
}
