import { register } from "node:module"

register(new URL("./projectValidationWorkerLoader.mjs", import.meta.url))
