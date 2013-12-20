(function(global) {
    onload = function() {
        global.spec = {};
        var spec = global.spec;
        spec.run = function run(name) {
            var script = document.createElement("script");
            spec.now = Date.now();
            script.src = "../../../vendor/require.js?v=" + spec.now;
            script.setAttribute("data-main", "./require-config.js?v=" + spec.now);
            document.head.appendChild(script);
            spec.TestCaseName = name;

            var intervalId = setInterval(function() {
                if (spec.rerun) {
                    document.getElementById('mocha').innerHTML = '';
                    spec.rerun();
                    clearInterval(intervalId);
                }
            }, 100);
        };

        spec.parseQuery = function parseQuery(qs){
            var ret = {};
            var querystr = qs.replace('?', '').split('&');
            for (var i = 0; i < querystr.length; i++) {
                var pair = querystr[i];
                var i = pair.indexOf('=')
                , key = pair.slice(0, i)
                , val = pair.slice(++i);
                ret[key] = decodeURIComponent(val);
            }
            return ret;
        };

        var query = spec.parseQuery(window.location.search || '');
        query['name'] && spec.run(query['name']);
    };

})(this);
