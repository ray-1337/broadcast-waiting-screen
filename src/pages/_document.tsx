import { Html, Head, Main, NextScript } from "next/document";

export default function Document() {
  return (
    <Html lang="en">
      <Head />

      <link rel="preconnect" href="https://cdn.fontshare.com/wf/" crossOrigin={"anonymous"}/>
      <link rel="preconnect" href="https://api.fontshare.com" crossOrigin={"anonymous"}/>

      <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700&f[]=general-sans@300,500&f[]=switzer@400&display=swap" rel="preload" as={"style"}/>
      <link href="https://api.fontshare.com/v2/css?f[]=satoshi@700&f[]=general-sans@300,500&f[]=switzer@400&display=swap" rel="stylesheet"/>

      <link rel="preload" href={"/preview.css"} as={"style"}/>
      <link rel="stylesheet" href={"/preview.css"} as={"style"}/>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
};