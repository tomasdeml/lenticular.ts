# lenticular.ts
Lenses are functions that provide reusable views into deep data structures. Lenses can be composed to get or set arbitrary data within a deeply-nested, *immutable* data structure.

The novelty of lenticular.ts lies in strongly-typed composition of lenses for deeply-nested views. Instead of hard-coding names of object properties, lenticular.ts allows you to define the view path using a function expression. Because the expression can be checked by the TypeScript compiler, whole class of runtime errors is mitigated beforehand.

Lenticular.ts supports both object and array-typed properties with fallback in case of a null/undefined values in the path.

## Example Usage
```javascript
import { pathFromExpression, lensFromPath } from 'lenticular.ts';

interface IState {
    list: IListState;
}

interface IListState {
    items: IItem[];
}

interface IItem {
    name: string;
    attributes?: string[];
}

const state: IState = {
    list: {
        items: [
            { name: 'First Item Name' },
            { name: 'Second Item Name', attributes: ['Attribute 1', 'Attribute 2'] }
        ]
    }
};

// Create a path for lens from passed expression
const nameOfItemAtIndex = pathFromExpression((s: IState, i) => s.list.items[i].name); 
// Create a lens from the path with variable array indexes being replaced with values from the passed array
const nameOfSecondItem = lensFromPath(nameOfItemAtIndex, [1]); 
// Return 'Second Item Name'
const name = nameOfSecondItem.get(state);
// Return a shallow copy of state with second item having updated name
const newState = nameOfSecondItem.set(state, 'Updated Item Name'); 
// Invoke a callback by passing it ***the current value*** of the expression and using its return value for a set() call
const newState2 = nameOfSecondItem.modify(state, name => name + ' modified'); 
```

See [page.ts](examples/simpleApp/src/page.ts) in sample application for a complete example.

## Expression Format
The path expression should be defined with an function containing a single return expression (currently the expression must be contained in a `function` with a `return` keyword). The expression must start with a reference to the root object and must end with a reference to the property to get/set/modify. The expression can contain variable array indexes (e.g. `[i]`, `[j]` etc.), static indexes (e.g. `1`,`3` etc.). If the expression contains variable array indexes, all their values must be provided when creating a lens from the path in the order that matches declaration of the indexes in function arguments.

### Examples of Supported Expression Formats
```javascript
// Path defined with an arrow function (that must be currently transpiled by TSC to an ordinary function)
const expression1 = (s: IState) => s.list; 
// Path defined with an ordinary function
const expression2 = function(s: IState) { return s.list; }; 
// Will not be checked by TypeScript compiler as there are no type information available
const expression3 = s => s.list; 
// Contains static array index pointing to the first item
const expression4 = (s: IState) => s.list.items[0].name; 
// Contains static array index pointing to a non-existent item in the array - the item will be created during lens.set() invocation
const expression5 = (s: IState) => s.list.items[10].name; 
// Contains two variable array indexes
const expression6 = (s: IState, i, j) => s.list.items[i].attributes[j]; 
// Defines path to non-existent properties that will be initialized during lens.set() invocation
const expression7 = s => s.missingProperty.anotherMissingProperty; 
```

## How To Build 
1. Install gulp globally:
  ```
  npm i gulp -g
  ```
2. Restore npm packages in lenticular.ts:
  ``` 
  npm i
  ```
3. Build lenticular.ts with gulp:
  ```
  gulp
  ```
