define([
    'knockout',
    'kb_knockout/registry',
    'kb_knockout/lib/generators',
    'kb_knockout/lib/viewModelBase',
    'kb_lib/html'
], function (
    ko,
    reg,
    gen,
    ViewModelBase,
    html
) {
    'use strict';

    const t = html.tag,
        span = t('span'),
        label = t('label'),
        select = t('select'),
        option = t('option'),
        div = t('div');

    class ViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            this.jobStatusInput = ko.observable('_select_');
            this.selectedJobStatuses = ko.observableArray();
            this.jobStatusFilter = params.jobStatusFilter;

            this.subscribe(this.selectedJobStatuses, (newValue) => {
                this.jobStatusFilter(newValue.map((option) => {
                    return option.value;
                }));
            });

            this.jobStatusOptions = ko.observableArray();

            this.jobStatuses = [
                {
                    value: 'sent',
                    label: 'Sent'
                },
                {
                    value: 'submitted',
                    label: 'Submitted'
                },
                {
                    value: 'queued',
                    label: 'Queued'
                },
                {
                    value: 'restoring',
                    label: 'Restoring'
                },
                {
                    value: 'copying',
                    label: 'Copying'
                },
                {
                    value: 'completed',
                    label: 'Completed'
                },
                {
                    value: 'error',
                    label: 'Error'
                },
                {
                    value: 'notfound',
                    label: 'Not Found'
                }
            ];
            this.jobStatuses.forEach((status) => {
                status = JSON.parse(JSON.stringify(status));
                status.selected = ko.observable(false);
                this.jobStatusOptions.push(status);
            });


            this.jobStatusOptions.unshift({
                label: 'Select one or more job statuses',
                value: '_select_',
                selected: ko.observable(false)
            });
        }


        doRemoveJobStatus(option) {
            // This _is_ the option object.
            option.selected(false);
            this.selectedJobStatuses.remove(option);
        }

        doSelectJobStatus(data) {
            const value = data.jobStatusInput();
            if (value === '_select_') {
                return;
            }
            const option = this.jobStatusOptions().filter((option) => {
                return (option.value === value);
            })[0];
            this.selectedJobStatuses.push(option);
            option.selected(true);
            data.jobStatusInput('_select_');
        }
    }

    const styles = html.makeStyles({
        component: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        searchArea: {
            flex: '0 0 50px',
        },
        filterArea: {
            flex: '0 0 50px',
        },
        resultArea: {
            flex: '1 1 0px',
            display: 'flex',
            flexDirection: 'column'
        },
        activeFilterInput: {
            backgroundColor: 'rgba(209, 226, 255, 1)',
            color: '#000'
        }
    });

    function buildTypeFilter() {
        return div({
            class: 'form-group',
            style: {
                margin: '0 4px'
            }
        }, [
            label('Type'),
            select({
                dataBind: {
                    value: 'jobStatusInput',
                    event: {
                        change: 'doSelectJobStatus'
                    },
                    foreach: 'jobStatusOptions'
                },
                class: 'form-control',
                style: {
                    margin: '0 4px'
                }
            }, [
                gen.if('!selected()',
                    option({
                        dataBind: {
                            value: 'value',
                            text: 'label'
                        }
                    })),
            ]),

            // selected types
            div({
                dataBind: {
                    foreach: 'selectedJobStatuses'
                },
                style: {
                    display: 'inline-block'
                }
            }, [
                span([
                    span(({
                        dataBind: {
                            text: 'label'
                        },
                        class: ['form-control', styles.classes.activeFilterInput]
                    })),
                    span({
                        dataBind: {
                            click: '(d, e) => {$component.doRemoveJobStatus.call($component, d, e)}'
                        },
                        class: 'kb-btn-mini'
                    }, 'x')
                ])
            ])
        ]);
    }

    function template() {
        return buildTypeFilter();
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