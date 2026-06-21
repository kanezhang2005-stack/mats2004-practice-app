import "../styles/globals.css";

export const metadata = {
  title: "MATS2004 Practice",
  description: "Randomized MATS2004 tutorial practice questions"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
