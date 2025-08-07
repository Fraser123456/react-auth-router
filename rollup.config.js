import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import babel from "@rollup/plugin-babel";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import { terser } from "rollup-plugin-terser";

export default [
  {
    input: "src/index.js",
    output: [
      {
        file: "dist/index.js",
        format: "cjs",
        sourcemap: true,
      },
      {
        file: "dist/index.esm.js",
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(),
      resolve({
        browser: true,
        preferBuiltins: false,
      }),
      commonjs(),
      babel({
        babelHelpers: "bundled",
        exclude: "node_modules/**",
        presets: [
          ["@babel/preset-env", { modules: false }],
          ["@babel/preset-react", { runtime: "automatic" }],
        ],
      }),
      terser(),
    ],
    external: ["react", "react-dom", "lucide-react"],
  },
];
