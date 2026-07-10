import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { MetadataCalculationRegisterRules } from "./rules"
import "./standardMembers"

registerDataPathOwnerKind({
  kind: "РегистрРасчета",
  projectDir: "РегистрРасчета",
  rule: MetadataCalculationRegisterRules,
  typeDescriptionBases: ["CalculationRegisterRecordManager"],
  registerRecordSetBases: ["CalculationRegisterRecordSet"],
  metadataLinkPrefixes: ["CalculationRegister", "РегистрРасчета"],
})
