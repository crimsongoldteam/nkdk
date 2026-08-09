import { FormTypeByRule } from "../../../ruleRuntime/metadataItem/element"
import { EnterpriseType } from "../../../ruleRuntime/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../ruleRuntime/metadataItem/yaml"
import * as SE from "../../../systemEnumerations/types"
import { ColumnGroupRules } from "./rules"

export type ColumnGroup = FormTypeByRule<typeof ColumnGroupRules>

export type ColumnGroupPartialYAML = YAMLTypeByRule<typeof ColumnGroupRules>

export interface ColumnGroupTypedYAML extends Omit<ColumnGroupPartialYAML, "Группировка"> {
  Тип: "ГруппаКолонок"
  Группировка?: SE.ColumnsGroupYAML
}

export type ColumnGroupEnterprise = EnterpriseType<typeof ColumnGroupRules>
