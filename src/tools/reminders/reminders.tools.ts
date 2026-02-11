import { addReminder, listPendingReminders, removeReminder } from "../../daemon/reminders/manager.ts";
import { scheduleReminder } from "../../daemon/reminders/scheduler.ts";
import type { ToolDefinition, ToolHandler } from "../../types/tools.ts";

const reminderCreate: ToolHandler = async (input) => {
  const content = input.content as string;
  const when = input.when as string;

  const reminder = addReminder(content, when);
  if (!reminder) {
    return {
      success: false,
      output: `Could not parse time: "${when}". Supported formats: 5min, 2h, tomorrow 3pm, monday 9am, every day 9am, 2024-12-25 10am`,
    };
  }

  scheduleReminder(reminder.id, reminder.remindAt, reminder.content);
  const dateStr = new Date(reminder.remindAt).toLocaleString();
  const recurrent = reminder.cronPattern ? " (recurrent)" : "";
  return {
    success: true,
    output: `Reminder created (${reminder.id.substring(0, 8)}...) for ${dateStr}${recurrent}: "${content}"`,
  };
};

const reminderList: ToolHandler = async () => {
  const reminders = listPendingReminders();
  if (reminders.length === 0) {
    return { success: true, output: "No pending reminders." };
  }

  const formatted = reminders.map((r) => {
    const date = new Date(r.remindAt).toLocaleString();
    const recurrent = r.cronPattern ? " (recurrent)" : "";
    return `(${r.id.substring(0, 8)}...) ${r.content} → ${date}${recurrent}`;
  });
  return { success: true, output: formatted.join("\n") };
};

const reminderDelete: ToolHandler = async (input) => {
  const id = input.id as string;
  const deleted = removeReminder(id);
  if (!deleted) {
    return { success: false, output: `Reminder with ID '${id}' not found.` };
  }
  return { success: true, output: `Reminder ${id} deleted.` };
};

export const reminderTools: ToolDefinition[] = [
  {
    name: "reminder_create",
    description:
      "Create a reminder that will send a macOS notification at the specified time. Supports relative times (5min, 2h), specific times (tomorrow 3pm, monday 9am), dates (2024-12-25 10am), and recurrent patterns (every day 9am, every monday 2pm).",
    input_schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The reminder text to display in the notification",
        },
        when: {
          type: "string",
          description:
            "When to fire the reminder. Examples: 5min, 2h, tomorrow 3pm, monday 9am, every day 9am",
        },
      },
      required: ["content", "when"],
    },
  },
  {
    name: "reminder_list",
    description: "List all pending (unfired) reminders",
    input_schema: {
      type: "object",
      properties: {},
    },
  },
  {
    name: "reminder_delete",
    description: "Delete a reminder by its ID",
    input_schema: {
      type: "object",
      properties: {
        id: {
          type: "string",
          description: "The ID of the reminder to delete",
        },
      },
      required: ["id"],
    },
  },
];

export const reminderHandlers: Record<string, ToolHandler> = {
  reminder_create: reminderCreate,
  reminder_list: reminderList,
  reminder_delete: reminderDelete,
};
