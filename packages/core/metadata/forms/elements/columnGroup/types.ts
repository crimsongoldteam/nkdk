import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import * as SE from "~/metadata/systemEnumerations/types"
import { ColumnGroupRules } from "./rules"

export type ColumnGroup = FormTypeByRule<typeof ColumnGroupRules>

export type ColumnGroupPartialYAML = YAMLTypeByRule<typeof ColumnGroupRules>

export interface ColumnGroupTypedYAML extends Omit<ColumnGroupPartialYAML, "Группировка"> {
  Тип: "ГруппаКолонок"
  Группировка?: SE.ColumnsGroupYAML
}

export type ColumnGroupEnterprise = EnterpriseType<typeof ColumnGroupRules>
