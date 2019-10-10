import App, {
  Container,
  AppProps
} from 'next/app'

import { css, Global } from '@emotion/core';

import styled from '@emotion/styled';

const Holder = styled.div`
  padding: 1.5rem;
  font-family: sans-serif;
  font-size: 1rem;
`

export default class TheApp extends App {
  static async getInitialProps ({ Component, router, ctx }) {
    ctx.apiHost = process.env.API_HOST

    let pageProps = {}

    if (Component.getInitialProps) {
      pageProps = await Component.getInitialProps(ctx)
    }

    pageProps.apiHost = process.env.API_HOST

    const initialNow = Date.now()

    return { pageProps, initialNow }
  }

  render() {
    const {
      Component,
      pageProps
    } = this.props

    return (
      <Container>
          <Global
                styles={css`
                    /* http://meyerweb.com/eric/tools/css/reset/ 
                        v2.0 | 20110126
                        License: none (public domain)
                    */
                    
                    html, body, div, span, applet, object, iframe,
                    h1, h2, h3, h4, h5, h6, p, blockquote, pre,
                    a, abbr, acronym, address, big, cite, code,
                    del, dfn, em, img, ins, kbd, q, s, samp,
                    small, strike, strong, sub, sup, tt, var,
                    b, u, i, center,
                    dl, dt, dd, ol, ul, li,
                    fieldset, form, label, legend,
                    table, caption, tbody, tfoot, thead, tr, th, td,
                    article, aside, canvas, details, embed, 
                    figure, figcaption, footer, header, hgroup, 
                    menu, nav, output, ruby, section, summary,
                    time, mark, audio, video {
                        margin: 0;
                        padding: 0;
                        border: 0;
                        font-size: 100%;
                        font: inherit;
                        vertical-align: baseline;
                    }
                    /* HTML5 display-role reset for older browsers */
                    article, aside, details, figcaption, figure, 
                    footer, header, hgroup, menu, nav, section {
                        display: block;
                    }
                    body {
                        line-height: 1;
                    }
                    ol, ul {
                        list-style: none;
                    }
                    blockquote, q {
                        quotes: none;
                    }
                    blockquote:before, blockquote:after,
                    q:before, q:after {
                        content: '';
                        content: none;
                    }
                    table {
                        border-collapse: collapse;
                        border-spacing: 0;
                    }
                `}
            />
          <Holder>
            <Component {...pageProps} />
          </Holder>
        </Container>
    )
  }
}
