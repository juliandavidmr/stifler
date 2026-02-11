import type { DaemonNotification } from '../../types/daemon.ts';

function escapeAppleScript(str: string): string {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, ' ');
}

export async function sendMacOSNotification(notification: DaemonNotification): Promise<void> {
  const script = `display notification "${escapeAppleScript(notification.body)}" with title "${escapeAppleScript(notification.title)}" sound name "default"`;

  const proc = Bun.spawn(['osascript', '-e', script], {
    stdout: 'ignore',
    stderr: 'pipe',
  });

  const exitCode = await proc.exited;
  if (exitCode !== 0) {
    const stderr = await new Response(proc.stderr).text();
    console.error(`[daemon] Notification failed: ${stderr.trim()}`);
  }
}
