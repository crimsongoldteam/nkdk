import { registerDataPathOwnerKind } from "~/metadata/validation/dataPath/registry"
import { MetadataDocumentNumeratorRules } from "./rules"

registerDataPathOwnerKind({ kind: "НумераторДокументов", projectDir: "Нумератор", rule: MetadataDocumentNumeratorRules })
