import Filter from '../src/class/filter';
import { BasicFilter, ColumnMetadataParsed } from '../src/interfaces/filter';

describe('stringToFilter', () => {
    const columns: ColumnMetadataParsed[] = [{
        name: 'name', dataType: 'string',
    }, {
        name: 'age', dataType: 'number',
    }, {
        name: 'isActive', dataType: 'boolean',
    }];

    it('should convert a valid filter string to a filter object', () => {
        const filterString = 'name = "John" and age > 30';
        const expectedFilter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['and'],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle multiple values for "in" operator', () => {
        const filterString = 'age in (25, 30, 35)';
        const expectedFilter: BasicFilter = {
            conditions: [
                { variable: 'age', operator: 'in', value: [25, 30, 35] },
            ],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle boolean values', () => {
        const filterString = 'isActive = True';
        const expectedFilter: BasicFilter = {
            conditions: [{ variable: 'isActive', operator: 'eq', value: true }],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should return an empty filter object for an invalid filter string', () => {
        const filterString = 'invalid filter string';
        const expectedFilter: BasicFilter = { conditions: [], connectors: [] };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle "!=" operator', () => {
        const filterString = 'name != "John"';
        const expectedFilter: BasicFilter = {
            conditions: [{ variable: 'name', operator: 'ne', value: 'John' }],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle "<" operator', () => {
        const filterString = 'age < 30';
        const expectedFilter: BasicFilter = {
            conditions: [{ variable: 'age', operator: 'lt', value: 30 }],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle "<=" operator', () => {
        const filterString = 'age <= 30';
        const expectedFilter: BasicFilter = {
            conditions: [{ variable: 'age', operator: 'le', value: 30 }],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle ">=" operator', () => {
        const filterString = 'age >= 30';
        const expectedFilter: BasicFilter = {
            conditions: [{ variable: 'age', operator: 'ge', value: 30 }],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle "notin" operator', () => {
        const filterString = 'age notin (25, 30, 35)';
        const expectedFilter: BasicFilter = {
            conditions: [
                { variable: 'age', operator: 'notin', value: [25, 30, 35] },
            ],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle "contains" operator', () => {
        const filterString = 'name ? "John"';
        const expectedFilter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'contains', value: 'John' },
            ],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle "notcontains" operator', () => {
        const filterString = 'name !? "John"';
        const expectedFilter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'notcontains', value: 'John' },
            ],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle "starts" operator', () => {
        const filterString = 'name =: "Jo"';
        const expectedFilter: BasicFilter = {
            conditions: [{ variable: 'name', operator: 'starts', value: 'Jo' }],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle "ends" operator', () => {
        const filterString = 'name := "hn"';
        const expectedFilter: BasicFilter = {
            conditions: [{ variable: 'name', operator: 'ends', value: 'hn' }],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle "regex" operator', () => {
        const filterString = 'name =~ "J.*n"';
        const expectedFilter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'regex', value: 'J.*n' },
            ],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle "and" connector', () => {
        const filterString = 'name = "John" and age > 30';
        const expectedFilter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['and'],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle "or" connector', () => {
        const filterString = 'name = "John" or age > 30';
        const expectedFilter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'gt', value: 30 },
            ],
            connectors: ['or'],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle functions', () => {
        const filterString = 'name = "John" or notMissing(age)';
        const expectedFilter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'notMissing', value: null, isFunction: true },
            ],
            connectors: ['or'],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle multiple functions', () => {
        const filterString = 'name = "John" or notMissing(age) and missing(isActive)';
        const expectedFilter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'eq', value: 'John' },
                { variable: 'age', operator: 'notMissing', value: null, isFunction: true },
                { variable: 'isActive', operator: 'missing', value: null, isFunction: true },
            ],
            connectors: ['or', 'and'],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle all operators and various connectors in one string', () => {
        const filterString =
            'name = "John" and age > 30 or age < 50 and isActive = True or name != "Doe" and age in (25, 30) or age notin (40, 45) and name ? "Jo" or name !? "hn" and name =: "Jo" or name := "hn" and name =~ "J.*n"';
        const expectedFilter: BasicFilter = {
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
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle null value', () => {
        const filterString = 'name = null';
        const expectedFilter: BasicFilter = {
            conditions: [{ variable: 'name', operator: 'eq', value: null }],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });

    it('should handle string with multiple values', () => {
        const filterString = 'name in ("John", "Doe", "Smith")';
        const expectedFilter: BasicFilter = {
            conditions: [
                { variable: 'name', operator: 'in', value: ['John', 'Doe', 'Smith'] },
            ],
            connectors: [],
        };
        expect(new Filter('parsed', columns, filterString).toBasicFilter()).toEqual(expectedFilter);
    });
});
