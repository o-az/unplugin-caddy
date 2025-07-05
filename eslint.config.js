import antfu from '@antfu/eslint-config'

export default antfu({
  type: 'lib',
  rules: {
    'jsonc/sort-keys': ['off'],
  },
})