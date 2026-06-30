import { registerDataPathOwnerKind } from "~/metadata/validation/dataPath/registry"
import { MetadataFilterCriterionRules } from "./rules"

registerDataPathOwnerKind({ kind: "КритерийОтбора", projectDir: "КритерийОтбора", rule: MetadataFilterCriterionRules })
