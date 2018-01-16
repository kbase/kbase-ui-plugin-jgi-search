define([
    'knockout-plus',
    'kb_common/html'
], function(
    ko,
    html
) {
    'use strict';

    var t = html.tag,
        span = t('span'),
        label = t('label'),
        select = t('select'),
        option = t('option'),
        div = t('div');

    function viewModel(params) {  
        var jobStatusInput = ko.observable('_select_');

        var selectedJobStatuses = ko.observableArray();

        selectedJobStatuses.subscribe(function (newValue) {
            params.jobStatusFilter(newValue.map(function (option) {
                return option.value;
            }));
        });

        var jobStatusOptions = ko.observableArray();

        var jobStatuses = [
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
            }
        ];
        jobStatuses.forEach(function (status) {
            status = JSON.parse(JSON.stringify(status));
            status.selected = ko.observable(false);
            jobStatusOptions.push(status); 
        });

        
        jobStatusOptions.unshift({
            label: 'Select one or more job statuses',
            value: '_select_',
            selected: ko.observable(false)
        });

       
        function doRemoveJobStatus(option) {
            // This _is_ the option object.
            option.selected(false);
            selectedJobStatuses.remove(option);
        }

        function doSelectJobStatus(data) {
            var value = data.jobStatusInput();
            if (value === '_select_') {
                return;
            }
            var option = jobStatusOptions().filter(function (option) {
                return (option.value === value);
            })[0];
            selectedJobStatuses.push(option);
            option.selected(true);
            data.jobStatusInput('_select_');
        }

        return { 
            jobStatusInput: jobStatusInput,
            jobStatusOptions: jobStatusOptions,
            selectedJobStatuses: selectedJobStatuses,
            doSelectJobStatus: doSelectJobStatus,
            doRemoveJobStatus: doRemoveJobStatus
        };
    }

    var styles = html.makeStyles({
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
            styles.sheet,
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
                '<!-- ko ifnot: selected() -->',
                option({
                    dataBind: {
                        value: 'value',
                        text: 'label'
                    }
                }),
                '<!-- /ko -->'
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
                            click: '$component.doRemoveJobStatus'
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
            viewModel: viewModel,
            template: template()
        };
    }

    return ko.kb.registerComponent(component);
});