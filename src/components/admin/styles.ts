/** Shared class strings for the admin UI (usable from server and client components). */
export const btn =
  "inline-flex h-9 items-center justify-center gap-2 border px-4 text-2xs font-medium uppercase tracking-wide2 transition-colors disabled:cursor-not-allowed disabled:opacity-40";
export const btnDark = `${btn} border-obsidian bg-obsidian text-ivory hover:bg-[#2a2a2a]`;
export const btnOutline = `${btn} border-obsidian text-obsidian hover:bg-obsidian hover:text-ivory`;
export const btnGhost = `${btn} border-line text-ink-soft hover:border-obsidian hover:text-obsidian`;
export const btnDanger = `${btn} border-[#9B1C1C] text-[#9B1C1C] hover:bg-[#9B1C1C] hover:text-white`;
export const btnLink = "text-xs underline underline-offset-4 hover:text-ink-soft";

export const input =
  "h-10 w-full border border-line bg-white px-3 text-sm text-ink placeholder:text-ink-faint focus:border-obsidian focus:outline-none disabled:bg-ivory";
export const label = "mb-1.5 block text-2xs font-medium uppercase tracking-wide2 text-ink-soft";
export const th = "px-3 py-2 text-left text-2xs font-medium uppercase tracking-wide2 text-ink-faint";
export const td = "px-3 py-3 align-middle";
export const table = "w-full min-w-[640px] border-collapse text-sm";
export const section = "border border-line bg-white";
export const sectionHead = "flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3";
