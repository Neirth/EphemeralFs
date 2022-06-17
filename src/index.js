import { MimeType } from "./utils/MimeType.js";
import { loadFetchPolyfill } from "./polyfills/FetchPolyfill.js";
import { loadXMLHttpRequestPolyfill } from "./polyfills/XMLHttpRequestPolyfill.js";
import * as fzstd from 'fzstd';

Blob.prototype.toURL = function () {
    if (this.__uriGenerated === undefined) {
        this.__uriGenerated = URL.createObjectURL(this);
    }

    return this.__uriGenerated;
}

export class FileSystem {
    constructor(name, arrayBuffer) {
        // Read the file container
        this.__name = name;
        this.__inodes = [];
        this.__arrayBuffer = fzstd.decompress(new Uint8Array(arrayBuffer)).buffer;

        // Read all tar entries
        this.__readArchiveEntries();
        console.log(JSON.stringify(this.__inodes))

        // Load polyfills to support custom schema
        loadFetchPolyfill(this);
        loadXMLHttpRequestPolyfill(this);

        window.requestVirtualFs = this;
    }

    get name() {
        return this.__name;
    }

    // Public methods
    fstat(path) {
        return this.__inodes.find(inode => inode.name === path);
    }

    readdir(path) {
        return this.__inodes.filter(inode => {
            const pathSub = inode.name.substring(path.length);
            const sameLevelTest = pathSub.split("/").filter(e => e !== "");

            return (inode.name === path) || (inode.name.startsWith(path) && sameLevelTest.length < 2);
        });
    }

    readfile(path) {
        const inode = this.__inodes.find(inode => inode.name == path);

        if (inode) {
            const name = path.split("/").pop();
            const arrayBuffer = this.__readArchiveFileBinary(inode.header_offset, inode.size);

            return new Blob([arrayBuffer], { type: MimeType.getMimeFromFileName(name) });
        }
    }

    exists(path) {
        return this.__inodes.find(inode => inode.name == path) || false;
    }

    // Private methods
    __readArchiveEntries() {
        let offset = 0;
        let file_size = 0;
        let file_name = "";
        let file_type = null;
        let file_owner = 0;
        let file_group = 0;
        let file_last_modification = 0;
        

        while (offset < this.__arrayBuffer.byteLength - 512) {
            file_name = this.__readArchiveFileName(offset);

            if (file_name.length == 0) {
                break;
            }

            file_type = this.__readArchiveFiletype(offset);
            file_size = this.__readArchiveFileSize(offset);
            file_owner = this.__readArchiveFileOwner(offset);
            file_group = this.__readArchiveFileGroupOwner(offset);
            file_last_modification = this.__readArchiveFileLastModify(offset);

            this.__inodes.push({
                "name": file_name,
                "type": file_type,
                "size": file_size,
                "owner": file_owner,
                "group": file_group,
                "last_modify": file_last_modification,
                "header_offset": offset
            });

            offset += (512 + 512 * Math.trunc(file_size / 512));
            if (file_size % 512) {
                offset += 512;
            }
        }
    }

    __readArchiveFileName(offset) {
        return this.__convertBinaryToText(offset, 100);
    }

    __readArchiveFileSize(offset) {
        let strSize = "";
        const binarySize = new Uint8Array(this.__arrayBuffer, offset + 124, 12);

        for (let i = 0; i < 11; i++) {
            strSize += String.fromCharCode(binarySize[i]);
        }

        return parseInt(strSize, 8);
    }

    __readArchiveFiletype(offset) {
        let binaryType = new Uint8Array(this.__arrayBuffer, offset + 156, 1)
        const strType = String.fromCharCode(binaryType[0]);

        if (strType == "0") {
            return "file";
        } else if (strType == "5") {
            return "directory";
        } else {
            return strType;
        }
    }

    __readArchiveFileLastModify(offset) {
        const binaryType = new Uint8Array(this.__arrayBuffer, offset + 136, 12)
        let lastModify = "";

        for (let i = 0; i < 11; i++) {
            lastModify += String.fromCharCode(binaryType[i]);
        }

        return parseInt(lastModify, 8);
    }

    __readArchiveFileOwner(offset) {
        const binaryOwner = new Uint8Array(this.__arrayBuffer, offset + 108, 8)
        let fileOwner = "";

        for (let i = 0; i < 7; i++) {
            fileOwner += String.fromCharCode(binaryOwner[i]);
        }

        return parseInt(fileOwner, 8);
    }

    __readArchiveFileGroupOwner(offset) {
        const binaryGroup = new Uint8Array(this.__arrayBuffer, offset + 116, 12)
        let groupOwner = "";

        for (let i = 0; i < 7; i++) {
            groupOwner += String.fromCharCode(binaryGroup[i]);
        }

        return parseInt(groupOwner, 8);
    }

    __readArchiveFileBinary(offset, size) {
        return new Uint8Array(this.__arrayBuffer, offset + 512, size);
    }

    __convertBinaryToText(offset, length) {
        let binaryStr = new Uint8Array(this.__arrayBuffer, offset, length);
        let zeroIndexOf = binaryStr.indexOf(0);
        let textDecoder = new TextDecoder();

        return textDecoder.decode(binaryStr.slice(0, zeroIndexOf));
    }
}