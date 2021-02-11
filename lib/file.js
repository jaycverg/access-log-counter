const es = require('event-stream');
const log = require('fancy-log');
const { createReadStream, existsSync, readdirSync, statSync, } = require('fs');
const { extname, resolve: resolvePath } = require('upath');

const getExtension = path => {
    const match = /\.[a-z]+\.(br|gz)$/.exec(path);
    if (match !== null) {
        return match[0];
    }

    let ext = extname(path);

    if (!ext) {
        ext = 'N/A';
    }

    if (/^\.html?/.test(ext)) {
        ext = '.html';
    }

    if (/^\.\bdo/.test(ext)) {
        ext = '.do';
    }

    return ext;
};

const getFileList = (folder, options) => {
    let list = [];

    readdirSync(folder).forEach(path => {
        if (options.limit > 0 && options.i >= options.limit) {
            return;
        }

        path = resolvePath(folder, path);
        if (path.match(/\.gz$/)) {
            const newPath = path.replace(/\.gz$/, '');

            if (!existsSync(newPath)) {
                log.warn(`Unpack ${path} to make it readable.`);
                return;
            } else {
                path = newPath;
            }
        }

        options.i++;
        // log(options.i, path);

        const stat = statSync(path);
        if (stat.isDirectory()) {
            list = [...list, ...getFileList(path, options)];
        } else {
            list.push(path);
        }
    });

    return list;
};

const parseFile = async(path, dataObj) => new Promise(resolve => {
    const stream = createReadStream(path)
        .pipe(es.split())
        .pipe(es.mapSync(line => {
            stream.pause();
            dataObj = parseLine(dataObj, line);
            stream.resume();
        }))
        .on('error', err => {
            log.error(`Error streaming ${path}`, err);
        })
        .on('end', () => {
            log(`Done reading ${path}`);
            resolve(dataObj);
        });
});

const parseLine = (obj, line) => {
    if (!line.trim().length) {
        return obj;
    }

    const [
        domain, // %v
        ip, // %h
        remoteLogName, // %l
        remoteUser, // %u
        timestamp, // %t
        requestLine, // %r
        finalStatus, // %>s
        bytesReceived, // %I
        bytesSent, // %O
        referer, // %{Referer}i
        userAgent, // %{User-Agent}i
        timeTakenMs, // %{ms}D
        handler, // %R
        keepAliveNumber, // %k
        connectionStatus, // %X
        JSESSIONID, // %{JSESSIONID}C
        urlPath, // %U
        vst2, // %{VST2}C
        vsr2, // %{VSR2}C

    ] = line.trim().split('\t');

    const date = timestamp
        .replace(/[\[\]]+/g, '')
        .split(':')
        .shift();

    const ext = getExtension(urlPath);
    const isContentFile = [
        'N/A',
        '.do',
        '.htm',
        '.html',
        '.inc',
        '.php'
    ].indexOf(ext) !== -1;

    if (obj.extensions.indexOf(ext) === -1) {
        obj.extensions.push(ext);
    }

    let dataObj = obj.data;

    if (!(date in dataObj)) {
        dataObj[date] = {
            byDomain: {},
            assets: {
                sent: 0,
                received: 0,
                requests: 0,
                timeTaken: [],
            },
            content: {
                sent: 0,
                received: 0,
                requests: 0,
                timeTaken: [],
            },
        };
    }

    const timeTakenSec = parseFloat((+timeTakenMs / 1000000).toFixed(6));

    if (isContentFile) {
        dataObj[date].content.sent += +bytesSent;
        dataObj[date].content.received += +bytesReceived;
        dataObj[date].content.requests++;
        dataObj[date].content.timeTaken.push(+timeTakenSec);
    } else {
        dataObj[date].assets.sent += +bytesSent;
        dataObj[date].assets.received += +bytesReceived;
        dataObj[date].assets.requests++;
        dataObj[date].assets.timeTaken.push(+timeTakenSec);
    }

    if (!(domain in dataObj[date].byDomain)) {
        dataObj[date].byDomain[domain] = {
            byExt: {},
            assets: {
                sent: 0,
                received: 0,
                requests: 0,
            },
            content: {
                sent: 0,
                received: 0,
                requests: 0,
            },
        }
    }

    if (isContentFile) {
        dataObj[date].byDomain[domain].content.sent += +bytesSent;
        dataObj[date].byDomain[domain].content.received += +bytesReceived;
        dataObj[date].byDomain[domain].content.requests++;
    } else {
        dataObj[date].byDomain[domain].assets.sent += +bytesSent;
        dataObj[date].byDomain[domain].assets.received += +bytesReceived;
        dataObj[date].byDomain[domain].assets.requests++;
    }

    if (!(ext in dataObj[date].byDomain[domain].byExt)) {
        dataObj[date].byDomain[domain].byExt[ext] = {
            totalBytesReceived: 0,
            totalBytesSent: 0,
            totalRequests: 0,
        }
    }

    dataObj[date].byDomain[domain].byExt[ext].totalRequests++;
    dataObj[date].byDomain[domain].byExt[ext].totalBytesReceived += +bytesReceived;
    dataObj[date].byDomain[domain].byExt[ext].totalBytesSent += +bytesSent;

    obj.data = dataObj;
    return obj;
};

module.exports = {
    getExtension,
    getFileList,
    parseFile,
};