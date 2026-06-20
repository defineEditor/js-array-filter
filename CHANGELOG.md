# Changelog

## [0.2.2]
### Bug
- Options are not saved when updating a filter using string.

## [0.2.1]
### Bug
- Addressing issues with single and double quote characters inside filtered values.

## [0.2.0]
### Added
- Adding ability to compare with variables.
- Adding condition priority.

## [0.1.6]
### Bug
- Proper handling of upcase connectors.
- Updating dependencies.

## [0.1.5]
### Bug
- Incorrectly parsing string with IN operator and values with commas: VAR IN ("VAL,UE1", "VALUE2").

## [0.1.4]
### Bug
- Type incorrectly identified in filterRow

## [0.1.3]
### Added
- Properly exporting filterRegex

## [0.1.2]
### Added
- Allowing toString to accept BasicFilter argument
- If isFunction is undefined, it is not added to a condition object

## [0.1.1]
### Added
- Minor update

## [0.1.0]
### Added
- Initial Version