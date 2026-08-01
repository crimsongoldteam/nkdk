import type { ConfigurationContextWithExportToXML } from "../../../context/types"
import type { YAMLPropertySource } from "../../../orchestration/property/fromYAMLToXMLTypes"
import type { PropertyRule } from "../../../orchestration/property/types"
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

export function isDirectDynamicListTable(
  source: YAMLPropertySource,
  context?: ConfigurationContextWithExportToXML
): boolean {
  const dataPath = source.raw("dataPath")
  if (typeof dataPath !== "string") return false
  return context?.importFromYAML?.formDataPathIndex?.getRoot(dataPath)?.tableSource?.table.kind === "DynamicList"
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
