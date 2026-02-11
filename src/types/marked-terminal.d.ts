declare module "marked-terminal" {
  import type { MarkedExtension } from "marked";
  interface TerminalRendererOptions {
    reflowText?: boolean;
    width?: number;
    [key: string]: unknown;
  }
  export function markedTerminal(
    options?: TerminalRendererOptions,
  ): MarkedExtension;
}
