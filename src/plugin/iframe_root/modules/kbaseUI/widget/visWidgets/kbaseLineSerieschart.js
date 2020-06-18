define(['jquery', 'd3', './kbaseLinechart'], function ($, d3) {
    'use strict';

    $.KBWidget({
        name: 'kbaseLineSerieschart',
        parent: 'kbaseLinechart',
        version: '1.0.0',
        options: {},
        _accessors: ['labels'],
        xTickValues: function () {
            var m = d3.merge(
                this.dataset().map(function (d) {
                    return d.values.map(function (l) {
                        return l.x;
                    });
                })
            );

            m = d3.set(m).values();

            return m;
        },
        xTickLabel: function (val) {
            if (this.labels() !== undefined) {
                return this.labels()[val];
            } else {
                return val;
            }
        }
    });
});
