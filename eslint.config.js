import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  rules: {
    'no-console': ['off'],
    'jsonc/sort-keys': ['off'],
    'style/max-statements-per-line': ['off'],
  },
})
