# Regression tests

Run `node --test tests/*.test.js` from the repository root. These use Node's
built-in test runner and require no additional dependencies.

`dom.test.js` checks that cached Back/Forward navigation preserves initialized
sections and that actual page disposal runs their cleanup once. Browser checks
must also use `playwright-cli` and confirm `pageshow.persisted === true`; a fresh
page load does not exercise the cached restoration path.
