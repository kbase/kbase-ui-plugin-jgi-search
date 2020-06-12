define(['jquery', 'kb_lib/html', 'kb_lib/htmlBuilders'], function ($, html, htmlBuilders) {
    'use strict';
    // jQuery plugins that you can use to add and remove a
    // loading giff to a dom element.
    $.fn.rmLoading = function () {
        $(this)
            .find('.loader')
            .remove();
    };
    $.fn.loading = function (text) {
        var div = html.tag('div');
        $(this).rmLoading();
        $(this).append(div({ class: 'loader' }, htmlBuilders.loading(text)));
        return this;
    };
});
