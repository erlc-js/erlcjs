export default function NotFound() {
  return (
    <section class="not-found">
      <Head>
        <title>Page not found — erlc.js</title>
        <meta name="description" content="The page you requested does not exist. Browse the erlc.js documentation instead." />
      </Head>
      <div class="not-found-code">404</div>
      <h1>Nothing here.</h1>
      <p>The page you requested does not exist. The docs are a good place to start.</p>
      <a class="btn btn-primary" href="/docs/">Go to the docs</a>
    </section>
  );
}
