import {
    buildExpressionTree,
    conditionToString,
    filterExpressionToString,
    parseConditionString,
    parseFilterString,
} from "../src/utils/filterExpression";
import { BasicFilter, ColumnMetadataParsed } from "../src/interfaces/filter";
import stringToFilter from "../src/utils/stringToFilter";
import Filter from "../src/class/filter";

describe("filterExpression", () => {
    const columns: ColumnMetadataParsed[] = [
        { name: "name", dataType: "string" },
        { name: "alias", dataType: "string" },
        { name: "age", dataType: "number" },
        { name: "score", dataType: "number" },
        { name: "enabled", dataType: "boolean" },
    ];

    it("parses conditions with single-quoted string arrays", () => {
        expect(parseConditionString("name in ('John, Doe', 'Jane')", columns, true)).toEqual({
            variable: "name",
            operator: "in",
            value: ["John, Doe", "Jane"],
        });
    });

    it("parses empty arrays in parsed strings", () => {
        expect(parseConditionString("score in ()", columns, true)).toEqual({
            variable: "score",
            operator: "in",
            value: [],
        });
        expect(parseConditionString("name in ()", columns, true)).toEqual({
            variable: "name",
            operator: "in",
            value: [],
        });
    });

    it("parses case-sensitive function conditions", () => {
        expect(parseConditionString("missing(age)", columns, false)).toEqual({
            variable: "age",
            operator: "missing",
            value: null,
            isFunction: true,
        });
    });

    it("throws for invalid literals and mismatched compareVariable types", () => {
        expect(() => parseConditionString("age = nope", columns, true)).toThrow("Invalid numeric value nope");
        expect(() => parseConditionString("score in (1, nope)", columns, true)).toThrow("Invalid numeric value nope");
        expect(() => parseConditionString("enabled = maybe", columns, true)).toThrow("Invalid boolean value maybe");
        expect(() => parseConditionString("name = age", columns, true)).toThrow("type does not match");
        expect(() => parseConditionString("name = value", columns, true)).toThrow("Invalid string value value");
    });

    it("throws for invalid string array items", () => {
        expect(() => parseConditionString('name in ("John", age)', columns, true)).toThrow("Invalid string value age");
    });

    it("parses nested parenthesis and normalizes redundant outer parenthesis", () => {
        expect(parseFilterString('((name = "John" and age > 30) or score > 90)', columns, true)).toEqual({
            conditions: [
                { variable: "name", operator: "eq", value: "John" },
                { variable: "age", operator: "gt", value: 30 },
                { variable: "score", operator: "gt", value: 90 },
            ],
            connectors: ["and", "or"],
            connectorPriorities: [1, 0],
        });
        expect(parseFilterString("name in ('John, Doe', 'Jane') and enabled = true", columns, true)).toEqual({
            conditions: [
                { variable: "name", operator: "in", value: ["John, Doe", "Jane"] },
                { variable: "enabled", operator: "eq", value: true },
            ],
            connectors: ["and"],
        });
    });

    it("throws for malformed expressions", () => {
        expect(() => parseFilterString('(name = "John"', columns, true)).toThrow("Missing closing parenthesis");
        expect(() => parseFilterString('name = "John" xor age > 1', columns, true)).toThrow("Invalid condition");
        expect(() => parseFilterString('name = "John" and', columns, true)).toThrow("Unexpected end of filter string");
        expect(() => parseFilterString("()", columns, true)).toThrow("Expected condition");
        expect(() => parseFilterString('name = "John")', columns, true)).toThrow("Unexpected token near )");
        expect(() => parseFilterString('(name = "John") trailing', columns, true)).toThrow("Unexpected token near trailing");
        expect(() => parseFilterString('name = "John" age > 1', columns, true)).toThrow("Invalid condition");
    });

    it("builds expression trees and validates malformed flat filters", () => {
        const filter: BasicFilter = {
            conditions: [
                { variable: "name", operator: "eq", value: "John" },
                { variable: "age", operator: "gt", value: 30 },
                { variable: "score", operator: "gt", value: 90 },
            ],
            connectors: ["and", "or"],
            connectorPriorities: [0, 1],
        };

        expect(buildExpressionTree({ conditions: [], connectors: [] })).toBeNull();
        expect(buildExpressionTree(filter)).toMatchObject({
            type: "connector",
            connector: "and",
            right: { type: "connector", connector: "or" },
        });
        expect(() => buildExpressionTree({ conditions: filter.conditions, connectors: ["and"] })).toThrow(
            "Number of logical connectors",
        );
        expect(() => buildExpressionTree({ ...filter, connectorPriorities: [0] })).toThrow("Number of connector priorities");
    });

    it("serializes conditions and expressions directly", () => {
        expect(conditionToString({ variable: "score", operator: "in", value: [1, 2] })).toBe("score in (1, 2)");
        expect(conditionToString({ variable: "name", operator: "eq", value: null, compareVariable: "alias" })).toBe("name = alias");
        expect(conditionToString({ variable: "name", operator: "custom" as any, value: "John" })).toBe('name custom "John"');
        expect(conditionToString({ variable: "age", operator: "missing", value: null, isFunction: true })).toBe("missing(age)");
        expect(filterExpressionToString({ conditions: [], connectors: [] })).toBe("");
        expect(
            filterExpressionToString({
                conditions: [
                    { variable: "name", operator: "eq", value: "John" },
                    { variable: "age", operator: "gt", value: 30 },
                    { variable: "score", operator: "gt", value: 90 },
                ],
                connectors: ["and", "or"],
                connectorPriorities: [0, 1],
            }),
        ).toBe('name = "John" and (age > 30 or score > 90)');
    });

    it("exercises wrapper helpers directly", () => {
        expect(stringToFilter("broken filter", columns, true)).toEqual({ conditions: [], connectors: [] });
        expect(stringToFilter('name = "John"', columns)).toEqual({
            conditions: [{ variable: "name", operator: "eq", value: "John" }],
            connectors: [],
        });
        const validateFilterCaseSens = new Filter("parsed", columns, "", { caseInsensitiveColNames: false });
        const validateFilterCaseInsens = new Filter("parsed", columns, "");
        expect(validateFilterCaseInsens.validateFilterString('NAMe = "John"')).toBe(true);
        expect(validateFilterCaseSens.validateFilterString('name = "John"')).toBe(true);
        expect(validateFilterCaseSens.validateFilterString('nAMe = "John"')).toBe(false);
        expect(validateFilterCaseInsens.validateFilterString("broken filter")).toBe(false);
    });
});
