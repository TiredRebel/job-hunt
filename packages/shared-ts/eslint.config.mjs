/**
 * @module eslint.config
 *
 * Flat ESLint config for the shared TypeScript package: typescript-eslint
 * strict-type-checked + mandatory TSDoc on exports (eslint-plugin-jsdoc),
 * per docs/CODING_STANDARDS.md. Generated OpenAPI types are excluded.
 */
import jsdoc from 'eslint-plugin-jsdoc';
import prettier from 'eslint-config-prettier';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  { ignores: ['dist/**', 'src/generated/**'] },
  ...tseslint.configs.strictTypeChecked,
  jsdoc.configs['flat/recommended-typescript-error'],
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      'jsdoc/check-tag-names': ['error', { definedTags: ['module'] }],
      'jsdoc/require-jsdoc': [
        'error',
        {
          publicOnly: true,
          require: {
            ClassDeclaration: true,
            FunctionDeclaration: true,
            MethodDefinition: true,
          },
          contexts: ['TSInterfaceDeclaration', 'TSTypeAliasDeclaration', 'TSEnumDeclaration'],
        },
      ],
      'jsdoc/require-description': 'error',
      'jsdoc/require-returns': 'off',
      'jsdoc/tag-lines': 'off',
      '@typescript-eslint/no-extraneous-class': 'off',
      '@typescript-eslint/no-unnecessary-condition': 'off',
      '@typescript-eslint/no-unnecessary-type-assertion': 'off',
      '@typescript-eslint/restrict-template-expressions': 'off',
    },
  },
  prettier,
);
