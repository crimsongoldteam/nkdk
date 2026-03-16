import { FormTypeByRule } from "~/metadata/orchestration/metadataItem/element"
import { EnterpriseType } from "~/metadata/orchestration/metadataItem/enterprise"
import { YAMLTypeByRule } from "~/metadata/orchestration/metadataItem/yaml"
import { PictureFieldRules } from "./rules"

export type PictureField = FormTypeByRule<typeof PictureFieldRules>

export type PictureFieldPartialYAML = YAMLTypeByRule<typeof PictureFieldRules>

export interface PictureFieldTypedYAML extends PictureFieldPartialYAML {
  Тип: "ПолеРисунка"
  ПутьКДанным: string
}

export type PictureFieldEnterprise = EnterpriseType<typeof PictureFieldRules>
