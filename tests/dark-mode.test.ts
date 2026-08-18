import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * Dark mode has to work out of the box, and in this kit that is a rule about
 * WHICH colour utilities you may reach for -- not about remembering a `dark:`
 * variant every time.
 *
 * react-fancy's `styles.css` redefines the whole `--color-secondary-*` scale
 * under `:where(.dark)`, flipping it so "900" always means strongest foreground
 * and "50" always means faintest surface. `text-secondary-900` is therefore
 * already correct in both themes with no variant at all. That is the scale to
 * reach for, and it is deliberately absent from the lists below -- most of this
 * package was already on it, which is why only the composer's drop zone broke.
 *
 * `bg-white` is the opposite: a literal with no dark counterpart. On a plain
 * `div` -- which the drop zone is, rather than a kit component that brings its
 * own dark handling -- it stays white while the text over it correctly flips to
 * near-white, and the label vanishes.
 */

/** Surfaces. A frozen surface is always wrong without an explicit `dark:` pair. */
const FROZEN_SURFACE = /\b(bg-white|bg-black|bg-zinc-50|border-zinc-200)\b/g;

/**
 * Foregrounds are only frozen if the surface under them can move. `text-white`
 * on `!bg-brand` is correct in BOTH themes -- the brand background does not
 * flip, so the text over it must not either. Flagging those would push someone
 * to "fix" a working button into unreadable brand-on-brand.
 */
const FROZEN_TEXT = /\b(text-white|text-black)\b/g;
const PAINTS_OWN_SURFACE = /\bbg-(brand|primary-\d|red-\d|green-\d|blue-\d|amber-\d|emerald-\d|violet-\d)/;

function sourceFiles(dir: string): string[] {
    return readdirSync(dir).flatMap((entry) => {
        const path = join(dir, entry);
        if (statSync(path).isDirectory()) return sourceFiles(path);
        return /\.tsx?$/.test(path) ? [path] : [];
    });
}

describe("dark mode", () => {
    it("never freezes a colour that has no dark counterpart", () => {
        const offences: string[] = [];

        for (const file of sourceFiles(join(__dirname, "..", "src"))) {
            readFileSync(file, "utf8")
                .split("\n")
                .forEach((line, i) => {
                    // Paired with an explicit dark: variant on the same element is
                    // the correct shape for a plain div -- only kit components
                    // bring their own.
                    if (line.includes("dark:")) return;

                    const frozen = [
                        ...(line.match(FROZEN_SURFACE) ?? []),
                        ...(PAINTS_OWN_SURFACE.test(line) ? [] : (line.match(FROZEN_TEXT) ?? [])),
                    ];
                    if (frozen.length === 0) return;

                    offences.push(`${file.split(/[\/]/).pop()}:${i + 1}  ${frozen.join(", ")}`);
                });
        }

        expect(offences, `frozen light-only colours:\n  ${offences.join("\n  ")}`).toEqual([]);
    });
});
