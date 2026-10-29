import type { CodeReference, Overview } from "../server/types";

export type TechView = {
  readonly name: string;
  readonly role: string | null;
  readonly concept: string | null;
  readonly references: readonly CodeReference[];
};

export function techViews(overview: Overview): readonly TechView[] {
  if (overview.technologies && overview.technologies.length > 0) return overview.technologies;
  return overview.stack.map((item) => ({
    name: item.name,
    role: item.note,
    concept: null,
    references: item.status === "confirmed" && item.evidence ? [item.evidence] : [],
  }));
}
