import classNames from "classnames";
import type { Metadata } from "next";
import "./globals.css";
import styles from "./layout.module.css";

export const metadata: Metadata = {
  title: "Word Miner",
  description: "For anki word mining",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <div className={classNames(styles.container)}>
          <nav>
            <span>The Word Miner.</span>
            <span>English word miner for Anki deck building</span>
          </nav>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
