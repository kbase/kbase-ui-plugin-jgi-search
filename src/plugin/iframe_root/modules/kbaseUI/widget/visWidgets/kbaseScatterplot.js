define(['jquery', 'd3', './visWidget'], function ($, d3) {
    'use strict';

    $.KBWidget({
        name: 'kbaseScatterplot',
        parent: 'kbaseVisWidget',
        version: '1.0.0',
        options: {
            overColor: 'yellow',
            weight: 20,
            color: 'black',
            shape: 'circle'
        },
        _accessors: [],
        defaultXDomain: function () {
            if (this.dataset() === undefined) {
                return [0, 0];
            }

            var min =
                0.9 *
                d3.min(
                    this.dataset()
                        .map(function (d) {
                            return d.x;
                        })
                        .filter(function (d) {
                            return this.xScaleType() !== 'log' || d !== 0;
                        }, this)
                );

            return [
                min,
                1.1 *
                    d3.max(
                        this.dataset().map(function (d) {
                            return d.x;
                        })
                    )
            ];
        },
        defaultYDomain: function () {
            if (this.dataset() === undefined) {
                return [0, 0];
            }

            var min =
                0.9 *
                d3.min(
                    this.dataset()
                        .map(function (d) {
                            return d.y;
                        })
                        .filter(function (d) {
                            return this.yScaleType() !== 'log' || d !== 0;
                        }, this)
                );

            return [
                min,
                1.1 *
                    d3.max(
                        this.dataset().map(function (d) {
                            return d.y;
                        })
                    )
            ];
        },
        renderChart: function () {
            if (this.dataset() === undefined) {
                return;
            }

            var bounds = this.chartBounds();
            var $scatter = this;

            var funkyTown = function () {
                this.attr('cx', function (d) {
                    var cx = $scatter.xScale()(d.x);

                    return isNaN(cx) ? -500000 : cx;
                })
                    .attr('cy', function (d) {
                        var cy = $scatter.yScale()(d.y);

                        return isNaN(cy) ? -500000 : cy;
                    })
                    .attr('r', function (d) {
                        return d.weight || $scatter.options.weight;
                    })
                    //.attr('y', function (d) { return $scatter.yScale()(d.y) })
                    .attr('fill', function (d) {
                        return d.color || $scatter.options.color;
                    });
            };

            var mouseAction = function () {
                this.on('mouseover', function (d) {
                    if ($scatter.options.overColor) {
                        d3.select(this)
                            .attr('stroke', $scatter.options.overColor)
                            .attr('stroke-width', 3);
                    }

                    var label = d.label
                        ? d.label
                        : ($scatter.options.weight || d.weight) + ' at (' + d.x + ',' + d.y + ')';

                    if (label !== undefined) {
                        $scatter.showToolTip({
                            label: label
                        });
                    }
                }).on('mouseout', function (d) {
                    if ($scatter.options.overColor) {
                        d3.select(this)
                            .transition()
                            .attr('stroke', 'none');
                    }

                    $scatter
                        .D3svg()
                        .select($scatter.region('yPadding'))
                        .selectAll('g g text')
                        .attr('fill', function (r, ri) {
                            return 'black';
                        });
                    $scatter.hideToolTip();
                });
                return this;
            };

            var transitionTime = this.rendered ? this.options.transitionTime : 0;

            var chart = this.D3svg()
                .select(this.region('chart'))
                .selectAll('.point')
                .data(this.dataset());
            chart
                .enter()
                .append('path')
                .attr('class', 'point');

            chart.exit().remove();

            chart
                .call(mouseAction)
                .transition()
                .duration(transitionTime)
                .attr('transform', function (d) {
                    var x = $scatter.xScale()(d.x);
                    var y = $scatter.yScale()(d.y);

                    x = isNaN(x) ? -500000 : x;
                    y = isNaN(y) ? -500000 : y;

                    return 'translate(' + x + ',' + y + ')';
                })
                .attr('d', function (d) {
                    return d3.svg
                        .symbol()
                        .type(d.shape || $scatter.options.shape)
                        .size(d.weight || $scatter.options.weight)();
                })
                .call(funkyTown);

            this.rendered = true;
        },
        setYScaleRange: function (range, yScale) {
            return this._super(range.reverse(), yScale);
        }
    });
});
