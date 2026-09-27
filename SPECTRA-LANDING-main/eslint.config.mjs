import nextCoreWebVitals from 'eslint-config-next/core-web-vitals'
import nextTypescript from 'eslint-config-next/typescript'

const eslintConfig = [
  {
    ignores: [
      '**/.next/**',
      '**/node_modules/**',
      '**/next-env.d.ts',
      '**/*.tsbuildinfo',
      '**/*.log',
    ],
  },
  ...nextCoreWebVitals,
  ...nextTypescript,
  {
    rules: {
      // Page copy uses straight apostrophes inside JSX text.
      'react/no-unescaped-entities': 'off',
    },
  },
]

export default eslintConfig
