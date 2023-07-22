import { createTheme } from "@material-ui/core/styles"

export const themeConfiguration = {
  typography: {
    fontFamily: [
      "Montserrat",
      "system-ui",
      "-apple-system",
      "BlinkMacSystemFont",
      "Segoe UI",
      "Roboto",
      "Helvetica Neue",
      "Arial",
      "Noto Sans",
      "sans-serif",
      "Apple Color Emoji",
      "Segoe UI Emoji",
      "Segoe UI Symbol",
      "Noto Color Emoji",
    ].join(","),
  },
  palette: {
    // https://material-ui.com/customization/color/#picking-colors
    // https://material.io/resources/color/#!/?view.left=1&view.right=0&primary.color=26a69a&secondary.color=CFD8DC
    type: "light",
    primary: {
      main: "#26a69a",
    },
    secondary: {
      main: "#cfd8dc",
    },
  },
  spacing: [0, 4, 8, 16, 32, 64],
  breakpoints: {
    values: {
      // https://material-ui.com/customization/breakpoints/
      // Standard: xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920
      xs: 0,
      sm: 400,
      md: 768,
      lg: 998,
      xl: 1280,
    },
  },
}

export default createTheme(themeConfiguration)
