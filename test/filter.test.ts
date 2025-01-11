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
            })
    ).toThrow("Unknown variable type incorrect for variable INCORRECT");
});

test('Filter with dataTypeFormat: "mp3" should throw an error', async () => {
    expect(
        () =>
            new Filter("mp3" as ColumnFormat, columns, {
                conditions: [{ variable: "AGE", operator: "gt", value: 80 }],
                connectors: [],
            })
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

test('Filter with dataTypeFormat: "xpt"', async () => {
    const xptColumns = columns.map((col) => ({ ...col, dataType: col.dataType === "string" ? "Char" : "Num" })) as unknown as ColumnMetadata[];
    const filter = new Filter("xpt", xptColumns, {
        conditions: [{ variable: "AGE", operator: "gt", value: 80 }],
        connectors: [],
    });
    const rows = data.filter((row) => filter.filterRow(row));
    expect(rows.length).toEqual(77);
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
            })
    ).toThrow("Variable NON_EXISTING not found");
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
            })
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
