import {
  createMetadataExecutionRegistrySets,
  enterMetadataExecutionRegistrySets,
} from "../metadata/composition/metadataExecutionContext"
import { metadataRules } from "../metadata/composition/metadataRules"
import { beforeAll, beforeEach } from "vitest"

let registries = createMetadataExecutionRegistrySets(metadataRules)
enterMetadataExecutionRegistrySets(registries)

beforeAll(() => {
  registries = createMetadataExecutionRegistrySets(metadataRules)
  enterMetadataExecutionRegistrySets(registries)
})
beforeEach(() => enterMetadataExecutionRegistrySets(registries))
