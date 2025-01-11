# js-array-filter
*js-array-filter* is a TypeScript library for filtering arrays based on conditions. It provides functionalities to define filters and apply them to arrays of data.

## Features
* Define filters with multiple conditions and connectors
* Apply filters to arrays of data
* Support for various data types and operators

## Installation
Install the library using npm:

```sh
npm install js-array-filter
```

## Usage
### Creating a Filter instance
```TypeScript
import Filter from 'js-array-filter';

const columns = [
    { name: 'AGE', dataType: 'number' },
    { name: 'SEX', dataType: 'string' }
];

const filter = new Filter('parsed', columns, {
    conditions: [
        { variable: 'AGE', operator: 'gt', value: 80 },
        { variable: 'SEX', operator: 'eq', value: 'M' }
    ],
    connectors: ['and']
});
```

### Creating a Filter instance from a string
```TypeScript
import Filter from 'js-array-filter';

const columns = [
    { name: 'AGE', dataType: 'number' },
    { name: 'SEX', dataType: 'string' }
];

const filterString = "AGE gt 80 and SEX eq 'M'";
const filter = new Filter('parsed', columns, filterString);
```

### Applying the Filter
```TypeScript
const data = [
    [85, 'M'],
    [70, 'F'],
    [90, 'M']
];

const filteredData = data.filter(row => filter.filterRow(row));
console.log(filteredData); // Output: [[85, 'M'], [90, 'M']]
```

### Applying the Filter to a Dataframe
```TypeScript
const data = [
    [85, 'M'],
    [70, 'F'],
    [90, 'M']
];

const filteredData = filter.filterDataframe(data);
console.log(filteredData); // Output: [[85, 'M'], [90, 'M']]
```

### Updating the Filter
```TypeScript
filter.update({
    conditions: [
        { variable: 'AGE', operator: 'lt', value: 75 }
    ],
    connectors: []
});

const newFilteredData = data.filter(row => filter.filterRow(row));
console.log(newFilteredData); // Output: [[70, 'F']]
```

### Converting Filter to String
```TypeScript
const filterString = filter.toString();
console.log(filterString);
```

### Validating Filter String
```TypeScript
const isValid = filter.validateFilterString(filterString);
console.log(isValid); // Output: true or false
```

## Operators

### String Operators
- `lt`: Less than
- `le`: Less than or equal to
- `gt`: Greater than
- `ge`: Greater than or equal to
- `in`: In array
- `notin`: Not in array
- `eq`: Equal to
- `ne`: Not equal to
- `starts`: Starts with
- `ends`: Ends with
- `contains`: Contains
- `notcontains`: Does not contain
- `regex`: Matches regular expression
- `notMissing`: Not missing (not null or empty)
- `missing`: Missing (null or empty)

### Number Operators
- `lt`: Less than
- `le`: Less than or equal to
- `gt`: Greater than
- `ge`: Greater than or equal to
- `in`: In array
- `notin`: Not in array
- `eq`: Equal to
- `ne`: Not equal to
- `notMissing`: Not missing (not null or empty)
- `missing`: Missing (null or empty)

### Boolean Operators
- `eq`: Equal to
- `ne`: Not equal to
- `notMissing`: Not missing (not null or empty)
- `missing`: Missing (null or empty)

## Methods

### `update`
Updates the filter with new filter and columns.

#### Parameters
- `filter` (BasicFilter | string): The new filter object or filter string.
- `columns` (ColumnMetadata[], optional): The new column metadata.

### `filterRow`
Applies the filter to a single row of data.

#### Parameters
- `row` (ItemDataArray): The row of data to filter.

#### Returns
- `boolean`: True if the row passes the filter, false otherwise.

### `filterDataframe`
Applies the filter to a dataframe (array of rows).

#### Parameters
- `data` (ItemDataArray[]): The dataframe to filter.

#### Returns
- `ItemDataArray[]`: The filtered dataframe.

### `toString`
Converts the filter to a string representation.

#### Returns
- `string`: The string representation of the filter.

### `validateFilterString`
Validates a filter string.

#### Parameters
- `filterString` (string): The filter string to validate.

#### Returns
- `boolean`: True if the filter string is valid, false otherwise.

----

## Running Tests
Run the tests using Jest:
```sh
npm test
```

## License
This project is licensed under the MIT License. See the LICENSE file for details.

## Author
Dmitry Kolosov

## Contributing
Open an issue or submit a pull request for any improvements or bug fixes.

For more details, refer to the source code and the documentation.