(function () {
    var resp = { id: 'aaaaaaaaaa', success: true };
    return {
        "/ping": {
            get: resp,
            post: resp,
            put: resp,
            delete: resp,
            patch: resp
        }
    };
})();
