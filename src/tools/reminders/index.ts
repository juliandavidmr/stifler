import { reminderTools, reminderHandlers } from "./reminders.tools.ts";
import { ToolGroup, type ToolGroupDefinition } from "../../types/tools.ts";

export const remindersGroup: ToolGroupDefinition = {
  name: ToolGroup.REMINDERS,
  tools: reminderTools,
  handlers: reminderHandlers,
};
