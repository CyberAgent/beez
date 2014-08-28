(function () {
    var resp = { id: 'aaaaaaaaaa', success: true };
    return {
        "/ping": {
            get: resp,
            post: resp,
            put: resp,
            delete: resp,
            patch: resp
        },
        "/ping?query1=query1&query2=query2": {
            get: resp
        }
    };
})();
