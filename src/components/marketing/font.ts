import localFont from "next/font/local";

// Official Inter 4.1, SIL OFL 1.1. Public marketing only.
export const marketingFont = localFont({
  src: "./fonts/InterVariable.woff2", display: "swap", weight: "100 900",
  style: "normal", fallback: ["Arial", "sans-serif"], variable: "--font-marketing"
});
