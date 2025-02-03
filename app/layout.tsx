import "./globals.css";
import { Inter } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import SessionWrapper from "../components/SessionWrapper/SessionWrapper"; // Import the wrapper

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "AI Chatbot",
  description: "An intelligent chatbot powered by OpenAI and LangChain",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <SessionWrapper>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionWrapper>
      </body>
    </html>
  );
}
