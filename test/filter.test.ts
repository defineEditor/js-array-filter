import Filter from "../src/index";
import fs from "fs";
import path from "path";
import { Connector, StringOperator, ColumnFormat, ColumnMetadata } from "../src/interfaces/filter";

const readData = (filePath: string) => {
    const dataFile = fs.readFileSync(path.resolve(__dirname, filePath), "utf-8");
    const columns = JSON.parse(dataFile.split("\n")[0]).columns.map((column: any) => ({
        name: column.name,
        dataType: column.dataType,
    })) as ColumnMetadata[];
    const data = dataFile
        .split("\n")
        .slice(1)
        .filter((line) => line !== "")
        .map((line) => JSON.parse(line));

    return { columns, data };
};

const filePath = "data/adsl.ndjson";
const { columns, data } = readData(filePath);

test('Get filtered rows of dataset with simple "and" filter', async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [
            { variable: "AGE", operator: "gt", value: 80 },
            { variable: "SEX", operator: "eq", value: "M" },
        ],
        connectors: ["and"],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(31);
    expect(rows).toMatchSnapshot();
});

test('Get filtered rows of dataset with simple "or" filter', async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [
            { variable: "AGE", operator: "gt", value: 85 },
            { variable: "DCDECOD", operator: "eq", value: "STUDY TERMINATED BY SPONSOR" },
        ],
        connectors: ["or"],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(24);
});

test("Get filtered rows of dataset with eq operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "DCDECOD", operator: "eq", value: "STUDY TERMINATED BY SPONSOR" }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(7);
});

test("Get filtered rows of dataset with contains operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "RACE", operator: "contains", value: "WHITE" }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(230);
});

test("Get filtered rows of dataset with contains operator and case insensitive option", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "RACE", operator: "contains", value: "bLACK" }],
        connectors: [],
        options: { caseInsensitive: true },
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(23);
});

test("Get filtered rows of dataset with notcontains operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "RACE", operator: "notcontains", value: "WHITE" }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(24);
});

test("Get filtered rows of dataset with starts operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "TRT01P", operator: "starts", value: "Xanomeline Low" }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(84);
});

test("Get filtered rows of dataset with ends operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "TRT01P", operator: "ends", value: "ebo" }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(86);
});

test("Get filtered rows of dataset with regex operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "TRT01P", operator: "regex", value: "^Xano.*Dose$" }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(168);
});

test("Get filtered rows of dataset with regex operator and case insensitive option", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "TRT01P", operator: "regex", value: "^pLaCEBO$" }],
        connectors: [],
        options: { caseInsensitive: true },
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(86);
});

test("Get filtered rows of dataset with in operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "USUBJID", operator: "in", value: ["01-701-1015", "01-702-1082"] }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(2);
});

test("Get filtered rows of dataset with notin operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "DCDECOD", operator: "notin", value: ["ADVERSE EVENT", "DEATH", "COMPLETED"] }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(49);
});

test("Get filtered rows of dataset with in operator and case insensitive option", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "DCDECOD", operator: "in", value: ["ADVERSE event", "DeAtH", "ComplETED"] }],
        connectors: [],
        options: { caseInsensitive: true },
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(205);
});

test("Get filtered rows of dataset with gt operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "AGE", operator: "gt", value: 80 }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(77);
});

test("Get filtered rows of dataset with lt operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "AGE", operator: "lt", value: 53 }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(2);
});

test("Get filtered rows of dataset with ge operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "AGE", operator: "ge", value: 89 }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(1);
});

test("Get filtered rows of dataset with le operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "AGE", operator: "le", value: 51 }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(1);
});

test("Get filtered rows of dataset with all types of operators", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [
            { variable: "DCDECOD", operator: "eq", value: "STUDY TERMINATED BY SPONSOR" },
            { variable: "RACE", operator: "contains", value: "BL" },
            { variable: "RACE", operator: "notcontains", value: "HISP" },
            { variable: "TRT01P", operator: "starts", value: "P" },
            { variable: "TRT01P", operator: "ends", value: "ebo" },
            { variable: "TRT01P", operator: "regex", value: "^Xano.*Low.*Dose$" },
            { variable: "USUBJID", operator: "in", value: ["01-701-1015", "01-702-1082"] },
            { variable: "DCDECOD", operator: "notin", value: ["ADVERSE EVENT", "DEATH", "COMPLETED"] },
            { variable: "AGE", operator: "in", value: [75, 76] },
            { variable: "AGE", operator: "gt", value: 80 },
            { variable: "AGE", operator: "lt", value: 55 },
            { variable: "AGE", operator: "ge", value: 82 },
            { variable: "AGE", operator: "le", value: 60 },
        ],
        connectors: ["or", "or", "and", "or", "and", "or", "or", "and", "or", "and", "or", "or"],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(75);
    expect(rows).toMatchSnapshot();
});

test("Get missing values for numeric variables", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "BMIBL", operator: "missing", value: null, isFunction: true }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(1);
});

test("Get not missing values for numeric variables", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [
            { variable: "WEIGHTBL", operator: "notMissing", value: null, isFunction: true },
            { variable: "BMIBL", operator: "notMissing", value: null, isFunction: true },
        ],
        connectors: ["or"],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(253);
});

test("Get not missing values for character variables", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [
            { variable: "DISCONFL", operator: "notMissing", value: null, isFunction: true },
            { variable: "DSRAEFL", operator: "notMissing", value: null, isFunction: true },
        ],
        connectors: ["and"],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(92);
});

test("Get filtered dataset", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "AGE", operator: "gt", value: 80 }],
        connectors: [],
    });
    const filteredData = filter.filterDataframe(data);
    expect(filteredData.length).toEqual(77);
});

test("Filter with gt and le filtered dataset with numeric var", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [
            { variable: "AGE", operator: "le", value: 80 },
            { variable: "AGE", operator: "gt", value: 70 },
        ],
        connectors: ["and"],
    });
    const filteredData = filter.filterDataframe(data);
    expect(filteredData.length).toEqual(112);
});

test("Filter with gt and le filtered dataset with character var", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [
            { variable: "TRTSDT", operator: "le", value: "2014-08-05" },
            { variable: "TRTSDT", operator: "gt", value: "2013-08-05" },
        ],
        connectors: ["and"],
    });
    const filteredData = filter.filterDataframe(data);
    expect(filteredData.length).toEqual(107);
});

test('Filter with variable dataType: "incorrect" in columns should throw an error', async () => {
    const incorrectColumns = [...columns, { name: "INCORRECT", dataType: "incorrect" }] as ColumnMetadata[];
    expect(
        () =>
            new Filter("dataset-json1.1", incorrectColumns, {
                conditions: [{ variable: "INCORRECT", operator: "eq", value: "test" }],
                connectors: [],
            }),
    ).toThrow("Unknown variable type incorrect for variable INCORRECT");
});

test('Filter with dataTypeFormat: "mp3" should throw an error', async () => {
    expect(
        () =>
            new Filter("mp3" as ColumnFormat, columns, {
                conditions: [{ variable: "AGE", operator: "gt", value: 80 }],
                connectors: [],
            }),
    ).toThrow("Unknown column format mp3, supported formats are: json, xpt, parsed");
});

test("Filter update method", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "AGE", operator: "gt", value: 80 }],
        connectors: [],
    });
    filter.update({
        conditions: [{ variable: "SEX", operator: "eq", value: "F" }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(143);
});

test("Filter compares one variable to another", async () => {
    const filter = new Filter(
        "parsed",
        [
            { name: "left", dataType: "number" },
            { name: "right", dataType: "number" },
        ],
        {
            conditions: [{ variable: "left", operator: "gt", value: null, compareVariable: "right" }],
            connectors: [],
        },
    );

    expect(filter.filterRow([5, 3])).toBe(true);
    expect(filter.filterRow([2, 4])).toBe(false);
});

test("Filter uses connectorPriorities during evaluation", async () => {
    const prioritizedFilter = new Filter(
        "parsed",
        [
            { name: "a", dataType: "boolean" },
            { name: "b", dataType: "boolean" },
            { name: "c", dataType: "boolean" },
        ],
        {
            conditions: [
                { variable: "a", operator: "eq", value: true },
                { variable: "b", operator: "eq", value: true },
                { variable: "c", operator: "eq", value: true },
            ],
            connectors: ["or", "and"],
            connectorPriorities: [0, 1],
        },
    );
    const defaultFilter = new Filter(
        "parsed",
        [
            { name: "a", dataType: "boolean" },
            { name: "b", dataType: "boolean" },
            { name: "c", dataType: "boolean" },
        ],
        {
            conditions: [
                { variable: "a", operator: "eq", value: true },
                { variable: "b", operator: "eq", value: true },
                { variable: "c", operator: "eq", value: true },
            ],
            connectors: ["or", "and"],
        },
    );

    expect(prioritizedFilter.filterRow([true, false, false])).toBe(true);
    expect(defaultFilter.filterRow([true, false, false])).toBe(false);
});

test("Filter handles nested priorities with in lists and compareVariable", async () => {
    const filter = new Filter(
        "parsed",
        [
            { name: "age", dataType: "number" },
            { name: "trt01p", dataType: "string" },
            { name: "trt01a", dataType: "string" },
            { name: "name", dataType: "string" },
        ],
        '((age > 50 or age in (20,30,40) or trt01p != trt01a) and (name in ("John", "Dave") or trt01p = "Placebo"))',
    );

    expect(filter.filterRow([55, "Drug", "Drug", "John"])).toBe(true);
    expect(filter.filterRow([20, "Drug", "Drug", "Alice"])).toBe(false);
    expect(filter.filterRow([45, "Placebo", "Drug", "Alice"])).toBe(true);
    expect(filter.toBasicFilter()).toEqual({
        conditions: [
            { variable: "age", operator: "gt", value: 50 },
            { variable: "age", operator: "in", value: [20, 30, 40] },
            { variable: "trt01p", operator: "ne", value: null, compareVariable: "trt01a" },
            { variable: "name", operator: "in", value: ["John", "Dave"] },
            { variable: "trt01p", operator: "eq", value: "Placebo" },
        ],
        connectors: ["or", "or", "and", "or"],
        connectorPriorities: [1, 1, 0, 1],
        options: undefined,
    });
});

test("Filter toBasicFilter preserves connectorPriorities", async () => {
    const filter = new Filter(
        "parsed",
        [
            { name: "a", dataType: "boolean" },
            { name: "b", dataType: "boolean" },
            { name: "c", dataType: "boolean" },
        ],
        "a = true or (b = true and c = true)",
    );

    expect(filter.toBasicFilter()).toEqual({
        conditions: [
            { variable: "a", operator: "eq", value: true },
            { variable: "b", operator: "eq", value: true },
            { variable: "c", operator: "eq", value: true },
        ],
        connectors: ["or", "and"],
        connectorPriorities: [0, 1],
        options: undefined,
    });
});

test("Filter rejects compareVariable when value is not null", async () => {
    expect(
        () =>
            new Filter(
                "parsed",
                [
                    { name: "left", dataType: "number" },
                    { name: "right", dataType: "number" },
                ],
                {
                    conditions: [{ variable: "left", operator: "gt", value: 1, compareVariable: "right" }],
                    connectors: [],
                },
            ),
    ).toThrow("Condition value must be null when compareVariable is specified");
});

test("Filter rejects mismatched connector priorities length", async () => {
    expect(
        () =>
            new Filter(
                "parsed",
                [
                    { name: "a", dataType: "boolean" },
                    { name: "b", dataType: "boolean" },
                ],
                {
                    conditions: [
                        { variable: "a", operator: "eq", value: true },
                        { variable: "b", operator: "eq", value: true },
                    ],
                    connectors: ["and"],
                    connectorPriorities: [],
                },
            ),
    ).toThrow("Number of connector priorities must be equal to the number of connectors");
});

test("Filter returns true for an empty expression tree", async () => {
    const filter = new Filter("parsed", [{ name: "a", dataType: "boolean" }], { conditions: [], connectors: [] });
    expect(filter.filterRow([true])).toBe(true);
});

test("Filter update handles string filters and replacement columns", async () => {
    const filter = new Filter(
        "parsed",
        [{ name: "name", dataType: "string" }],
        { conditions: [{ variable: "name", operator: "eq", value: "John" }], connectors: [] },
        { caseInsensitiveColNames: false },
    );

    filter.update('label = "Jane"', [{ name: "label", dataType: "string" }], { caseInsensitiveColNames: false });

    expect(filter.filterRow(["Jane"])).toBe(true);
    expect(filter.filterRow(["JOHN"])).toBe(false);
});

test("Filter stores null compareVariable indices for non-compare conditions", async () => {
    const filter = new Filter(
        "parsed",
        [
            { name: "left", dataType: "number" },
            { name: "right", dataType: "number" },
        ],
        {
            conditions: [
                { variable: "left", operator: "gt", value: null, compareVariable: "right" },
                { variable: "left", operator: "eq", value: 5 },
            ],
            connectors: ["and"],
        },
    );

    expect((filter as any).parsedFilter.compareVariableIndeces).toEqual([1, null]);
});

test("Filter compares string variables case-insensitively", async () => {
    const filter = new Filter(
        "parsed",
        [
            { name: "left", dataType: "string" },
            { name: "right", dataType: "string" },
        ],
        {
            conditions: [{ variable: "left", operator: "eq", value: null, compareVariable: "right" }],
            connectors: [],
            options: { caseInsensitive: true },
        },
    );

    expect(filter.filterRow(["Alpha", "alpha"])).toBe(true);
});

test("Filter toString accepts an override filter", async () => {
    const filter = new Filter(
        "parsed",
        [
            { name: "name", dataType: "string" },
            { name: "age", dataType: "number" },
            { name: "score", dataType: "number" },
        ],
        {
            conditions: [{ variable: "name", operator: "eq", value: "John" }],
            connectors: [],
        },
    );

    expect(
        filter.toString({
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

test('Filter with dataTypeFormat: "xpt"', async () => {
    const xptColumns = columns.map((col) => ({
        ...col,
        dataType: col.dataType === "string" ? "Char" : "Num",
    })) as unknown as ColumnMetadata[];
    const filter = new Filter("xpt", xptColumns, {
        conditions: [{ variable: "AGE", operator: "gt", value: 80 }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(77);
});

test("Filter with invalid xpt variable type should throw an error", async () => {
    expect(
        () =>
            new Filter("xpt", [{ name: "BAD", dataType: "Bad" } as unknown as ColumnMetadata], {
                conditions: [{ variable: "BAD", operator: "eq", value: "x" }],
                connectors: [],
            }),
    ).toThrow("Unknown variable type Bad for variable BAD");
});

test("Filter with caseInsensitive = false", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "RACE", operator: "contains", value: "bLACK" }],
        connectors: [],
        options: { caseInsensitive: false },
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(0);
});

test("Filter with non-existing variable in columns should throw an error", async () => {
    expect(
        () =>
            new Filter("dataset-json1.1", columns, {
                conditions: [{ variable: "NON_EXISTING", operator: "eq", value: "test" }],
                connectors: [],
            }),
    ).toThrow("Variable NON_EXISTING not found");
});

test("Filter with missing compareVariable should throw an error", async () => {
    expect(
        () =>
            new Filter("parsed", [{ name: "left", dataType: "number" }], {
                conditions: [{ variable: "left", operator: "gt", value: null, compareVariable: "right" }],
                connectors: [],
            }),
    ).toThrow("Variable right not found");
});

test("Filter with mismatched compareVariable type should throw an error", async () => {
    expect(
        () =>
            new Filter(
                "parsed",
                [
                    { name: "left", dataType: "number" },
                    { name: "right", dataType: "string" },
                ],
                {
                    conditions: [{ variable: "left", operator: "gt", value: null, compareVariable: "right" }],
                    connectors: [],
                },
            ),
    ).toThrow("Variable right type does not match left");
});

test("Filter with incorrect number of logical connectors should throw an error", async () => {
    expect(
        () =>
            new Filter("dataset-json1.1", columns, {
                conditions: [
                    { variable: "AGE", operator: "gt", value: 80 },
                    { variable: "SEX", operator: "eq", value: "M" },
                ],
                connectors: [],
            }),
    ).toThrow("Number of logical connectors must be equal to the number of conditions minus one");
});

test("Filter with ne operator", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "SEX", operator: "ne", value: "M" }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(143);
});

test("Filter with unknown operator should throw an error", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [{ variable: "AGE", operator: "unknownOperator" as StringOperator, value: 80 }],
        connectors: [],
    });
    expect(() => filter.filterDataframe(data)).toThrow("Unknown operator unknownOperator");
});

test("Filter with unknown string operator should throw an error", async () => {
    const filter = new Filter("parsed", [{ name: "value", dataType: "string" }], {
        conditions: [{ variable: "value", operator: "unknownOperator" as StringOperator, value: "x" }],
        connectors: [],
    });

    expect(() => filter.filterRow(["x"])).toThrow("Unknown operator unknownOperator");
});

test("Filter handles string lt and ge operators", async () => {
    const filterLt = new Filter("parsed", [{ name: "value", dataType: "string" }], {
        conditions: [{ variable: "value", operator: "lt", value: "m" }],
        connectors: [],
    });
    const filterGe = new Filter("parsed", [{ name: "value", dataType: "string" }], {
        conditions: [{ variable: "value", operator: "ge", value: "m" }],
        connectors: [],
    });

    expect(filterLt.filterRow(["a"])).toBe(true);
    expect(filterLt.filterRow(["z"])).toBe(false);
    expect(filterGe.filterRow(["z"])).toBe(true);
    expect(filterGe.filterRow(["a"])).toBe(false);
});

test("Filter throws for unsupported boolean comparison operators", async () => {
    const filter = new Filter("parsed", [{ name: "flag", dataType: "boolean" }], {
        conditions: [{ variable: "flag", operator: "gt", value: true }],
        connectors: [],
    });

    expect(() => filter.filterRow([true])).toThrow("Unknown operator gt for type boolean");
});

test("Filter with unknown connector should throw an error", async () => {
    const filter = new Filter("dataset-json1.1", columns, {
        conditions: [
            { variable: "AGE", operator: "gt", value: 80 },
            { variable: "SEX", operator: "eq", value: "M" },
        ],
        connectors: ["orMaybe" as Connector],
    });
    expect(() => filter.filterDataframe(data)).toThrow("Unknown connector orMaybe");
});
