import "./globals.css";
import ClientLayout from "./client-layout";
// import { SpeedInsights } from "@vercel/speed-insights/next"


export const metadata = {
  title: "VIDE",
  description: "https://neomscientific.com/",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-white text-black dark:bg-gray-900 dark:text-white transition-colors duration-300">
            <ClientLayout>{children}</ClientLayout>
            {/* <SpeedInsights/> */}
      </body>
    </html>
  );
}
