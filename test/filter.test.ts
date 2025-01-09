import Filter from '../src/index';
import fs from 'fs';
import path from 'path';

const readData = (filePath: string) => {
    const dataFile = fs.readFileSync(path.resolve(__dirname, filePath), 'utf-8');
    const columns = JSON.parse(dataFile.split('\n')[0]).columns.map((column: any) => ({ name: column.name, dataType: column.dataType }));
    const data = dataFile.split('\n').slice(1).filter(line => line !== '').map(line => JSON.parse(line));

    return { columns, data };

};

const filePath = 'data/adsl.ndjson';
const { columns, data } = readData(filePath);

test('Get filtered rows of dataset with simple "and" filter', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'AGE', operator: 'gt', value: 80 },
            { variable: 'SEX', operator: 'eq', value: 'M' }
        ],
        connectors: ['and']
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(31);
    expect(rows).toMatchSnapshot();
});

test('Get filtered rows of dataset with simple "or" filter', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'AGE', operator: 'gt', value: 85 },
            { variable: 'DCDECOD', operator: 'eq', value: 'STUDY TERMINATED BY SPONSOR' }
        ],
        connectors: ['or']
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(24);
});

test('Get filtered rows of dataset with eq operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'DCDECOD', operator: 'eq', value: 'STUDY TERMINATED BY SPONSOR' }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(7);
});

test('Get filtered rows of dataset with contains operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'RACE', operator: 'contains', value: 'WHITE' }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(230);
});

test('Get filtered rows of dataset with contains operator and case insensitive option', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'RACE', operator: 'contains', value: 'bLACK' }
        ],
        connectors: [],
        options: { caseInsensitive: true }
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(23);
});

test('Get filtered rows of dataset with notcontains operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'RACE', operator: 'notcontains', value: 'WHITE' }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(24);
});

test('Get filtered rows of dataset with starts operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'TRT01P', operator: 'starts', value: 'Xanomeline Low' }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(84);
});

test('Get filtered rows of dataset with ends operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'TRT01P', operator: 'ends', value: 'ebo' }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(86);
});

test('Get filtered rows of dataset with regex operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'TRT01P', operator: 'regex', value: '^Xano.*Dose$' }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(168);
});

test('Get filtered rows of dataset with regex operator and case insensitive option', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'TRT01P', operator: 'regex', value: '^pLaCEBO$' }
        ],
        connectors: [],
        options: { caseInsensitive: true }
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(86);
});

test('Get filtered rows of dataset with in operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'USUBJID', operator: 'in', value: ['01-701-1015', '01-702-1082'] }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(2);
});

test('Get filtered rows of dataset with notin operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'DCDECOD', operator: 'notin', value: ['ADVERSE EVENT', 'DEATH', 'COMPLETED'] }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(49);
});

test('Get filtered rows of dataset with in operator and case insensitive option', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'DCDECOD', operator: 'in', value: ['ADVERSE event', 'DeAtH', 'ComplETED'] }
        ],
        connectors: [],
        options: { caseInsensitive: true }
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(205);
});

test('Get filtered rows of dataset with gt operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'AGE', operator: 'gt', value: 80 }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(77);
});

test('Get filtered rows of dataset with lt operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'AGE', operator: 'lt', value: 53 }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(2);
});

test('Get filtered rows of dataset with ge operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'AGE', operator: 'ge', value: 89 }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(1);
});

test('Get filtered rows of dataset with le operator', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'AGE', operator: 'le', value: 51 }
        ],
        connectors: []
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(1);
});

test('Get filtered rows of dataset with all types of operators', async () => {
    const filter = new Filter('dataset-json1.1', columns, {
        conditions: [
            { variable: 'DCDECOD', operator: 'eq', value: 'STUDY TERMINATED BY SPONSOR' },
            { variable: 'RACE', operator: 'contains', value: 'BL' },
            { variable: 'RACE', operator: 'notcontains', value: 'HISP' },
            { variable: 'TRT01P', operator: 'starts', value: 'P' },
            { variable: 'TRT01P', operator: 'ends', value: 'ebo' },
            { variable: 'TRT01P', operator: 'regex', value: '^Xano.*Low.*Dose$' },
            { variable: 'USUBJID', operator: 'in', value: ['01-701-1015', '01-702-1082'] },
            { variable: 'DCDECOD', operator: 'notin', value: ['ADVERSE EVENT', 'DEATH', 'COMPLETED'] },
            { variable: 'AGE', operator: 'in', value: [75, 76] },
            { variable: 'AGE', operator: 'gt', value: 80 },
            { variable: 'AGE', operator: 'lt', value: 55 },
            { variable: 'AGE', operator: 'ge', value: 82 },
            { variable: 'AGE', operator: 'le', value: 60 },
        ],
        connectors: ['or', 'or', 'and', 'or', 'and', 'or', 'or', 'and', 'or', 'and', 'or', 'or']
    });
    const rows = data.filter(row => filter.filterRow(row));
    expect(rows.length).toEqual(75);
    expect(rows).toMatchSnapshot();
});