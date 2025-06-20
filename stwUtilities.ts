/**
 * Spin the Web Site miscellanea functions
 * 
 * Language: TypeScript for Deno
 * 
 * MIT License. Copyright (c) 2024 Giancarlo Trevisan
**/

/**
 * Webbase Placeholders Language replaces placeholders in the given text with values from the provided map.
 *
 * - Placeholders are sequences matching: (@{1,3}[a-zA-Z0-9_$.]*[a-zA-Z0-9_]), e.g., @$user, @@email.to, @@@role, @_status_.
 * - Placeholders are replaced with their values from the `placeholders` map, or "" if not found.
 * - Use \@ to escape the @ character.
 * - Square brackets []: If all placeholders inside are empty, remove the brackets and either the first or last word sequence adjacent to them. Brackets are always removed.
 * - Curly brackets {}: If all placeholders inside are empty, remove the brackets and their content. Brackets are always removed.
 * - Square brackets inside curly brackets follow the above rules.
 * - Only innermost square brackets are processed for removal.
 * - Placeholders inside single or double quotes double the quote character in their value.
 * - Placeholders with ... after quoted delimiters are split by comma and quoted individually.
 *
 * @param text Text containing placeholders.
 * @param placeholders Map of placeholder values.
 * @returns Text with placeholders replaced.
 */
export function wbpl(text: string, placeholders: Map<string, string>): string {
    const ESCAPED_AT = "\u0001", EMPTY = "\u0002", VALUED = "\u0003", AFTER = "\u0004", BEFORE = "\u0005";

    // Step 1: Handle escaped @
    let result = text.replace(/\\@/g, ESCAPED_AT);

    // Step 2: Handle quoted placeholders with ellipsis first
    result = result.replace(/(['"])(@{1,3}[a-zA-Z0-9_$.]*[a-zA-Z0-9_])\1\.\.\./g,
        (_, quote, ph) => {
            const val = placeholders.get(ph) ?? "";
            if (!val) return EMPTY;
            return VALUED + val.split(",")
                .map(v => quote + v.replace(new RegExp(quote, "g"), quote + quote) + quote)
                .join(",");
        });

    // Step 3: Handle quoted placeholders
    result = result.replace(/(['"])(@{1,3}[a-zA-Z0-9_$.]*[a-zA-Z0-9_])\1/g,
        (_, quote, ph) => {
            const val = placeholders.get(ph) ?? "";
            if (!val) return EMPTY;
            return VALUED + quote + val.replace(new RegExp(quote, "g"), quote + quote) + quote;
        });

    // Step 4: Mark remaining placeholders
    result = result.replace(/(@{1,3}[a-zA-Z0-9_$.]*[a-zA-Z0-9_])/g, ph =>
        (placeholders.get(ph) ?? "") ? VALUED + placeholders.get(ph)! : EMPTY
    );

    // Step 5: Process brackets and braces
    // Handle innermost square brackets (no nested [ ] inside)
    result = result.replace(/\[([^\[\]]*)\]/g, (match, inner, offset, str) => {
        if (inner.includes(VALUED)) return inner;
        if (str.slice(offset + match.length).match(/^\s*\S+/)) return AFTER;
        if (str.slice(0, offset).match(/\S+\s*$/)) return BEFORE;
        return "";
    });
    result = result.replace(new RegExp(`${AFTER}\\s*\\w+|\\s*\\w+${BEFORE}`, "g"), "");

    // Handle inner most curly brackets (no nested { } inside)
    result = result.replace(/\{([^{}]*)\}/g, (_, inner) => inner.includes(VALUED) ? inner : EMPTY);

    // Step 6: Clean up markers
    result = result
        .replaceAll(VALUED, "")
        .replaceAll(EMPTY, "")
        .replaceAll(AFTER, "")
        .replaceAll(BEFORE, "")
        .replaceAll(ESCAPED_AT, "@");

    return result;
}
