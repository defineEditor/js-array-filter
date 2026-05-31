const { performance } = require("perf_hooks");
const FilterModule = require("../dist/index.js");

const Filter = FilterModule.default || FilterModule;

const iterations = 10_000_000;

const columns = [
    { name: "age", dataType: "number" },
    { name: "name", dataType: "string" },
    { name: "trt01p", dataType: "string" },
    { name: "isActive", dataType: "boolean" },
];

const benchmarkCases = [
    {
        name: "numeric eq",
        filter: {
            conditions: [{ variable: "age", operator: "eq", value: 55 }],
            connectors: [],
        },
        rows: [
            [55, "John", "Placebo", true],
            [42, "Dave", "Drug", false],
        ],
    },
    {
        name: "numeric range and",
        filter: {
            conditions: [
                { variable: "age", operator: "gt", value: 50 },
                { variable: "age", operator: "lt", value: 70 },
            ],
            connectors: ["and"],
        },
        rows: [
            [55, "John", "Placebo", true],
            [75, "Dave", "Drug", false],
        ],
    },
    {
        name: "string contains ci",
        filter: {
            conditions: [{ variable: "trt01p", operator: "contains", value: "place" }],
            connectors: [],
            options: { caseInsensitive: true },
        },
        rows: [
            [55, "John", "Placebo", true],
            [42, "Dave", "Drug", false],
        ],
    },
    {
        name: "string regex",
        filter: {
            conditions: [{ variable: "name", operator: "regex", value: "^(John|Dave)$" }],
            connectors: [],
        },
        rows: [
            [55, "John", "Placebo", true],
            [42, "Alice", "Drug", false],
        ],
    },
    {
        name: "numeric in",
        filter: {
            conditions: [{ variable: "age", operator: "in", value: [20, 30, 40, 55] }],
            connectors: [],
        },
        rows: [
            [55, "John", "Placebo", true],
            [42, "Dave", "Drug", false],
        ],
    },
    {
        name: "boolean eq",
        filter: {
            conditions: [{ variable: "isActive", operator: "eq", value: true }],
            connectors: [],
        },
        rows: [
            [55, "John", "Placebo", true],
            [42, "Dave", "Drug", false],
        ],
    },
    {
        name: "mixed and or",
        filter: {
            conditions: [
                { variable: "age", operator: "gt", value: 50 },
                { variable: "name", operator: "in", value: ["John", "Dave"] },
                { variable: "trt01p", operator: "eq", value: "Placebo" },
            ],
            connectors: ["or", "and"],
        },
        rows: [
            [55, "John", "Placebo", true],
            [42, "Alice", "Drug", false],
            [45, "Dave", "Placebo", false],
        ],
    },
    {
        name: "conditions priority",
        filter: {
            conditions: [
                { variable: "age", operator: "gt", value: 50 },
                { variable: "name", operator: "in", value: ["John", "Dave"] },
                { variable: "trt01p", operator: "eq", value: "Placebo" },
                { variable: "age", operator: "gt", value: 30 },
                { variable: "name", operator: "notin", value: ["John", "Dave"] },
                { variable: "isActive", operator: "ne", value: true },
            ],
            connectors: ["and", "and", "or", "and", "or"],
            connectorPriorities: [1, 1, 0, 1, 2],
        },
        rows: [
            [55, "John", "Placebo", true],
            [42, "Alice", "Drug", false],
            [45, "Dave", "Placebo", false],
        ],
    },
];

const runCase = ({ name, filter, rows }) => {
    const instance = new Filter("parsed", columns, filter);
    let matches = 0;

    for (let index = 0; index < 10_000; index += 1) {
        if (instance.filterRow(rows[index % rows.length])) {
            matches += 1;
        }
    }

    matches = 0;
    const startedAt = performance.now();

    for (let index = 0; index < iterations; index += 1) {
        if (instance.filterRow(rows[index % rows.length])) {
            matches += 1;
        }
    }

    const durationMs = performance.now() - startedAt;

    return {
        benchmark: name,
        iterations,
        matches,
        totalMs: durationMs.toFixed(2),
        perCallUs: ((durationMs * 1000) / iterations).toFixed(3),
        opsPerSec: Math.round((iterations * 1000) / durationMs),
    };
};

const results = benchmarkCases.map(runCase);

console.log("filterRow benchmark results");
console.table(results);
