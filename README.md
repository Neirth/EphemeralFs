# EpheremalFS

EpheremalFS is a proof of concept to offer an ephemeral file system for web environments.

## Why this project?

This project came out of the thought of being able to do file and directory traversal in a similar way with Javascript's Blob API.

As this standard defines, it only allows loading of binary data, allowing this if working under a new scheme 'blob:'.

This library exploits this potential in combination with other technologies such as Unix's Tar archivers and Facebook's Zsfd compression algorithm.

## Concepts
 * **Chunk**: Information container with a preloaded, read-only file structure
 * **On-fly Descompression**: Ability to obtain information from the compressed chunk to expose it in a URL with the 'blob:' scheme.

## Installation
To use this library, you can install the reference NPM package from this repository and work with it.

I recommend the following reading for help:

[How to install NPM Packages from Github Packages](https://docs.github.com/es/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)

## Example
```javascript
fetch("http://example.com/chunks/chunk-01.tar.zst").then(response => {
    if (response.ok) {
        const arrayBuffer = response.arrayBuffer();

        const fsInstance = new FileSystem("epheremal", arrayBuffer);

        for (const inode of fsInstance.readdir("/")) {
            if (inode.type === "file") {
                const fileInst = fsInstance.readfile(inode.name);

                console.log(URL.createObjectURL(fileInst));
            } else {
                console.log(inode.name);
            }
        }
    }
});
```

## Special Thanks

Thanks to [@ankitrohatgi](https://github.com/ankitrohatgi) and his [tarballjs](https://github.com/ankitrohatgi/tarballjs) repository for inspiring the filesystem mechanism's for this project.

## Contributing
Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

Please make sure to update tests as appropriate.

## License
[MIT](https://choosealicense.com/licenses/mit/)