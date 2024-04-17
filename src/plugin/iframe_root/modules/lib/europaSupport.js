define([
    'constants'
], (
    {EUROPA_LEGACY_PATH}
) => {
    function kbaseUIURL(path, params) {
        // We take the base url from kbase-ui
        const url = new URL(window.parent.location.href);

        // Set the hash, or empty it.
        url.hash = `#${path}`;

        if (params && Object.keys(params).length > 0) {
            const searchParams = new URLSearchParams(params);
            // Use our special notation for params on the hash
            url.hash += `$${searchParams}`;
        }
        return url;
    }

    /**
     * Creates a url to some other kbase user interface; so just a regular
     * url on the current origin.
     *
     * @param {*} param0
     * @returns
     */
    function otherUIURL({hash, pathname, params}) {
        const domain = window.parent.location.hostname.split('.')
            .slice(-3)
            .join('.');

        const url = new URL(window.location.origin);
        url.hostname = domain;

        // We assume that a hash refers back to kbase-ui, so we create a
        // legacy path for europa.
        // TODO: Only if pathname is empty.
        url.pathname = hash ? `${EUROPA_LEGACY_PATH}/${hash}` : pathname || '';

        // So in this case we use a standard search fragment.
        if (params && Object.keys(params).length > 0) {
            for (const [key, value] of Object.entries(params)) {
                url.searchParams.set(key, value);
            }
        }

        return url;
    }

    /**
     * Create a URL for any KBase user interface.
     *
     * Uses specific heuristics for determining how to construct it:
     */
    function europaURL(hashPath, newWindow) {
        if (!newWindow && hashPath.hash) {
            return kbaseUIURL(hashPath.hash, hashPath.params);
        }

        return otherUIURL(hashPath);
    }

    return {kbaseUIURL, otherUIURL, europaURL};
});
