import React from "react"
import { render } from "@testing-library/react"
import TopLayout from "../../src/gatsby-theme-material-ui-top-layout/components/top-layout"
import theme from "../../src/gatsby-theme-material-ui-top-layout/theme"
import { Context as ResponsiveContext } from "react-responsive"
import { createMemorySource, createHistory, LocationProvider } from "@reach/router"

// See more details at: https://testing-library.com/docs/react-testing-library/setup/#custom-render
// https://github.com/styled-components/styled-components/issues/1319#issuecomment-692018195
// https://stackoverflow.com/questions/48503037/cant-get-jest-to-work-with-styled-components-which-contain-theming

const AllTheProviders = ({ children }) => {
  return TopLayout({ children, theme })
}

const ResponsiveAllTheProviders = width => {
  return ({ children }) => {
    return <ResponsiveContext.Provider value={{ width }}>{TopLayout({ children, theme })}</ResponsiveContext.Provider>
  }
}

const customRender = (ui, options, initialPath = "/") => {
  // https://reach.tech/router/api/LocationProvider
  // https://reach.tech/router/api/createMemorySource
  // https://github.com/pbeshai/use-query-params/blob/36872f309beafe27a732f726b84dd7e2a8372355/examples/reach-router/src/App.test.tsx#L17
  let source = createMemorySource(initialPath)
  let history = createHistory(source)

  const wrappedUserInterface = <LocationProvider history={history}>{ui}</LocationProvider>

  if (options && "useWidthReactResponsive" in options) {
    return render(wrappedUserInterface, { wrapper: ResponsiveAllTheProviders(options.useWidthReactResponsive), ...options })
  }

  return render(wrappedUserInterface, { wrapper: AllTheProviders, ...options })
}

// Re-export everything
export * from "@testing-library/react"

// Override render method
export { customRender as render }
