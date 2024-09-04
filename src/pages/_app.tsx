import { Fragment } from "react";
import type { AppProps } from "next/app";
import Head from "next/head";
import "normalize.css";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <Fragment>
      <Head>
        <meta name="viewport" content="width=device-width, height=device-height, user-scalable=no, shrink-to-fit=no, initial-scale=1.0" />
      </Head>

      <Component {...pageProps} />
    </Fragment>
  );
};