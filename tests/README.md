## Running the tests

### 1. Setting up the Configuration (`config.js`) file
Before running the tests, you have to create your own `config.js` file in the `/tests` folder. The sample format is provided in the `config-example.js` file. Modify the `config-example.js` file and simply replace the Application key with your own and save it as `config.js`.

### 2. Running the tests
To run the all tests, simply invoke this command line:

```
grunt test
```

Ensure that all `devDependencies` have been installed in your `node_modules` folder before running the tests.

## List of Tests

### Test `Constants`
Tests if the list of constants are defined correctly.