var Filter  = function (options) {
    options = options || {};
    this.test = options.test || true;
}

Filter.prototype = {
    test : function(value) {
        return test;
    }
}

Ear.Filter = Filter;
