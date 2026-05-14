import { registerTypeRule } from "~/metadata/orchestration"

registerTypeRule("ChildSubsystemNames", "importFromYAML", (_context, _rule, value) => value)
