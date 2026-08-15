import { cp, mkdtemp } from "node:fs/promises"
import { tmpdir } from "node:os"
import { isAbsolute, join, resolve } from "node:path"
import { describe, expect, it } from "vitest"
import { createRuleRegistrySet } from "@nkdk/runtime/rule-kit"
import { TopLevelMetadataItemRules } from "../../packages/rules/metadata/appliedObjects/configuration/topLevelRules"
import { metadataRules } from "../../packages/rules/metadata/composition/metadataRules"
import {
  childCapabilityExclusions,
  childDeclarations,
} from "./matrix/children"
import { configurationOperations } from "./matrix/configuration-operations"
import { childPropertyOperations } from "./matrix/child-property-operations"
import { formDeclarations, formLifecycleKinds } from "./matrix/forms"
import { templateLifecycleKinds } from "./matrix/templates"
import { externalFileOperations } from "./matrix/external-file-operations"
import {
  moduleOperations,
  moduleRestoreOperations,
  moduleSupplementalOperations,
} from "./matrix/module-operations"
import { ownExtensionOperationKinds } from "./matrix/extension/own"
import { borrowedOperationKinds } from "./matrix/extension/borrowed"
import { extensionConfigurationVerificationOperations } from "./matrix/extension/configuration"
import { orderOperations } from "./matrix/order-operations"
import { partialSyncMatrix } from "./matrix"
import { operationLayerMembership } from "./matrix/layers"
import { rootObjectDeclarations } from "./matrix/root-objects"
import { rootPropertyOperations } from "./matrix/root-property-operations"
import { structuralPropertyOperations } from "./matrix/structural-property-operations"
import { buildScenarioPlan } from "./plan"
import { applyScenarioBlock } from "./operation"
import { compareFileTrees } from "../support/file-tree"

describe("partial sync matrix", () => {
  it("covers every registered top-level metadata type exactly once", () => {
    expect(new Set(rootObjectDeclarations.map(({ itemType }) => itemType))).toEqual(
      new Set(TopLevelMetadataItemRules.map(({ itemType }) => itemType)),
    )
    expect(rootObjectDeclarations).toHaveLength(47)
  })

  it("changes the comment of every created root object", () => {
    expect(rootPropertyOperations.map(({ targetKey }) => targetKey).toSorted()).toEqual(
      rootObjectDeclarations.map(({ key }) => key).toSorted(),
    )
    expect(rootPropertyOperations).toHaveLength(47)
    for (const operation of rootPropertyOperations) {
      expect(operation.changes, operation.key).toHaveLength(1)
      expect(operation.changes[0]?.before, operation.key).toContain(
        "Комментарий: До изменения",
      )
      expect(operation.changes[0]?.after, operation.key).toContain(
        "Комментарий: После изменения",
      )
    }
  })

  it("creates the information register with a platform-valid seed resource", () => {
    const declaration = rootObjectDeclarations.find(({ key }) => key === "object:information-register")
    expect(declaration?.changes[0]?.after).toContain(
      "Ресурсы:\n  НачальныйРесурс:\n    Тип: Строка(10)",
    )
  })

  it("changes and restores configuration properties as one continuous chain", () => {
    expect(configurationOperations.map(({ key }) => key)).toEqual([
      "configuration:comment",
      "configuration:command-interface",
    ])
    expect(configurationOperations.map(({ changes }) => changes[0]?.path)).toEqual([
      "Конфигурация.yaml",
      "Конфигурация.yaml",
    ])
    expect(configurationOperations[0]?.changes[0]?.after).toContain(
      "Комментарий: Проверка частичной синхронизации",
    )
    expect(configurationOperations[1]?.changes[0]?.after).toContain(
      "Команда: Перечисление.ПеречислениеВсеСвойства.Команда.Команда1\n      Общее: Истина",
    )
  })

  it("wraps object layers between configuration change and restore", () => {
    const blockKeys = buildScenarioPlan(partialSyncMatrix).map(({ key }) => key)
    expect(blockKeys.slice(0, 2)).toEqual([
      "configuration:change:probe",
      "configuration:change:bulk",
    ])
    expect(blockKeys.slice(-4, -2)).toEqual([
      "configuration:restore:probe",
      "configuration:restore:bulk",
    ])
    expect(blockKeys.slice(-2)).toEqual([
      "extension:configuration:companion-documents:probe",
      "extension:configuration:companion-documents:restore:probe",
    ])
  })

  it("splits root creation into bounded bulk blocks", () => {
    const blocks = buildScenarioPlan(partialSyncMatrix)
      .filter(({ layerKey }) => layerKey === "roots:create")

    expect(blocks.map(({ key, operations }) => [key, operations.length])).toEqual([
      ["roots:create:probe", 1],
      ["roots:create:bulk:1", 12],
      ["roots:create:bulk:2", 12],
      ["roots:create:bulk:3", 12],
      ["roots:create:bulk:4", 10],
    ])
  })

  it("applies root property changes before child creation", () => {
    const blockKeys = buildScenarioPlan(partialSyncMatrix).map(({ key }) => key)
    expect(blockKeys.indexOf("roots:properties:bulk")).toBeGreaterThan(
      blockKeys.indexOf("roots:create:bulk:4"),
    )
    expect(blockKeys.indexOf("roots:properties:bulk")).toBeLessThan(
      blockKeys.indexOf("children:create:bulk"),
    )
  })

  it("covers representative structural property transitions", () => {
    expect(structuralPropertyOperations.map(({ key }) => key)).toEqual([
      "structural:catalog-attribute-length",
      "structural:document-attribute-type",
      "structural:task-attribute-required",
      "structural:information-register-dimension-index",
      "structural:document-register-link",
      "structural:task-business-process-link",
    ])
    const finalStates = structuralPropertyOperations.map(({ changes }) => changes[0]?.after)
    expect(finalStates[0]).toContain("Тип: Строка(20)")
    expect(finalStates[1]).toContain(
      "Тип: Справочник.ПроверкаЧастичнойСинхронизацииСправочник",
    )
    expect(finalStates[2]).toContain("ПроверкаЗаполнения: ВыдаватьОшибку")
    expect(finalStates[3]).toContain("Индексирование: Индексировать")
    expect(finalStates[4]).toContain(
      "РегистрСведений.ПроверкаЧастичнойСинхронизацииРегистрСведений",
    )
    expect(finalStates[5]).toContain(
      "БизнесПроцесс.ПроверкаЧастичнойСинхронизацииБизнесПроцесс",
    )
  })

  it("restores structural properties before removing children", () => {
    const blockKeys = buildScenarioPlan(partialSyncMatrix).map(({ key }) => key)
    expect(blockKeys.indexOf("structural:change:bulk")).toBeGreaterThan(
      blockKeys.indexOf("forms:create:bulk"),
    )
    expect(blockKeys.indexOf("structural:restore:bulk")).toBeLessThan(
      blockKeys.indexOf("forms:remove:bulk"),
    )
  })

  it("uses unique stable identities and project-relative file paths", () => {
    expect(unique(rootObjectDeclarations.map(({ key }) => key))).toBe(true)
    expect(unique(rootObjectDeclarations.map(({ name }) => name))).toBe(true)

    for (const declaration of rootObjectDeclarations) {
      const paths = declaration.changes.map(({ path }) => path)
      expect(unique(paths), declaration.key).toBe(true)
      for (const path of paths) {
        expect(isAbsolute(path), path).toBe(false)
        expect(path.split("/")).not.toContain("..")
        expect(path).not.toContain("\\")
      }
    }
  })

  it("adds the calculation register after existing registers", () => {
    const plan = scenarioOperations()
    const creation = plan.find(({ key }) => key === "object:calculation-register")
    const serialized = JSON.stringify(plan)

    expect(creation?.changes[0]?.path).toBe(
      "РегистрРасчета/ЯПроверкаЧастичнойСинхронизацииРегистрРасчета/Свойства.yaml",
    )
    expect(serialized).toContain("ЯПроверкаЧастичнойСинхронизацииРегистрРасчета")
    expect(new Set(serialized.match(/Я?ПроверкаЧастичнойСинхронизацииРегистрРасчета/gu))).toEqual(
      new Set(["ЯПроверкаЧастичнойСинхронизацииРегистрРасчета"]),
    )
    expect(plan.findIndex(({ key }) => key === "object:calculation-register")).toBe(
      plan.findIndex(({ key }) => key === "object:chart-of-calculation-types") + 1,
    )
  })

  it("emits the WS definition in the platform canonical namespace form", () => {
    const declaration = rootObjectDeclarations.find(({ key }) => key === "object:ws-reference")
    const definition = declaration?.changes.find(({ path }) => path.endsWith("/WSDefinition.xml"))?.after

    expect(definition).toEqual(expect.any(String))
    expect(definition).toContain('xmlns:soap12bind="http://schemas.xmlsoap.org/wsdl/soap12/"')
    expect(definition).toContain('xmlns:soapbind="http://schemas.xmlsoap.org/wsdl/soap/"')
    expect(definition).toContain('xmlns:wsp="http://schemas.xmlsoap.org/ws/2004/09/policy"')
    expect(definition).toContain('xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd"')
    expect(definition).toContain('xmlns:xsd1="http://example.org/partial-sync"')
    expect(definition).toContain("<soapbind:binding")
    expect(definition).toContain("<soapbind:address")
  })

  it("places characteristic type children before the value type", () => {
    const plan = scenarioOperations()
    for (const key of [
      "child:chart-of-characteristic-types:attributes",
      "child:chart-of-characteristic-types:tabularSections",
      "child:chart-of-characteristic-types:predefined",
    ]) {
      const operation = plan.find((candidate) => candidate.key === key)
      const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
      expect(properties, key).toEqual(expect.any(String))
      const source = properties as string
      expect(source.indexOf("ТипЗначения:"), key).toBeGreaterThan(0)
      for (const section of ["Реквизиты:", "ТабличныеЧасти:", "Предопределенные:"]) {
        const sectionIndex = source.indexOf(section)
        if (sectionIndex >= 0) expect(sectionIndex, `${key}: ${section}`).toBeLessThan(source.indexOf("ТипЗначения:"))
      }
    }
  })

  it("emits register fields in canonical section order without implicit fill values", () => {
    const plan = scenarioOperations()
    for (const owner of [
      "information-register",
      "accumulation-register",
      "accounting-register",
      "calculation-register",
    ]) {
      const operation = plan.find(({ key }) => key === `child:${owner}:attributes`)
      const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
      expect(properties, owner).toEqual(expect.any(String))
      const source = properties as string
      expect(source.indexOf("Измерения:"), owner).toBeLessThan(source.indexOf("Реквизиты:"))
      expect(source.indexOf("Реквизиты:"), owner).toBeLessThan(source.indexOf("Ресурсы:"))
      if (owner === "calculation-register") {
        expect(source.indexOf("Измерения:"), owner).toBeLessThan(source.indexOf("ПланВидовРасчета:"))
        expect(source.indexOf("ПланВидовРасчета:"), owner).toBeLessThan(source.indexOf("Реквизиты:"))
      }
      expect(source.match(/ЗначениеЗаполнения: ""/gu) ?? [], owner).toHaveLength(0)
    }
  })

  it("places ordinary register commands after dimensions", () => {
    const plan = scenarioOperations()
    for (const owner of ["accounting-register", "accumulation-register", "information-register"]) {
      const operation = plan.find(({ key }) => key === `child:${owner}:commands`)
      const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after as string

      expect(properties.indexOf("Измерения:"), owner).toBeLessThan(properties.indexOf("Команды:"))
      expect(properties.indexOf("Команды:"), owner).toBeLessThan(properties.indexOf("Реквизиты:"))
    }
  })

  it("places command sections in canonical top-level key order", () => {
    const plan = scenarioOperations()
    for (const operation of plan.filter(({ key }) => key.endsWith(":commands"))) {
      const properties = operation.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
      if (typeof properties !== "string") continue
      const keys = properties.split("\n")
        .filter((line) => /^\S[^:]*:/u.test(line))
        .map((line) => line.slice(0, line.indexOf(":")))

      expect(keys, operation.key).toEqual([...keys].sort((left, right) => left.localeCompare(right, "ru")))
    }
  })

  it("emits task addressing attributes before tabular sections without an implicit fill value", () => {
    const plan = scenarioOperations()
    const operation = plan.find(({ key }) => key === "child:task:addressingAttributes")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(properties).toEqual(expect.any(String))
    const source = properties as string
    expect(source.indexOf("РеквизитыАдресации:")).toBeLessThan(source.indexOf("ТабличныеЧасти:"))
    expect(source).not.toContain("    ЗначениеЗаполнения: \"\"")
  })

  it("emits predefined values before object fields", () => {
    const plan = scenarioOperations()
    for (const owner of [
      "catalog",
      "chart-of-accounts",
      "chart-of-calculation-types",
      "chart-of-characteristic-types",
    ]) {
      const operation = plan.find(({ key }) => key === `child:${owner}:predefined`)
      const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
      expect(properties, owner).toEqual(expect.any(String))
      const source = properties as string
      expect(source.indexOf("Предопределенные:"), owner).toBeLessThan(source.indexOf("Реквизиты:"))
      expect(source.indexOf("Предопределенные:"), owner).toBeLessThan(source.indexOf("ТабличныеЧасти:"))
      if (owner !== "catalog") expect(source, owner).toContain("    Код: \"1\"")
      if (owner === "chart-of-accounts") {
        expect(source, owner).toContain("    Забалансовый: Ложь")
        expect(source, owner).toContain("    Порядок: \"\"")
      }
      if (owner === "chart-of-calculation-types") {
        expect(source, owner).toContain("    ПериодДействияБазовый: Ложь")
      }
    }
  })

  it("emits document journal columns before registered documents", () => {
    const plan = scenarioOperations()
    const operation = plan.find(({ key }) => key === "child:document-journal:columns")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(properties).toEqual(expect.any(String))
    const source = properties as string
    expect(source.indexOf("Графы:")).toBeLessThan(source.indexOf("РегистрируемыеДокументы:"))
  })

  it("emits HTTP methods before the URL template", () => {
    const plan = scenarioOperations()
    const operation = plan.find(({ key }) => key === "child:http-service-urlTemplates:methods")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(properties).toEqual(expect.any(String))
    const template = (properties as string).slice((properties as string).indexOf("ПроверочныйШаблонURL:"))
    expect(template.indexOf("Методы:")).toBeLessThan(template.indexOf("Шаблон:"))
  })

  it("emits web-service operations and parameters in canonical order", () => {
    const plan = scenarioOperations()
    const operation = plan.find(({ key }) => key === "child:web-service:operations")
    const operationProperties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(operationProperties).toEqual(expect.any(String))
    const operationSource = operationProperties as string
    expect(operationSource.indexOf("Операции:")).toBeLessThan(operationSource.indexOf("ПространствоИмен:"))
    expect(operationSource).toContain("    Комментарий: До изменения")

    const parameter = plan.find(({ key }) => key === "child:web-service-operations:parameters")
    const parameterProperties = parameter?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(parameterProperties).toEqual(expect.any(String))
    const parameterSource = parameterProperties as string
    expect(parameterSource.indexOf("    Параметры:")).toBeLessThan(
      parameterSource.indexOf("    РежимУправленияБлокировкойДанных:"),
    )
    expect(parameterSource).toContain("        Комментарий: До изменения")
  })

  it("emits an empty integration-service channel in the platform canonical form", () => {
    const plan = scenarioOperations()
    const operation = plan.find(({ key }) => key === "child:integration-service:channels")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after

    expect(properties).toEqual(expect.any(String))
    expect(properties).toContain("  ПроверочныйКанал:\n")
    expect(properties).not.toContain("  ПроверочныйКанал: {}\n")
  })

  it("emits external-data-source table fields before table properties", () => {
    const plan = scenarioOperations()
    const operation = plan.find(({ key }) => key === "child:external-data-source:tables")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after

    expect(properties).toEqual(expect.any(String))
    const source = properties as string
    expect(source.indexOf("Поля:")).toBeLessThan(source.indexOf("ТипТаблицы:"))
    expect(source.indexOf("Поля:")).toBeLessThan(source.indexOf("ТолькоЧтение:"))

    const fieldOperation = plan.find(({ key }) => key === "child:external-data-source-tables:fields")
    const fieldProperties = fieldOperation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(fieldProperties).toEqual(expect.any(String))
    const fieldSource = fieldProperties as string
    expect(fieldSource.indexOf("  ПроверочноеПоле:")).toBeGreaterThan(fieldSource.indexOf("Поля:"))
    expect(fieldSource.indexOf("  ПроверочноеПоле:")).toBeLessThan(fieldSource.indexOf("ТипТаблицы:"))
  })

  it("emits a standalone string type for an external-data-source cube dimension", () => {
    const plan = scenarioOperations()
    const operation = plan.find(({ key }) => key === "child:external-data-source-cubes:dimensions")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after

    expect(properties).toContain("    Тип: Строка(10)")
    expect(properties).not.toContain("    ЗначениеЗаполнения: \"\"")
    expect(properties).not.toContain("ТаблицаИзмерения")
    const source = properties as string
    expect(source.indexOf("Измерения:")).toBeLessThan(source.indexOf("ИмяВИсточникеДанных:"))
  })

  it("uses the canonical recalculation XML project path", () => {
    const plan = scenarioOperations()
    const operation = plan.find(({ key }) => key === "child:calculation-register:recalculations")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after as string
    const recalculationXml = operation?.changes.find(({ path }) => path.endsWith("/Перерасчеты/ПроверочныйПерерасчет/Свойства.xml"))?.after as string

    expect(operation?.changes.map(({ path }) => path)).toContain(
      "РегистрРасчета/ЯПроверкаЧастичнойСинхронизацииРегистрРасчета/Перерасчеты/ПроверочныйПерерасчет/Свойства.xml",
    )
    expect(operation?.changes.some(({ path }) => path.endsWith("/Recalculation.xml"))).toBe(false)
    expect(properties.indexOf("Перерасчеты:")).toBeLessThan(properties.indexOf("ПланВидовРасчета:"))
    expect(properties).toContain("  ПроверочныйПерерасчет:\n")
    expect(properties).not.toContain("Синоним: \"\"")
    expect(recalculationXml).toMatch(/^\uFEFF<\?xml version="1.0" encoding="UTF-8"\?>\r\n/)
    expect(recalculationXml).toContain("xmlns:app=\"http://v8.1c.ru/8.2/managed-application/core\"")
    expect(recalculationXml).toContain("xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\"")
    expect(recalculationXml.endsWith("\n")).toBe(false)
  })

  it("adds recalculation dimensions to the external recalculation XML", () => {
    const plan = scenarioOperations()
    const operation = plan.find(({ key }) => key === "child:calculation-register-recalculations:dimensions")
    const change = operation?.changes[0]

    expect(operation?.changes).toHaveLength(1)
    expect(change?.path).toBe(
      "РегистрРасчета/ЯПроверкаЧастичнойСинхронизацииРегистрРасчета/Перерасчеты/ПроверочныйПерерасчет/Свойства.xml",
    )
    expect(change?.before).not.toContain("<Dimension ")
    expect(change?.after).toContain('<Dimension uuid="10000000-0000-4000-8000-000000000008">')
    expect(change?.after).toContain("<Name>ПроверочноеИзмерение</Name>")
    expect(change?.after).toContain(
      '<RegisterDimension>CalculationRegister.ЯПроверкаЧастичнойСинхронизацииРегистрРасчета.Dimension.ПроверочноеИзмерение</RegisterDimension>',
    )
    expect(change?.after).toContain(
      '<xr:Item xsi:type="xr:MDObjectRef">CalculationRegister.ЯПроверкаЧастичнойСинхронизацииРегистрРасчета.Dimension.ПроверочноеИзмерение</xr:Item>',
    )
    expect(change?.after).not.toContain("<Type>")
  })

  it("defers non-required register resources to the child layer", () => {
    for (const key of [
      "object:accumulation-register",
      "object:accounting-register",
    ]) {
      const declaration = rootObjectDeclarations.find((item) => item.key === key)
      const properties = declaration?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))

      expect(properties?.after, key).not.toContain("Ресурсы:")
    }
  })

  it("omits implicit default properties from minimal root objects", () => {
    const commonForm = rootObjectDeclarations.find(({ key }) => key === "object:common-form")
    const properties = commonForm?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))

    expect(properties?.after).not.toContain("ИспользоватьСтандартныеКоманды")
    expect(properties?.after).toBe(
      "Комментарий: До изменения\nНазначенияИспользования: ПлатформаИМобильноеПриложение\n",
    )
  })

  it("declares every reachable owner-child capability", () => {
    expect(childCapabilityExclusions).toEqual([])
    const ownerItemTypes = new Map(
      rootObjectDeclarations.map(({ key, itemType }) => [key, itemType]),
    )
    const declared = new Set<string>()
    for (const child of childDeclarations) {
      const ownerItemType = ownerItemTypes.get(child.ownerKey)
      expect(ownerItemType, child.key).toBeDefined()
      declared.add(`${ownerItemType}:${child.propertyKey}:${child.childItemType}`)
      ownerItemTypes.set(child.key, child.childItemType)
    }
    const discovered = collectRuleChildCapabilities()
    const exclusions = new Set(childCapabilityExclusions.map(({ capability }) => capability))

    for (const exclusion of childCapabilityExclusions) {
      expect(exclusion.reason.trim(), exclusion.capability).not.toBe("")
      expect(discovered.has(exclusion.capability), exclusion.capability).toBe(true)
    }
    expect(new Set([...declared, ...exclusions])).toEqual(discovered)
    expect(childDeclarations).toHaveLength(discovered.size - exclusions.size)
    expect(unique(childDeclarations.map(({ key }) => key))).toBe(true)
  })

  it("changes a property of every declared child", () => {
    expect(childPropertyOperations.map(({ targetKey }) => targetKey).toSorted()).toEqual(
      childDeclarations.map(({ key }) => key).toSorted(),
    )
    for (const operation of childPropertyOperations) {
      expect(operation.changes.length, operation.key).toBeGreaterThan(0)
    }
  })

  it("changes order in every representative collection class", () => {
    expect(new Set(orderOperations.map(({ collectionKind }) => collectionKind))).toEqual(
      new Set(["attributes", "register-fields", "commands", "values"]),
    )
  })

  it("declares exactly one form for every top-level owner that supports forms", () => {
    const ownerItemTypes = new Map(
      rootObjectDeclarations.map(({ key, itemType }) => [key, itemType]),
    )
    const declared = formDeclarations.map(({ ownerKey }) => ownerItemTypes.get(ownerKey))
    const discovered = TopLevelMetadataItemRules
      .filter((rule) => Object.values(rule.properties).some(({ type }) => type === "ChildFormNames"))
      .map(({ itemType }) => itemType)

    expect(declared.every((itemType) => itemType !== undefined)).toBe(true)
    expect(new Set(declared)).toEqual(new Set(discovered))
    expect(declared).toHaveLength(discovered.length)
    expect(unique(formDeclarations.map(({ key }) => key))).toBe(true)
  })

  it("uses the canonical minimal client form", () => {
    for (const declaration of formDeclarations) {
      expect(declaration.changes[0]?.after, declaration.key).toBe(
        "Синоним: \"\"\nНазначенияИспользования: ПлатформаИМобильноеПриложение",
      )
    }
  })

  it("covers the complete form and text-template lifecycle", () => {
    expect(formLifecycleKinds).toEqual([
      "create", "add-attribute", "add-command", "add-elements", "change-properties",
      "change-module", "remove-content", "remove-form-only", "remove-owner-with-form",
    ])
    expect(templateLifecycleKinds).toEqual([
      "create", "change-text", "remove-template-only", "remove-owner-with-template",
    ])
  })

  it("uses the owner-specific project folder for text templates", () => {
    const templatePaths = partialSyncMatrix.templates.flatMap(({ changes }) => changes.map(({ path }) => path))
    expect(templatePaths.some((path) => path.startsWith("Отчет/") && path.includes("/Шаблоны/"))).toBe(true)
    expect(templatePaths.some((path) => path.startsWith("Задача/") && path.includes("/Макеты/"))).toBe(true)

    const extensionPaths = partialSyncMatrix.extensionLayers.flatMap(({ operations }) => operations)
      .flatMap(({ changes }) => changes.map(({ path }) => path))
    expect(extensionPaths.filter((path) => /^(Справочник|Документ)\//u.test(path) && path.includes("Template.")))
      .toSatisfy((paths: string[]) => paths.every((path) => path.includes("/Шаблоны/")))
  })

  it("uses a concrete input-field kind for the added form field", () => {
    const operation = partialSyncMatrix.formLifecycleOperations.find(({ key }) => key === "form-content:add-elements")
    expect(operation?.changes[0]?.after).toContain("ПроверочноеПоле:\n    Вид: ПолеВвода")
    expect(operation?.changes[0]?.after).toContain("ПроверочнаяТаблица:\n    Вид: ТаблицаФормы")
  })

  it("changes the form synonym to a value not inferred from its name", () => {
    const operation = partialSyncMatrix.formLifecycleOperations.find(({ key }) => key === "form-content:change-properties")
    expect(operation?.changes[0]?.after).toContain("Синоним: Изменённая форма")
  })

  it("covers module and external payload classes", () => {
    expect(externalFileOperations.map(({ payloadKind }) => payloadKind).toSorted())
      .toEqual(["binary", "rights-xml", "ws-or-xdto"])
    expect(moduleOperations.map(({ moduleKind }) => moduleKind).toSorted())
      .toEqual(["command", "common", "form", "object"])
    expect(moduleSupplementalOperations.map(({ key }) => key)).toEqual([
      "module:command:restore",
      "module:form:change",
      "module:object:change",
    ])
    expect(moduleRestoreOperations.map(({ key }) => key)).toEqual([
      "module:common:restore",
    ])
    const plan = buildScenarioPlan(partialSyncMatrix)
    const removals = plan.flatMap(({ operations }) => operations).filter(({ kind }) => kind === "remove")
    expect(removals.find(({ targetKey }) => targetKey === "object:catalog")?.changes)
      .toContainEqual(expect.objectContaining({
        path: expect.stringMatching(/\/МодульОбъекта\.bsl$/u),
        after: null,
      }))
    expect(removals.find(({ targetKey }) => targetKey === "form:catalog")?.changes)
      .toContainEqual(expect.objectContaining({
        path: expect.stringMatching(/\/Формы\/ПроверочнаяФорма\/Модуль\.bsl$/u),
        after: null,
      }))
  })

  it("covers own extension objects and both child-removal variants", () => {
    expect(extensionConfigurationVerificationOperations.map(({ key }) => key)).toEqual([
      "extension:configuration:companion-documents",
      "extension:configuration:companion-documents:restore",
    ])
    expect(ownExtensionOperationKinds).toEqual([
      "create-owner", "change-owner", "add-attribute", "change-attribute",
      "add-tabular-section", "change-tabular-section", "add-command", "change-command",
      "add-form", "change-form", "add-template", "change-template", "add-module", "change-module",
      "remove-form-only", "remove-template-only", "remove-owner", "remove-owner-with-children",
    ])
    const creation = partialSyncMatrix.layers.flatMap(({ operations }) => operations)
      .find(({ key }) => key === "extension:own:create-owner")
    const properties = creation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(properties).toContain("ДлинаКода: 11")
    expect(properties).toContain("ДлинаНаименования: 30")
    expect(properties).not.toContain("ТипКода: Строка")
    const tabularChange = partialSyncMatrix.layers.flatMap(({ operations }) => operations)
      .find(({ key }) => key === "extension:own:change-tabular-section")
      ?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(tabularChange).toContain("Синоним: Изменённая табличная часть")
  })

  it("covers borrowed extension objects without deleting cf objects", () => {
    expect(borrowedOperationKinds).toEqual([
      "borrow-owner", "change-property-state", "change-reference", "add-own-attribute",
      "add-own-command", "extend-borrowed-form", "add-own-form", "add-own-template",
      "remove-extension-additions", "remove-borrowed-owner",
    ])
    const referenceChange = partialSyncMatrix.layers.flatMap(({ operations }) => operations)
      .find(({ key }) => key === "extension:borrowed:change-reference")
      ?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(referenceChange).toContain("Тип: Справочник.СправочникРеквизит")
    expect(referenceChange).not.toContain("ВводитсяНаОсновании")
    const formExtension = partialSyncMatrix.layers.flatMap(({ operations }) => operations)
      .find(({ key }) => key === "extension:borrowed:extend-borrowed-form")
      ?.changes.find(({ path }) => path.endsWith("/Форма.yaml"))?.after
    expect(formExtension).toContain("Вид: ПолеВвода")
    expect(formExtension).not.toContain("ВидПоля:")
    const baseForm = partialSyncMatrix.layers.flatMap(({ operations }) => operations)
      .find(({ key }) => key === "extension:borrowed:extend-borrowed-form")
      ?.changes.find(({ path }) => path.endsWith("/БазоваяФорма.yaml"))?.after
    expect(baseForm).toContain("НазначенияИспользования: ПлатформаИМобильноеПриложение")
    expect(baseForm).not.toContain("Изменять:")
    const ownForm = partialSyncMatrix.layers.flatMap(({ operations }) => operations)
      .find(({ key }) => key === "extension:borrowed:add-own-form")
      ?.changes.find(({ path }) => path.endsWith("/Форма.yaml"))?.after
    expect(ownForm).toContain("Синоним: Собственная форма расширения")
  })

  it("assigns every operation to one component layer and orders both removal variants", () => {
    const layers = partialSyncMatrix.layers
    const membership = operationLayerMembership(layers)
    expect([...membership.values()].every((count) => count === 1)).toBe(true)
    expect(membership.size).toBe(layers.reduce((count, layer) => count + layer.operations.length, 0))

    for (const layer of layers.filter(({ key }) => key.startsWith("extension:"))) {
      expect(layer.componentPath, layer.key).toBe("cfe/Расширение_All")
    }

    const keys = layers.flatMap(({ operations }) => operations.map(({ key }) => key))
    expect(keys.indexOf("extension:own:remove-form-only")).toBeLessThan(keys.indexOf("extension:own:remove-owner"))
    expect(keys.indexOf("extension:own:remove-template-only")).toBeLessThan(keys.indexOf("extension:own:remove-owner"))
    expect(keys.indexOf("extension:borrowed:remove-extension-additions")).toBeLessThan(keys.indexOf("extension:borrowed:remove-borrowed-owner"))

    const taskRemoval = layers.flatMap(({ operations }) => operations)
      .find(({ key }) => key === "remove:object:task")
    expect(taskRemoval?.changes.some(({ path }) => path.includes("/Формы/ПроверочнаяФорма/"))).toBe(true)
    expect(taskRemoval?.changes.some(({ path }) => path.includes("/Макеты/ПроверочныйМакетСВладельцем/"))).toBe(true)
  })

  it("forms one continuous and reversible transition for every declared path", () => {
    const initialConfiguration = configurationOperations[0]?.changes[0]?.before
    expect(initialConfiguration).toEqual(expect.any(String))
    const initialFiles = new Map<string, string | Uint8Array>([
      ["cf/Конфигурация.yaml", initialConfiguration as string],
    ])
    const seenPaths = new Set(initialFiles.keys())
    for (const block of buildScenarioPlan(partialSyncMatrix)) {
      for (const operation of block.operations) for (const change of operation.changes) {
        const path = `${block.componentPath}/${change.path}`
        if (!seenPaths.has(path) && change.before !== null) initialFiles.set(path, change.before)
        seenPaths.add(path)
      }
    }
    const files = new Map(initialFiles)

    for (const block of buildScenarioPlan(partialSyncMatrix)) {
      for (const operation of block.operations) for (const change of operation.changes) {
        const path = `${block.componentPath}/${change.path}`
        expect(files.get(path) ?? null, `${operation.key}: ${path}`)
          .toEqual(change.before)
        if (change.after === null) files.delete(path)
        else files.set(path, change.after)
      }
    }

    expect(files).toEqual(initialFiles)
  })

  it("returns a real NKDK fixture tree to its initial state after the full plan", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "nkdk-matrix-reversible-"))
    const source = resolve(import.meta.dirname, "../fixtures/nkdk")
    const projectDir = join(temporaryRoot, "project")
    await cp(source, projectDir, { recursive: true })

    for (const block of buildScenarioPlan(partialSyncMatrix)) {
      await applyScenarioBlock(projectDir, block)
    }

    const comparison = await compareFileTrees({
      expectedDir: source,
      actualDir: projectDir,
      reportDir: join(temporaryRoot, "report"),
    })
    expect(comparison).toMatchObject({ equal: true })
  })
})

function unique(values: readonly string[]): boolean {
  return new Set(values).size === values.length
}

function scenarioOperations() {
  return buildScenarioPlan(partialSyncMatrix).flatMap(({ operations }) => operations)
}

function collectRuleChildCapabilities(): Set<string> {
  const execution = createRuleRegistrySet(metadataRules).execution
  const capabilities = new Set<string>()
  const visited = new Set<string>()

  function visit(rule: (typeof TopLevelMetadataItemRules)[number]): void {
    if (visited.has(rule.itemType)) return
    visited.add(rule.itemType)
    for (const [propertyKey, propertyRule] of Object.entries(rule.properties)) {
      const nested = execution.getTypeRule(propertyRule.type, "nestedItemRule")
      const childRule = execution.resolvePropertyItemRule(propertyRule)
        ?? (nested !== undefined && "itemRule" in nested ? nested.itemRule : undefined)
      if (childRule === undefined || childRule.itemType === "ClientApplicationForm") continue
      if (!childRule.itemType.startsWith("Metadata") && childRule.itemType !== "Predefined") continue
      capabilities.add(`${rule.itemType}:${propertyKey}:${childRule.itemType}`)
      visit(childRule)
    }
    for (const collection of rule.childCollections ?? []) {
      const childRule = collection.fileItemRule ?? collection.itemRule
      capabilities.add(`${rule.itemType}:${collection.propertyKey}:${childRule.itemType}`)
      visit(childRule)
    }
  }

  for (const rule of TopLevelMetadataItemRules) visit(rule)
  return capabilities
}
