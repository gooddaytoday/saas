const createTheme = jest.fn((options) => ({
  ...options,
  // Add MUI theme properties that would normally be added by createTheme
  mixins: {},
  shadows: [],
  transitions: {},
  zIndex: {},
  shape: { borderRadius: 4 },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 900,
      lg: 1200,
      xl: 1536,
    },
  },
  spacing: jest.fn(),
  components: {},
}));

module.exports = {
  createTheme,
};
