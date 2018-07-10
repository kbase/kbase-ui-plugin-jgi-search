define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_common/html',
    '../../../lib/ui'
], function (
    ko,
    reg,
    gen,
    html,
    ui
) {
    'use strict';

    const t = html.tag,
        div = t('div'),
        button = t('button'),
        span = t('span');

    class ViewModel {
        constructor(params) {
            this.removeJob = params.env.removeJob;
            this.jobMonitoringId = params.row.jobId.jobMonitoringId;
            this.status = params.row.status.value;
        }
        doDelete(data) {
            this.removeJob(data.jobMonitoringId);
        }
    }

    const styles = html.makeStyles({
        dangerButton: {
            css: {
                padding: '4px',
                backgroundColor: 'transparent',
                color: ui.bootstrapTextColor('muted'),
                opacity: '0.8'
            },
            pseudo: {
                hover: {
                    color: ui.bootstrapTextColor('danger'),
                    opacity: '1'
                },
                active: {
                    color: ui.bootstrapTextColor('danger'),
                    opacity: '1'
                }
            }
        },
    });

    function template() {
        return div({
            class: 'btn-group pull-right'
        }, gen.if('status() === "completed" || status() === "error" || status() === "notfound"',
            button({
                class: 'btn pull-right ' + styles.classes.dangerButton,
                dataBind: {
                    click: 'doDelete'
                }
            }, span({
                class: 'fa fa-times'
            }))));
    }

    function component() {
        return {
            viewModel: ViewModel,
            template: template(),
            stylesheet: styles.sheet
        };
    }

    return reg.registerComponent(component);
});