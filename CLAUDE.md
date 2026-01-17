- # Error Type
Console Error

## Error Message
A tree hydrated but some attributes of the server rendered HTML didn't match the client properties. This won't be patched up. This can happen if a SSR-ed Client Component used:

- A server/client branch `if (typeof window !== 'undefined')`.
- Variable input such as `Date.now()` or `Math.random()` which changes each time it's called.
- Date formatting in a user's locale which doesn't match the server.
- External changing data without sending a snapshot of it along with the HTML.
- Invalid HTML tag nesting.

It can also happen if the client has a browser extension installed which messes with the HTML before React loaded.

https://react.dev/link/hydration-mismatch

  ...
    <HotReload assetPrefix="" globalError={[...]}>
      <AppDevOverlayErrorBoundary globalError={[...]}>
        <ReplaySsrOnlyErrors>
        <DevRootHTTPAccessFallbackBoundary>
          <HTTPAccessFallbackBoundary notFound={<NotAllowedRootHTTPFallbackError>}>
            <HTTPAccessFallbackErrorBoundary pathname="/places-to..." notFound={<NotAllowedRootHTTPFallbackError>} ...>
              <RedirectBoundary>
                <RedirectErrorBoundary router={{...}}>
                  <Head headCacheNode={{lazyData:null, ...}}>
                    <__next_viewport_boundary__>
                    <MetadataTree>
                      <__next_metadata_boundary__>
                        <__next_metadata_boundary__>
                          <div
                            hidden={true}
-                           bis_skin_checked="1"
                          >
                  ...
                    <RedirectBoundary>
                      <RedirectErrorBoundary router={{...}}>
                        <InnerLayoutRouter url="/places-to..." tree={[...]} cacheNode={{lazyData:null, ...}} ...>
                          <SegmentViewNode type="page" pagePath="places-to-...">
                            <SegmentTrieNode>
                            <CuisinePage>
                              <script>
                              <div
                                className="min-h-screen bg-gray-50"
-                               bis_skin_checked="1"
                              >
                                <section className="bg-gradien...">
                                  <div
                                    className="container mx-auto px-4"
-                                   bis_skin_checked="1"
                                  >
                                    <div
                                      className="max-w-3xl"
-                                     bis_skin_checked="1"
                                    >
                                <section className="container ...">
                                  <div
                                    className="mb-6 flex items-center justify-between"
-                                   bis_skin_checked="1"
                                  >
                                  <div
                                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
-                                   bis_skin_checked="1"
                                  >
                                    <RestaurantCard>
                                      <LinkComponent href="/places-to..." className="group bloc...">
                                        <a className="group bloc..." ref={function} onClick={function onClick} ...>
                                          <div
                                            className="relative h-48 bg-gray-200 overflow-hidden"
-                                           bis_skin_checked="1"
                                          >
                                            <div
                                              className="w-full h-full flex items-center justify-center bg-gradient-to..."
-                                             bis_skin_checked="1"
                                            >
                                          <div
                                            className="p-4"
-                                           bis_skin_checked="1"
                                          >
                                            <h3>
                                            <div
                                              className="mt-1 flex flex-wrap gap-1"
-                                             bis_skin_checked="1"
                                            >
                                            <p>
                                            <div
                                              className="mt-3 flex items-center justify-between text-sm text-gray-500"
-                          [Pasted text #1 +268 lines][Pasted text #2 +142 lines]