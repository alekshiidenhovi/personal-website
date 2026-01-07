/** @type {import("@trivago/prettier-plugin-sort-imports").PrettierConfig} */
const prettierConfig = {
  plugins: ["@trivago/prettier-plugin-sort-imports"],
  trailingComma: "all",
  singleQuote: false,
  semi: true,
  importOrder: ["^[A-Za-z]/(.*)$", "^@ui/(.*)$", "^@(.*)$", "^[./]"],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
};

export default prettierConfig;
