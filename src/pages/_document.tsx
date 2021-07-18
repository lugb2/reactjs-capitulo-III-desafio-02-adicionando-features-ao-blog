import Document, { Html, Head, Main, NextScript } from 'next/document';

export default class MyDocument extends Document {
  componentDidMount () {

      let script = document.createElement("script");
      let anchor = document.getElementById("inject-comments-for-uterances");
      script.setAttribute("src", "https://utteranc.es/client.js");
      script.setAttribute("crossorigin","anonymous");
      script.setAttribute("async", "true");
      script.setAttribute("repo", "reactjs-capitulo-III-desafio-02-adicionando-features-ao-blog");
      script.setAttribute("issue-term", "pathname");
      script.setAttribute( "theme", "github-light");
      anchor.appendChild(script);
  }

  render() {
    return (
        <Html>
            <Head>
                <link rel="preconnect" href="https://fonts.gstatic.com" />
                <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap" rel="stylesheet"></link>
            </Head>
            <body>
                <Main />
                <NextScript />
            </body>
        </Html>
    ); 
  }
}
