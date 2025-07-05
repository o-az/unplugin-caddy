import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  rules: {
    'func-style': ['off'],
    'no-console': ['off'],
    'jsonc/sort-keys': ['off'],
    'style/max-statements-per-line': ['off'],
  },
})
