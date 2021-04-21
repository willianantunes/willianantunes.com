import styled from "styled-components"

export const ToggleTheme = styled.button.attrs(({ active }) => ({
  title: active ? "Change to light mode" : "Change to dark mode",
  role: "button",
  "aria-pressed": active,
}))`
  align-items: center;
  background-color: rgb(45, 45, 45);
  border-radius: 2.4rem;
  cursor: pointer;
  display: inline-flex;
  height: 1.7rem;
  justify-content: space-between;
  padding-left: 2px;
  padding-right: 2px;
  position: relative;
  width: 3.2rem;
  &:focus {
    outline: 0;
  }
  &:before,
  &:after {
    font-size: 18px;
    margin-top: 0.5px;
  }
  &:before {
    content: "🌜";
  }
  &:after {
    content: "🌞";
  }
`

export const ToggleThemeTrack = styled.div`
  --toggleTrack-size: 22px;

  background-color: rgb(241, 241, 241);
  border: 2px solid rgb(24, 120, 136);
  border-radius: 50%;
  height: var(--toggleTrack-size);
  position: absolute;
  top: 1px;
  transition: transform 0.25s ease 0s;
  width: var(--toggleTrack-size);
  z-index: 5;
  .theme-light & {
    transform: translateX(0);
  }
  .theme-dark & {
    transform: translateX(100%);
  }
`
