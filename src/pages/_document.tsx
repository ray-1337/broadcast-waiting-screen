import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />

      <link rel="preconnect" href="https://cdn.fontshare.com/wf/" crossOrigin={"anonymous"}/>
      <link rel="preconnect" href="https://api.fontshare.com" crossOrigin={"anonymous"}/>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};