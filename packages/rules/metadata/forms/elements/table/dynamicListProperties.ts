import type { ConfigurationContextWithExportToXML } from "@nkdk/runtime"
import type { YAMLPropertySource } from "@nkdk/runtime/rule-kit"
import type { PropertyRule } from "@nkdk/runtime/rule-kit"
import { booleanRule } from "../../../commonObjects/boolean/types"
import { numberRule } from "../../../commonObjects/number/types"
import { systemEnumerationRule } from "../../../systemEnumerations/types"

type CompactScalarRule = PropertyRule & {
  yaml: string
  implicitValueYAML: string | number | boolean
}

function dynamicListTableProperty<const Rule extends CompactScalarRule>(rule: Rule, implicitLabel: string) {
  return {
    ...rule,
    defaultValueXML: rule.implicitValueYAML,
    toXML: isDirectDynamicListTable,
    description:
      `Доступно только для таблицы, чей ПутьКДанным напрямую указывает на реквизит DynamicList. Неявное значение — ${implicitLabel}.`,
  } as const
}

function tableSourceProfile(source: YAMLPropertySource, context?: ConfigurationContextWithExportToXML) {
  const dataPath = source.raw("dataPath")
  const resolved = context?.importFromYAML?.resolveTableSourceProfile?.(dataPath)
  if (resolved !== undefined) return resolved
  if (typeof dataPath !== "string" || dataPath.trim().length === 0) return "rowFilter"
  const directKind = context?.importFromYAML?.formDataPathIndex?.getRoot(dataPath)?.tableSource?.table.kind
  if (directKind === "DynamicList") return "dynamicList"
  if (directKind === "ValueTable" || directKind === "TabularSection" || directKind === "RegisterRecordSet") {
    return "rowFilter"
  }
  return "none"
}

export function isDirectDynamicListTable(
  source: YAMLPropertySource,
  context?: ConfigurationContextWithExportToXML
): boolean {
  return tableSourceProfile(source, context) === "dynamicList"
}

export function hasRowFilterTableSource(
  source: YAMLPropertySource,
  context?: ConfigurationContextWithExportToXML
): boolean {
  return tableSourceProfile(source, context) === "rowFilter"
}

export const dynamicListTableProperties = {
  autoRefresh: dynamicListTableProperty(
    booleanRule({ yaml: "АвтоОбновление", implicitValueYAML: false }),
    "Ложь"
  ),
  restoreCurrentRow: dynamicListTableProperty(
    booleanRule({ yaml: "ВосстанавливатьТекущуюСтроку", implicitValueYAML: false }),
    "Ложь"
  ),
  choiceFoldersAndItems: dynamicListTableProperty(
    systemEnumerationRule({
      yaml: "ВыборГруппИЭлементов",
      typeSE: "FoldersAndItemsUse",
      implicitValueYAML: "Items",
    }),
    "Элементы"
  ),
  updateOnDataChange: dynamicListTableProperty(
    systemEnumerationRule({
      yaml: "ОбновлениеПриИзмененииДанных",
      typeSE: "UpdateOnDataChange",
      implicitValueYAML: "Auto",
    }),
    "Авто"
  ),
  showRoot: dynamicListTableProperty(
    booleanRule({ yaml: "ОтображатьКорень", implicitValueYAML: true }),
    "Истина"
  ),
  autoRefreshPeriod: dynamicListTableProperty(
    numberRule({ yaml: "ПериодАвтоОбновления", implicitValueYAML: 60 }),
    "60"
  ),
  allowRootChoice: dynamicListTableProperty(
    booleanRule({ yaml: "РазрешитьВыборКорня", implicitValueYAML: false }),
    "Ложь"
  ),
  allowGettingCurrentRowURL: dynamicListTableProperty(
    booleanRule({
      yaml: "РазрешитьПолучатьНавигационнуюСсылкуТекущейСтроки",
      implicitValueYAML: true,
    }),
    "Истина"
  ),
} as const
