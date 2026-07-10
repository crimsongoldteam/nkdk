import { registerDataPathOwnerKind, registerVirtualOwnerFieldResolver } from "../../validation/dataPath/registry"
import { MetadataInformationRegisterRules } from "./rules"
import "./standardMembers"

registerDataPathOwnerKind({
  kind: "РегистрСведений",
  projectDir: "РегистрСведений",
  rule: MetadataInformationRegisterRules,
  typeDescriptionBases: ["InformationRegisterRecordManager"],
  registerRecordSetBases: ["InformationRegisterRecordSet"],
  metadataLinkPrefixes: ["InformationRegister", "РегистрСведений"],
})

registerVirtualOwnerFieldResolver(({ owner, segment }) => {
  if (owner.ref.kind !== "РегистрСведений") return undefined
  if (segment !== "ОбластьДанныхВспомогательныеДанные") return undefined
  return {
    name: segment,
    typeInfo: { kinds: ["scalar"], nextTypes: [], sourceText: "InformationRegister.DataArea" },
  }
})
