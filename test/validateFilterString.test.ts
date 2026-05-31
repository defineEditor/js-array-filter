import Filter from "../src/class/filter";
import { ColumnMetadataParsed } from "../src/interfaces/filter";

describe("validateFilterString", () => {
    const columns: ColumnMetadataParsed[] = [
        {
            name: "name",
            dataType: "string",
        },
        {
            name: "trt01p",
            dataType: "string",
        },
        {
            name: "trt01a",
            dataType: "string",
        },
        {
            name: "age",
            dataType: "number",
        },
        {
            name: "score",
            dataType: "number",
        },
        {
            name: "isActive",
            dataType: "boolean",
        },
        {
            name: "race",
            dataType: "string",
        },
    ];

    it("should return true for a valid filter string", () => {
        const filterString = 'name = "John" and age > 30';
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(true);
    });

    it("should return false for an invalid filter string", () => {
        const filterString = 'name = "John" and age > "thirty"';
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(false);
    });

    it("should return true for an empty filter string", () => {
        const filterString = "";
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(true);
    });

    it("should return false for a filter string with an unknown column", () => {
        const filterString = 'unknown = "value"';
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(false);
    });

    it("should return true for a valid filter string with IN clause", () => {
        const filterString = 'RACE in ("WHITE", "BLACKOR AFRICAN AMERICAN")';
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(true);
    });

    it("should return false for an invalid filter string with variable name in incorrect case", () => {
        const filterString = 'RACE in ("WHITE", "BLACKOR AFRICAN AMERICAN")';
        expect(new Filter("parsed", columns, "", { caseInsensitiveColNames: false }).validateFilterString(filterString)).toBe(false);
    });
    it("should return true for an function", () => {
        const filterString = "notMissing(RACE)";
        expect(new Filter("parsed", columns, "", { caseInsensitiveColNames: false }).validateFilterString(filterString)).toBe(false);
    });
    it("should return true for an function in multiple conditions", () => {
        const filterString = "age in (13, 14) and notMissing(RACE) or isActive = true";
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(true);
    });

    it("should return false for a completely incorrect filter string", () => {
        const filterString = "completely incorrect filter string";
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(false);
    });

    it("should return false for an incomplete filter string", () => {
        const filterString = "age eq";
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(false);
    });

    it("should return true for a compareVariable filter string", () => {
        const filterString = "score >= age";
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(true);
    });

    it("should return true for a filter string with parenthesis", () => {
        const filterString = 'name = "John" and (age > 30 or score > 90)';
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(true);
    });

    it("should return true for nested parenthesis with in lists and compareVariable", () => {
        const filterString =
            '((age > 50 or age in (20,30,40) or trt01p != trt01a) and (name in ("John", "Dave") or trt01p = "Placebo"))';
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(true);
    });

    it("should return false when compareVariable types do not match", () => {
        const filterString = "name = age";
        expect(new Filter("parsed", columns, "").validateFilterString(filterString)).toBe(false);
    });
});
