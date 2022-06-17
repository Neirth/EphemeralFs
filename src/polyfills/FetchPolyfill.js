export const loadFetchPolyfill = (filesystem) => {
    window.oldFetch = window.fetch;

    window.fetch = function(uri, options) {
        // Deference the weak reference
        const realFilesystem = window.requestVirtualFs;

        // Check if the filesystem is not cleaned reference
        if (uri.startsWith('efs:' + window.location.origin + "/" + realFilesystem.name)) {
            // Get the object reference from filesystem
            
            const domainLength = ('efs:' + window.location.origin + "/" + realFilesystem.name + "/").length;
            const fileObj = realFilesystem.readfile(uri.substring(domainLength));

            if (fileObj) {
                // Pass the real uri to real function
                return window.oldFetch (fileObj.toURL(), options);
            } else {
                // Pass a false path to derivate the original function error
                return window.oldFetch ('blob:' + window.location.origin + "/unkown_path");
            }
        } else {
            // Restores the real fetch function
            window.fetch = window.oldFetch ;

            // Invokes the real fetch function
            return window.oldFetch(uri, options);
        }
    }
}