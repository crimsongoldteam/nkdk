import { Type, TSchema } from "@sinclair/typebox"
import { Value } from "@sinclair/typebox/value"
import { TypeDescriptionAllowedType, TypeDescriptionAllowedTypes } from "./types"

export const METADATA_NAME_YAML_PATTERN = "[a-zA-Zа-яА-ЯёЁ_][a-zA-Zа-яА-ЯёЁ0-9_]*"

const metadataNamePattern = METADATA_NAME_YAML_PATTERN

interface TypeDescriptionBranch {
  schema: TSchema
  singleOnly?: true
}

type BranchFactory = () => TypeDescriptionBranch[]

const createStringBranch = (pattern: string, options: Record<string, unknown> = {}): TSchema =>
  Type.String({ pattern, ...options })

const createConstBranch = (value: string, options: Record<string, unknown> = {}): TSchema =>
  Type.Literal(value, options)

const createEnumBranch = (values: string[]): TSchema => ({
  ...Type.Union(values.map((value) => createConstBranch(value))),
  enum: values,
})

const createUnion = (branches: TSchema[], description: string): TSchema => {
  if (branches.length === 0) {
    return Type.Never({ description })
  }

  if (branches.length === 1) {
    return { ...branches[0], description }
  }

  return Type.Union(branches, { description })
}

const graphQuery = (kind: string): { "x-nkdk-graph": { query: string } } => ({
  "x-nkdk-graph": {
    query: `MATCH (n:MetadataObject {kind: '${kind}'}) RETURN n.name ORDER BY n.name`,
  },
})

const externalDataSourceTableGraphQuery = (): { "x-nkdk-graph": { query: string } } => ({
  "x-nkdk-graph": {
    query:
      "MATCH (s:MetadataObject {kind: 'MetadataExternalDataSource'})-[:EXTERNAL_DATA_SOURCE_TABLE]->(t:MetadataExternalDataSourceTable) RETURN s.name, t.name ORDER BY s.name, t.name",
  },
})

const externalDataSourceCubeDimensionTableGraphQuery = (): { "x-nkdk-graph": { query: string } } => ({
  "x-nkdk-graph": {
    query:
      "MATCH (s:MetadataObject {kind: 'MetadataExternalDataSource'})-[:EXTERNAL_DATA_SOURCE_CUBE]->(c:MetadataExternalDataSourceCube)-[:EXTERNAL_DATA_SOURCE_DIMENSION_TABLE]->(t:MetadataExternalDataSourceDimensionTable) RETURN s.name, c.name, t.name ORDER BY s.name, c.name, t.name",
  },
})

const concreteRefBranch = (yamlName: string, kind: string): TypeDescriptionBranch => ({
  schema: createStringBranch(`^${yamlName}\\.${metadataNamePattern}$`, graphQuery(kind)),
})

const primitiveBranches: Partial<Record<TypeDescriptionAllowedType, BranchFactory>> = {
  string: () => [
    {
      schema: createStringBranch("^Строка(?:\\([1-9][0-9]*\\))?$", {
        description: "Строка или Строка(длина). Длина — максимальное количество символов.",
        examples: ["Строка", "Строка(10)"],
      }),
    },
    {
      schema: createStringBranch("^ФиксированнаяСтрока\\([1-9][0-9]*\\)$", {
        description: "ФиксированнаяСтрока(длина). Длина — точное количество символов.",
        examples: ["ФиксированнаяСтрока(10)"],
      }),
    },
  ],
  decimal: () => [
    {
      schema: createStringBranch("^Число(?:\\([1-9][0-9]*(?:\\s*,\\s*[0-9]+)?\\))?$", {
        description:
          "Число, Число(длина) или Число(длина, точность). Длина — общее количество цифр, точность — количество дробных цифр.",
        examples: ["Число", "Число(10)", "Число(10, 2)"],
      }),
    },
    {
      schema: createStringBranch("^ПоложительноеЧисло(?:\\([1-9][0-9]*(?:\\s*,\\s*[0-9]+)?\\))?$", {
        description:
          "ПоложительноеЧисло, ПоложительноеЧисло(длина) или ПоложительноеЧисло(длина, точность). Длина — общее количество цифр, точность — количество дробных цифр.",
        examples: ["ПоложительноеЧисло", "ПоложительноеЧисло(10)", "ПоложительноеЧисло(10, 2)"],
      }),
    },
  ],
  date: () => [{ schema: createEnumBranch(["Дата", "Время", "ДатаВремя"]) }],
  boolean: () => [{ schema: createConstBranch("Булево") }],
  ValueStorage: () => [{ schema: createConstBranch("ХранилищеЗначения"), singleOnly: true }],
  UUID: () => [{ schema: createConstBranch("УникальныйИдентификатор"), singleOnly: true }],
  AnyIBRef: () => [{ schema: createConstBranch("ЛюбаяСсылка") }],
}

const exactObjectBranches: Partial<Record<TypeDescriptionAllowedType, string>> = {
  CatalogRef: "Справочник",
  DocumentRef: "Документ",
  EnumRef: "Перечисление",
  ChartOfCharacteristicTypesRef: "ПланВидовХарактеристик",
  ChartOfAccountsRef: "ПланСчетов",
  ChartOfCalculationTypesRef: "ПланВидовРасчета",
  BusinessProcessRef: "БизнесПроцесс",
  BusinessProcessRoutePointRef: "ТочкаМаршрутаБизнесПроцесса",
  TaskRef: "Задача",
  ExchangePlanRef: "ПланОбмена",
}

const concreteObjectBranches: Partial<Record<TypeDescriptionAllowedType, BranchFactory>> = {
  "CatalogRef.*": () => [concreteRefBranch("Справочник", "MetadataCatalog")],
  "DocumentRef.*": () => [concreteRefBranch("Документ", "MetadataDocument")],
  "EnumRef.*": () => [concreteRefBranch("Перечисление", "MetadataEnumeration")],
  "ChartOfCharacteristicTypesRef.*": () => [
    concreteRefBranch("ПланВидовХарактеристик", "MetadataChartOfCharacteristicTypes"),
  ],
  "ChartOfAccountsRef.*": () => [concreteRefBranch("ПланСчетов", "MetadataChartOfAccounts")],
  "ChartOfCalculationTypesRef.*": () => [concreteRefBranch("ПланВидовРасчета", "MetadataChartOfCalculationTypes")],
  "BusinessProcessRef.*": () => [concreteRefBranch("БизнесПроцесс", "MetadataBusinessProcess")],
  "BusinessProcessRoutePointRef.*": () => [
    concreteRefBranch("ТочкаМаршрутаБизнесПроцесса", "MetadataBusinessProcess"),
  ],
  "TaskRef.*": () => [concreteRefBranch("Задача", "MetadataTask")],
  "ExchangePlanRef.*": () => [concreteRefBranch("ПланОбмена", "MetadataExchangePlan")],
  "DefinedType.*": () => [
    {
      ...concreteRefBranch("ОпределяемыйТип", "MetadataDefinedType"),
      singleOnly: true,
    },
  ],
  "Characteristic.*": () => [
    {
      ...concreteRefBranch("Характеристика", "MetadataChartOfCharacteristicTypes"),
      singleOnly: true,
    },
  ],
  "ExternalDataSourceTableRef.*": () => [
    {
      schema: createStringBranch(
        `^ВнешнийИсточникДанных${metadataNamePattern}\\.Таблица${metadataNamePattern}$`,
        externalDataSourceTableGraphQuery()
      ),
      singleOnly: true,
    },
  ],
  "ExternalDataSourceCubeDimensionTableRef.*": () => [
    {
      schema: createStringBranch(
        `^ВнешнийИсточникДанных${metadataNamePattern}\\.Куб${metadataNamePattern}\\.ТаблицаИзмерения${metadataNamePattern}$`,
        externalDataSourceCubeDimensionTableGraphQuery()
      ),
      singleOnly: true,
    },
  ],
}

const buildBranches = (allowedTypes: TypeDescriptionAllowedTypes): TypeDescriptionBranch[] => {
  const branches: TypeDescriptionBranch[] = []

  for (const allowedType of allowedTypes) {
    const primitiveFactory = primitiveBranches[allowedType]
    if (primitiveFactory) {
      branches.push(...primitiveFactory())
      continue
    }

    const exactObjectName = exactObjectBranches[allowedType]
    if (exactObjectName) {
      branches.push({ schema: createConstBranch(exactObjectName) })
      continue
    }

    const concreteFactory = concreteObjectBranches[allowedType]
    if (concreteFactory) {
      branches.push(...concreteFactory())
    }
  }

  return branches
}

export const buildTypeDescriptionJSONSchema = (allowedTypes: TypeDescriptionAllowedTypes): TSchema => {
  const branches = buildBranches(allowedTypes)
  const singleBranches = branches.map((branch) => branch.schema)
  const compositeBranches = branches.filter((branch) => !branch.singleOnly).map((branch) => branch.schema)

  return Type.Union([
    createUnion(singleBranches, "Одиночный тип"),
    Type.Array(createUnion(compositeBranches, "Элемент составного типа"), {
      description: "Составной тип",
      minItems: 1,
      uniqueItems: true,
    }),
  ])
}

export const assertTypeDescriptionYAMLAllowed = (params: {
  value: unknown
  allowedTypes: TypeDescriptionAllowedTypes
}): void => {
  const schema = buildTypeDescriptionJSONSchema(params.allowedTypes)

  if (!Value.Check(schema, params.value)) {
    throw new Error("TypeDescription YAML value is not allowed by rule.allowedTypes")
  }
}
