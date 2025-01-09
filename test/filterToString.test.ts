import Filter from '../src/class/filter';
import { BasicFilter, ColumnMetadataDatasetJson, ItemTypeDatasetJson } from '../src/interfaces/filter';

describe('filterToString', () => {
    it('should convert a filter object to a filter string', () => {
        const filter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['and'],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: typeof condition.value === 'string' ? 'string' : 'integer' as ItemTypeDatasetJson
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'name = "John" and age > 30';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle multiple values for "in" operator', () => {
        const filter: BasicFilter = {
            conditions: [
                { variable: 'age', operator: 'in', value: [25, 30, 35] },
            ],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'integer'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'age in (25, 30, 35)';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle boolean values', () => {
        const filter: BasicFilter = {
            conditions: [{ variable: 'isActive', operator: 'eq', value: true }],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'boolean'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'isActive = true';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should return an empty string for an empty filter object', () => {
        const filter: BasicFilter = { conditions: [], connectors: [] };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: typeof condition.value
        })) as ColumnMetadataDatasetJson[];
        const expectedString = '';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle "!=" operator', () => {
        const filter: BasicFilter = {
            conditions: [{ variable: 'name', operator: 'ne', value: 'John' }],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'string'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'name != "John"';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle "<" operator', () => {
        const filter: BasicFilter = {
            conditions: [{ variable: 'age', operator: 'lt', value: 30 }],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'integer'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'age < 30';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle "<=" operator', () => {
        const filter: BasicFilter = {
            conditions: [{ variable: 'age', operator: 'le', value: 30 }],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'integer'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'age <= 30';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle ">=" operator', () => {
        const filter: BasicFilter = {
            conditions: [{ variable: 'age', operator: 'ge', value: 30 }],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'integer'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'age >= 30';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle "notin" operator', () => {
        const filter: BasicFilter = {
            conditions: [
                { variable: 'age', operator: 'notin', value: [25, 30, 35] },
            ],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'integer'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'age notin (25, 30, 35)';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle "contains" operator', () => {
        const filter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'contains', value: 'John' },
            ],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'string'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'name ? "John"';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle "notcontains" operator', () => {
        const filter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'notcontains', value: 'John' },
            ],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'string'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'name !? "John"';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle "starts" operator', () => {
        const filter: BasicFilter = {
            conditions: [{ variable: 'name', operator: 'starts', value: 'Jo' }],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'string'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'name =: "Jo"';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle "ends" operator', () => {
        const filter: BasicFilter = {
            conditions: [{ variable: 'name', operator: 'ends', value: 'hn' }],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'string'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'name := "hn"';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle "regex" operator', () => {
        const filter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'regex', value: 'J.*n' },
            ],
            connectors: [],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: 'string'
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'name =~ "J.*n"';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle "and" connector', () => {
        const filter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['and'],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: typeof condition.value === 'string' ? 'string' : 'integer' as ItemTypeDatasetJson
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'name = "John" and age > 30';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle "or" connector', () => {
        const filter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['or'],
        };
        const columns = filter.conditions.map(condition => ({
            name: condition.variable,
            dataType: typeof condition.value === 'string' ? 'string' : 'integer' as ItemTypeDatasetJson
        })) as ColumnMetadataDatasetJson[];
        const expectedString = 'name = "John" or age > 30';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });

    it('should handle all operators and various connectors in one string', () => {
        const filter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
                { variable: 'age', operator: 'lt', value: 50 },
                { variable: 'isActive', operator: 'eq', value: true },
                { variable: 'name', operator: 'ne', value: 'Doe' },
                { variable: 'age', operator: 'in', value: [25, 30] },
                { variable: 'age', operator: 'notin', value: [40, 45] },
                { variable: 'name', operator: 'contains', value: 'Jo' },
                { variable: 'name', operator: 'notcontains', value: 'hn' },
                { variable: 'name', operator: 'starts', value: 'Jo' },
                { variable: 'name', operator: 'ends', value: 'hn' },
                { variable: 'name', operator: 'regex', value: 'J.*n' },
            ],
            connectors: [
                'and',
                'or',
                'and',
                'or',
                'and',
                'or',
                'and',
                'or',
                'and',
                'or',
                'and',
            ],
        };
        const columns = filter.conditions.map(condition => {
            // Determine datatype
            let dataType: ItemTypeDatasetJson;

            if (typeof condition.value === 'string') {
                dataType = 'string';
            } else if (typeof condition.value === 'number') {
                dataType = 'integer';
            } else if (Array.isArray(condition.value) && typeof condition.value[0] === 'string') {
                dataType = 'string';
            } else if (Array.isArray(condition.value) && typeof condition.value[0] === 'number') {
                dataType = 'integer';
            } else {
                dataType = 'boolean';
            }


            return {
                name: condition.variable,
                dataType
            };
        }) as ColumnMetadataDatasetJson[];
        const expectedString =
            'name = "John" and age > 30 or age < 50 and isActive = true or name != "Doe" and age in (25, 30) or age notin (40, 45) and name ? "Jo" or name !? "hn" and name =: "Jo" or name := "hn" and name =~ "J.*n"';
        expect(new Filter('dataset-json1.1', columns, filter).toString()).toBe(expectedString);
    });
});
