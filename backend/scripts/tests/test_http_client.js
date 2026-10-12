const http = require('http');

/**
 * Perform a real HTTP request against a running server or express app
 * @param {http.Server} server 
 * @param {Object} options 
 * @param {string|Buffer|Object} [body]
 * @returns {Promise<{statusCode: number, headers: Object, body: string, json: Object|null}>}
 */
function makeRequest(server, { method = 'GET', path = '/', headers = {} }, body = null) {
    return new Promise((resolve, reject) => {
        const address = server.address();
        const port = address.port;

        let payload = null;
        const reqHeaders = { ...headers };

        if (body !== null && body !== undefined) {
            if (typeof body === 'object' && !Buffer.isBuffer(body)) {
                payload = JSON.stringify(body);
                if (!reqHeaders['content-type'] && !reqHeaders['Content-Type']) {
                    reqHeaders['Content-Type'] = 'application/json';
                }
            } else {
                payload = body;
            }
            if (!reqHeaders['content-length'] && !reqHeaders['Content-Length']) {
                reqHeaders['Content-Length'] = Buffer.byteLength(payload);
            }
        }

        const req = http.request({
            hostname: '127.0.0.1',
            port: port,
            path: path,
            method: method,
            headers: reqHeaders
        }, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                let parsed = null;
                try {
                    parsed = JSON.parse(data);
                } catch (_) {
                    parsed = null;
                }
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data,
                    json: parsed
                });
            });
        });

        req.on('error', reject);

        if (payload) {
            req.write(payload);
        }
        req.end();
    });
}

module.exports = {
    makeRequest
};
