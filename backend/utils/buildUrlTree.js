function buildUrlTree(urls) {
  const tree = {};

  urls.forEach((fullUrl) => {
    try {
      const url = new URL(fullUrl);

      // remove domain, split path
      const parts = url.pathname
        .split("/")
        .filter(Boolean); // remove empty

      let current = tree;

      parts.forEach((part, index) => {
        if (!current[part]) {
          current[part] = {
            __children: {},
            __urls: [],
          };
        }

        // last segment → push URL
        if (index === parts.length - 1) {
          current[part].__urls.push(fullUrl);
        }

        current = current[part].__children;
      });
    } catch (e) {
      // ignore bad urls
    }
  });

  return tree;
}

module.exports = buildUrlTree;