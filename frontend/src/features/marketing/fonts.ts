import { Newsreader } from "next/font/google";

/**
 * Display serif for marketing headlines only. Loaded from the landing layout, so the dashboard never
 * downloads it. The optical-size axis lets the browser draw large headlines with display-cut details.
 */
export const fontDisplay = Newsreader({
  subsets: ["latin"],
  axes: ["opsz"],
  variable: "--font-display",
  display: "swap",
});
