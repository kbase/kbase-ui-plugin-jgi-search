define([
    'kb_common/html'
], function (
    html
) {
    'use strict';

    var t = html.tag,
        button = t('button'),    
        div = t('div');

    function buildDialog(title, body) {
        return div({
        }, [
            // title
            div({
                style: {
                    color: 'white',
                    backgroundColor: 'rgba(0,0,0,0.6)',
                    fontSize: '150%',
                    padding: '8px'
                }
            }, title),
            // body
            div({
                style: {
                    padding: '8px',
                    minHeight: '10em',
                    backgroundColor: 'rgba(255,255,255,1)',
                }
            }, body),
            // buttons
            div({
                style: {
                    padding: '8px',
                    textAlign: 'right',
                    backgroundColor: 'transparent'
                }
            }, button({
                type: 'button',
                class: 'btn btn-default',
                dataBind: {
                    click: 'onClose'
                }
            }, 'Close')),

        ]);
    }

    return {
        buildDialog: buildDialog
    };
});