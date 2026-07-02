import { registerDataPathOwnerKind } from "../../validation/dataPath/registry"
import { MetadataAccumulationRegisterRules } from "./rules"

registerDataPathOwnerKind({
  kind: "РегистрНакопления",
  projectDir: "РегистрНакопления",
  rule: MetadataAccumulationRegisterRules,
  typeDescriptionBases: ["AccumulationRegisterRecordManager"],
  registerRecordSetBases: ["AccumulationRegisterRecordSet"],
  metadataLinkPrefixes: ["AccumulationRegister", "РегистрНакопления"],
})
