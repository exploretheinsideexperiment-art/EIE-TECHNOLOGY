/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-f0c192c2'], (function (workbox) { 'use strict';

  self.addEventListener('message', event => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
      self.skipWaiting();
    }
  });

  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "2ab6c76520b1b95a53f7072050886f6d"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "712286b2a9a9dd0825a9eacb12cb0588"
  }, {
    "url": "pwa-512x512.png",
    "revision": "59d01823505286fb89aa94302f6ab4e8"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c305b6e7a2b828d1341096d7e66c60bb"
  }, {
    "url": "manifest.webmanifest",
    "revision": "5c2b5a27d99a1d6600966f7fd52810c0"
  }, {
    "url": "icon.svg",
    "revision": "b2ba6b3491ed7029a10c7cedaf5f65fa"
  }, {
    "url": "favicon.ico",
    "revision": "a1ab8b510bad578a99f1209a3c9eb4e8"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "470bb0325bfc5d84812c33ba5d4cbdb3"
  }, {
    "url": "assets/manifest-DXHtpyqz.webmanifest",
    "revision": null
  }, {
    "url": "assets/index-DWfYOrKN.css",
    "revision": null
  }, {
    "url": "assets/index-DL6tIy7H.js",
    "revision": null
  }, {
    "url": "assets/icon-CbCejJzc.svg",
    "revision": null
  }, {
    "url": "assets/favicon-BZFB0vks.ico",
    "revision": null
  }, {
    "url": "assets/apple-touch-icon-BMC4DQpo.png",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "470bb0325bfc5d84812c33ba5d4cbdb3"
  }, {
    "url": "favicon.ico",
    "revision": "a1ab8b510bad578a99f1209a3c9eb4e8"
  }, {
    "url": "icon.svg",
    "revision": "b2ba6b3491ed7029a10c7cedaf5f65fa"
  }, {
    "url": "pwa-192x192.png",
    "revision": "c305b6e7a2b828d1341096d7e66c60bb"
  }, {
    "url": "pwa-512x512.png",
    "revision": "59d01823505286fb89aa94302f6ab4e8"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "712286b2a9a9dd0825a9eacb12cb0588"
  }, {
    "url": "manifest.webmanifest",
    "revision": "5c2b5a27d99a1d6600966f7fd52810c0"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));

}));
