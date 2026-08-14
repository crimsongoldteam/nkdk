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
import { formDeclarations } from "./matrix/forms"
import { partialSyncMatrix } from "./matrix"
import { rootObjectDeclarations } from "./matrix/root-objects"
import { buildScenarioPlan } from "./plan"
import { applyScenarioOperation } from "./operation"
import { compareFileTrees } from "../support/file-tree"

describe("partial sync matrix", () => {
  it("covers every registered top-level metadata type exactly once", () => {
    expect(new Set(rootObjectDeclarations.map(({ itemType }) => itemType))).toEqual(
      new Set(TopLevelMetadataItemRules.map(({ itemType }) => itemType)),
    )
    expect(rootObjectDeclarations).toHaveLength(47)
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
    const plan = buildScenarioPlan(partialSyncMatrix)
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
    const plan = buildScenarioPlan(partialSyncMatrix)
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

  it("emits register fields in canonical section order with string fill values", () => {
    const plan = buildScenarioPlan(partialSyncMatrix)
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
      expect(source.match(/ЗначениеЗаполнения: ""/gu) ?? [], owner)
        .toHaveLength(owner === "information-register" ? 2 : 0)
    }
  })

  it("emits task addressing attributes before tabular sections with a string fill value", () => {
    const plan = buildScenarioPlan(partialSyncMatrix)
    const operation = plan.find(({ key }) => key === "child:task:addressingAttributes")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(properties).toEqual(expect.any(String))
    const source = properties as string
    expect(source.indexOf("РеквизитыАдресации:")).toBeLessThan(source.indexOf("ТабличныеЧасти:"))
    expect(source).toContain("    ЗначениеЗаполнения: \"\"")
  })

  it("emits predefined values before object fields", () => {
    const plan = buildScenarioPlan(partialSyncMatrix)
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
    const plan = buildScenarioPlan(partialSyncMatrix)
    const operation = plan.find(({ key }) => key === "child:document-journal:columns")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(properties).toEqual(expect.any(String))
    const source = properties as string
    expect(source.indexOf("Графы:")).toBeLessThan(source.indexOf("РегистрируемыеДокументы:"))
  })

  it("emits HTTP methods before the URL template", () => {
    const plan = buildScenarioPlan(partialSyncMatrix)
    const operation = plan.find(({ key }) => key === "child:http-service-urlTemplates:methods")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(properties).toEqual(expect.any(String))
    const template = (properties as string).slice((properties as string).indexOf("ПроверочныйШаблонURL:"))
    expect(template.indexOf("Методы:")).toBeLessThan(template.indexOf("Шаблон:"))
  })

  it("emits web-service operations and parameters in canonical order", () => {
    const plan = buildScenarioPlan(partialSyncMatrix)
    const operation = plan.find(({ key }) => key === "child:web-service:operations")
    const operationProperties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(operationProperties).toEqual(expect.any(String))
    const operationSource = operationProperties as string
    expect(operationSource.indexOf("Операции:")).toBeLessThan(operationSource.indexOf("ПространствоИмен:"))
    expect(operationSource).toContain("    Комментарий: \"\"")

    const parameter = plan.find(({ key }) => key === "child:web-service-operations:parameters")
    const parameterProperties = parameter?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after
    expect(parameterProperties).toEqual(expect.any(String))
    const parameterSource = parameterProperties as string
    expect(parameterSource.indexOf("    Параметры:")).toBeLessThan(
      parameterSource.indexOf("    РежимУправленияБлокировкойДанных:"),
    )
    expect(parameterSource).toContain("        Комментарий: \"\"")
  })

  it("emits an empty integration-service channel in the platform canonical form", () => {
    const plan = buildScenarioPlan(partialSyncMatrix)
    const operation = plan.find(({ key }) => key === "child:integration-service:channels")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after

    expect(properties).toEqual(expect.any(String))
    expect(properties).toContain("  ПроверочныйКанал:\n")
    expect(properties).not.toContain("  ПроверочныйКанал: {}\n")
  })

  it("emits external-data-source table fields before table properties", () => {
    const plan = buildScenarioPlan(partialSyncMatrix)
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

  it("emits the dimension-table reference with metadata type prefixes", () => {
    const plan = buildScenarioPlan(partialSyncMatrix)
    const operation = plan.find(({ key }) => key === "child:external-data-source-cubes:dimensions")
    const properties = operation?.changes.find(({ path }) => path.endsWith("/Свойства.yaml"))?.after

    expect(properties).toContain(
      "Тип: ВнешнийИсточникДанныхПроверкаЧастичнойСинхронизацииВнешнийИсточникДанных.КубПроверочныйКуб.ТаблицаИзмеренияПроверочнаяТаблицаИзмерения",
    )
  })

  it("does not create register resources in the root-object layer", () => {
    for (const key of [
      "object:information-register",
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
    expect(properties?.after).toBe("НазначенияИспользования: ПлатформаИМобильноеПриложение\n")
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

  it("forms one continuous and reversible transition for every declared path", () => {
    const files = new Map<string, string | Uint8Array>()

    for (const operation of buildScenarioPlan(partialSyncMatrix)) {
      for (const change of operation.changes) {
        expect(files.get(change.path) ?? null, `${operation.key}: ${change.path}`)
          .toEqual(change.before)
        if (change.after === null) files.delete(change.path)
        else files.set(change.path, change.after)
      }
    }

    expect(files).toEqual(new Map())
  })

  it("returns a real NKDK fixture tree to its initial state after the full plan", async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), "nkdk-matrix-reversible-"))
    const source = resolve(import.meta.dirname, "../fixtures/nkdk")
    const projectDir = join(temporaryRoot, "project")
    await cp(source, projectDir, { recursive: true })

    for (const operation of buildScenarioPlan(partialSyncMatrix)) {
      await applyScenarioOperation(projectDir, operation)
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
