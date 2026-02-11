import { createInterface } from 'readline';

export function prompt(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function promptSecret(question: string): Promise<string> {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    // Bun doesn't fully support hiding input, so we do basic prompt
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

export async function promptConfirm(question: string, defaultYes: boolean = false): Promise<boolean> {
  const suffix = defaultYes ? '(S/n)' : '(s/N)';
  const answer = await prompt(`${question} ${suffix}: `);

  if (answer === '') return defaultYes;

  const lower = answer.toLowerCase();
  return lower === 's' || lower === 'si' || lower === 'sí' || lower === 'y' || lower === 'yes';
}
