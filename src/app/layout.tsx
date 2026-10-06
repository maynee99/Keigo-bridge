import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Keigo Bridge",
  description:
    "Write Japanese at the right politeness level for whoever you're talking to, or check the tone of a message you've drafted.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full font-sans">{children}</body>
    </html>
  );
}
