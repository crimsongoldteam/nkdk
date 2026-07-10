import { FormTypeByRule } from "../../../orchestration/metadataItem/element"
import { EnterpriseType } from "../../../orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "../../../orchestration/metadataItem/yaml"
import { PictureFieldRules, TablePictureFieldRules } from "./rules"

export type PictureField = FormTypeByRule<typeof PictureFieldRules>
export type TablePictureField = FormTypeByRule<typeof TablePictureFieldRules>

export type PictureFieldPartialYAML = YAMLTypeByRule<typeof PictureFieldRules>
export type TablePictureFieldPartialYAML = YAMLTypeByRule<typeof TablePictureFieldRules>

export interface TablePictureFieldTypedYAML extends TablePictureFieldPartialYAML {
  Тип: "ПолеРисунка"
  ПутьКДанным?: string
}

export type PictureFieldEnterprise = EnterpriseType<typeof PictureFieldRules>
export type TablePictureFieldEnterprise = EnterpriseType<typeof TablePictureFieldRules>
