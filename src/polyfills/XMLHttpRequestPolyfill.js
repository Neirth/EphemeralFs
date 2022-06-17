export const loadXMLHttpRequestPolyfill = (filesystem) => {
    XMLHttpRequest.prototype.__open = XMLHttpRequest.prototype.open;

    XMLHttpRequest.prototype.open = function(uri, options) {
        // Deference the weak reference
        const realFilesystem = window.requestVirtualFs();

        // Check if the filesystem is not cleaned reference
        if (uri.startsWith('efs:' + window.location.origin + "/" + realFilesystem.name)) {
            // Get the object reference from filesystem
            
            const domainLength = ('efs:' + window.location.origin + "/" + realFilesystem.name + "/").length;
            const fileObj = realFilesystem.readfile(uri.substring(domainLength));

            if (fileObj) {
                // Pass the real uri to real function
                this.__open(method, fileObj.toURL(), async, user, password);
            } else {
                // Pass a false path to derivate the original function error
                this.__open(method, 'blob:' + window.location.origin + "/unkown_path", async, user, password);
            }
        } else {
            // Restores the real fetch function
            XMLHttpRequest.prototype.open = XMLHttpRequest.prototype.__open;

            // Invokes the real fetch function
            this.__open(method, url, async, user, password);
        }
    }
}