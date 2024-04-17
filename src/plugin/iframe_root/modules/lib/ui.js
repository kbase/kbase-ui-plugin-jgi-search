define([
    'kb_lib/html'
], function (
    html
) {
    const t = html.tag,
        button = t('button'),
        span = t('span'),
        div = t('div');

    function buildDialog(arg) {
        var type = arg.type || 'default';
        var titleColor;
        var iconClass;
        switch (type) {
        case 'warning':
            iconClass = 'exclamation-triangle';
            titleColor = '#8a6d3b';
            break;
        case 'danger':
        case 'error':
            iconClass = 'frown-o';
            titleColor = '#a94442';
            break;
        case 'success':
            iconClass = 'thumbs-up-o';
            titleColor = '##3c763d;';
            break;
        case 'info':
            iconClass = 'info';
            titleColor = '#2e618d';
            break;
        case 'primary':
            iconClass = null;
            titleColor = '#2e618d';
            break;
        case 'default':
        default:
            titleColor = '#000';
        }

        var icon;
        if (iconClass) {
            icon = span({
                class: 'fa fa-' + iconClass,
                style: {
                    marginRight: '4px',
                    fontWeight: 'bold',
                    fontSize: '120%'
                }
            });
        } else {
            icon = '';
        }

        var buttons = arg.buttons || [{
            label: 'Close',
            onClick: 'onClose'
        }];

        var buttonsContent = buttons.map(function (btn) {
            return button({
                type: 'button',
                class: 'btn btn-' + (btn.type || 'default'),
                dataBind: {
                    click: btn.onClick
                }
            }, btn.label);
        }).join(' ');

        return div({
        }, [
            // title
            div({
                style: {
                    color: titleColor,
                    backgroundColor: 'rgba(255,255,255,1)',
                    fontSize: '130%',
                    fontWeight: 'bold',
                    padding: '15px',
                    borderBottom: '1px solid #e5e5e5'
                }
            }, [
                icon,
                arg.title
            ]),
            // body
            div({
                style: {
                    padding: '15px',
                    minHeight: '10em',
                    maxHeight: '85vh',
                    overflowY: 'auto',
                    backgroundColor: 'rgba(255,255,255,1)',
                }
            }, arg.body),
            // buttons
            div({
                class: 'clearfix',
                style: {
                    padding: '15px',
                    textAlign: 'right',
                    backgroundColor: 'rgba(255,255,255,1)',
                    borderTop: '1px solid #e5e5e5'
                }
            }, div({
                class: 'btn-toolbar pull-right',
                style: {
                    textAlign: 'right',
                }
            }, buttonsContent))
        ]);
    }

    function bootstrapTextColor(type) {
        type = type || 'default';
        var color;
        switch (type) {
        case 'warning':
            color = '#8a6d3b';
            break;
        case 'danger':
        case 'error':
            color = '#a94442';
            break;
        case 'success':
            color = '##3c763d;';
            break;
        case 'primary':
            color = '#2e618d';
            break;
        case 'muted':
            color = '#777';
            break;
        case 'default':
        default:
            color = '#000';
        }
        return color;
    }

    function buildFullHeightDialog(arg) {
        var type = arg.type || 'default';
        var titleColor;
        var iconClass;
        switch (type) {
        case 'warning':
            iconClass = 'exclamation-triangle';
            titleColor = '#8a6d3b';
            break;
        case 'danger':
        case 'error':
            iconClass = 'frown-o';
            titleColor = '#a94442';
            break;
        case 'success':
            iconClass = 'thumbs-up-o';
            titleColor = '##3c763d;';
            break;
        case 'info':
            iconClass = 'info';
            titleColor = '#2e618d';
            break;
        case 'primary':
            iconClass = null;
            titleColor = '#2e618d';
            break;
        case 'default':
        default:
            titleColor = '#000';
        }

        var icon;
        if (iconClass) {
            icon = span({
                class: 'fa fa-' + iconClass,
                style: {
                    marginRight: '4px'
                }
            });
        } else {
            icon = '';
        }

        var buttons = arg.buttons || [{
            label: 'Close',
            onClick: 'onClose'
        }];

        var buttonsContent = buttons.map(function (btn) {
            return button({
                type: 'button',
                class: 'btn btn-' + (btn.type || 'default'),
                dataBind: {
                    click: btn.onClick
                }
            }, btn.label);
        }).join(' ');

        return div({
            style: {
                flex: '1 1 0px',
                display: 'flex',
                flexDirection: 'column'
            }
        }, [
            // title
            div({
                style: {
                    color: titleColor,
                    backgroundColor: 'rgba(255,255,255,1)',
                    fontSize: '130%',
                    fontWeight: 'bold',
                    padding: '15px',
                    borderBottom: '1px solid #e5e5e5'
                }
            }, [
                icon,
                arg.title
            ]),
            // body
            div({
                style: {
                    padding: '15px',
                    minHeight: '10em',
                    // maxHeight: 'calc(100vh - 100px)',
                    backgroundColor: 'rgba(255,255,255,1)',
                    overflowY: 'auto',
                    flex: '1 1 0px',
                    display: 'flex',
                    flexDirection: 'column'
                }
            }, arg.body),
            // buttons
            div({
                class: 'clearfix',
                style: {
                    padding: '15px',
                    textAlign: 'right',
                    backgroundColor: 'rgba(255,255,255,1)',
                    borderTop: '1px solid #e5e5e5'
                }
            }, div({
                class: 'btn-toolbar pull-right',
                style: {
                    textAlign: 'right',
                }
            }, buttonsContent))
        ]);
    }

    return {
        buildDialog: buildDialog,
        buildFullHeightDialog: buildFullHeightDialog,
        bootstrapTextColor: bootstrapTextColor
    };
});