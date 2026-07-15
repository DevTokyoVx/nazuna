// Following http://www.w3.org/TR/css3-selectors/#nth-child-pseudo

// Whitespace as per https://www.w3.org/TR/selectors-3/#lex is " \t\r\n\f"
const whitespace = new Set([9, 10, 12, 13, 32]);
const ZERO = "0".charCodeAt(0);
const NINE = "9".charCodeAt(0);

/**
 * Parses an expression.
 * @param formula CSS nth-formula to parse.
 * @throws {Error} An `Error` if parsing fails.
 * @returns An array containing the integer step size and the integer offset of the nth rule.
 * @example nthCheck.parse("2n+3"); // returns [2, 3]
 */
export function parse(formula: string): [a: number, b: number] {
    formula = formula.trim().toLowerCase();

    switch (formula) {
        case "even": {
            return [2, 0];
        }
        case "odd": {
            return [2, 1];
        }
    }

    // Parse [ ['-'|'+']? INTEGER? {N} [ S* ['-'|'+'] S* INTEGER ]?

    let index = 0;

    let a = 0;
    let sign = readSign();
    let number = readNumber();

    if (index < formula.length && formula.charAt(index) === "n") {
        index++;
        a = sign * (number ?? 1);

        skipWhitespace();

        if (index < formula.length) {
            sign = readSign();
            skipWhitespace();
            number = readNumber();
        } else {
            sign = number = 0;
        }
    }

    // Throw if there is anything else
    if (number === null || index < formula.length) {
        throw new Error(`n-th rule couldn't be parsed ('${formula}')`);
    }

    return [a, sign * number];

    function readSign() {
        switch (formula.charAt(index)) {
            case "-": {
                index++;
                return -1;
            }
            case "+": {
                index++;
                break;
            }
        }

        return 1;
    }

    function readNumber() {
        const start = index;
        let value = 0;

        while (
            index < formula.length &&
            formula.charCodeAt(index) >= ZERO &&
            formula.charCodeAt(index) <= NINE
        ) {
            value = value * 10 + (formula.charCodeAt(index) - ZERO);
            index++;
        }

        // Return `null` if we didn't read anything.
        return index === start ? null : value;
    }

    function skipWhitespace() {
        while (
            index < formula.length &&
            whitespace.has(formula.charCodeAt(index))
        ) {
            index++;
        }
    }
}
