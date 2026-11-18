import { BibleTab } from "./BibleTab";

/**
 * Bible for Kids — currently a duplicate of the standard Bible tab.
 * Wrapped separately so it can diverge (kids-friendly fonts, simpler chapters, audio, etc.)
 * without affecting the adult Bible experience.
 */
export function BibleForKidsTab() {
  return (
    <div className="bible-for-kids">
      <BibleTab />
    </div>
  );
}
