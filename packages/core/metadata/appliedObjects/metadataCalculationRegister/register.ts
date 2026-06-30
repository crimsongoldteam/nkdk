import { registerDataPathOwnerKind } from "~/metadata/validation/dataPath/registry"
import { MetadataCalculationRegisterRules } from "./rules"

registerDataPathOwnerKind({
  kind: "РегистрРасчета",
  projectDir: "РегистрРасчета",
  rule: MetadataCalculationRegisterRules,
  typeDescriptionBases: ["CalculationRegisterRecordManager"],
  registerRecordSetBases: ["CalculationRegisterRecordSet"],
  metadataLinkPrefixes: ["CalculationRegister", "РегистрРасчета"],
})
