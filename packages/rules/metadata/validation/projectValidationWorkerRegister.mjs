import { registerHooks } from "node:module"
import { resolve } from "./projectValidationWorkerLoader.mjs"

registerHooks({ resolve })
