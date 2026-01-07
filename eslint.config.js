const js = require("@eslint/js");
const prettierConfig = require("eslint-config-prettier");
const globals = require("globals");

module.exports = [
  js.configs.recommended,
  prettierConfig,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...globals.browser,
        ...globals.node,
        gsap: "readonly",
        ScrollTrigger: "readonly",
        CustomEase: "readonly",
        CSSRulePlugin: "readonly",
        CinematicZoom: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn",
      "no-undef": "warn",
      "no-console": "off"
    },
    ignores: [".git/", "node_modules/"]
  }
];
