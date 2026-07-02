import { registerTypeRule } from "../../orchestration"

registerTypeRule("ChildSubsystemNames", "exportToYAML", (_context, _rule, value) => value)
