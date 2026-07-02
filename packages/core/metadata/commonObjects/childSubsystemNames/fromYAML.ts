import { registerTypeRule } from "../../orchestration"

registerTypeRule("ChildSubsystemNames", "importFromYAML", (_context, _rule, value) => value)
