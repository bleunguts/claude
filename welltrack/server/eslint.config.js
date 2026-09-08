import baseConfig from "../eslint.config.base.mjs";
import globals from "globals";

export default [
  ...baseConfig,
  {
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
];
