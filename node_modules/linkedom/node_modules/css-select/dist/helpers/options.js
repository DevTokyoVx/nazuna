/**
 * Create a copy of options, omitting `context` and `rootFunc`.
 *
 * This is used when compiling nested selectors (e.g. inside `:is`, `:not`,
 * `:nth-child(… of S)`) so that the parent compilation state doesn't leak.
 */
export function copyOptions(options) {
    // Omit context and rootFunc so parent compilation state doesn't leak.
    const { context: _, rootFunc: __, ...copied } = options;
    return copied;
}
//# sourceMappingURL=options.js.map