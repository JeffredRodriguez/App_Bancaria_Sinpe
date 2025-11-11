module.exports = {
  root: true,
  extends: ['universe/native'],
  ignorePatterns: ['node_modules/', 'dist/', 'build/'],
  rules: {
    'react/react-in-jsx-scope': 'off'
  }
};
