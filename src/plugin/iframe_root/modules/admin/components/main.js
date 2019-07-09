define(['knockout', 'kb_knockout/registry', 'kb_lib/html', './home', './allUsers', './userHistory'], function (
    ko,
    reg,
    html,
    HomeComponent,
    AllUsersComponent,
    UserHistoryComponent
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        span = t('span');

    function viewModel() {
        var panelComponent = ko.observable(HomeComponent.name());

        var panelComponentParmas = ko.observable({});

        function doShowAllUsers() {
            if (panelComponent() !== AllUsersComponent.name()) {
                panelComponent(AllUsersComponent.name());
            }
        }
        function doShowHome() {
            if (panelComponent() !== HomeComponent.name()) {
                panelComponent(HomeComponent.name());
            }
        }
        function doShowUserHistory() {
            if (panelComponent() !== UserHistoryComponent.name()) {
                panelComponent(UserHistoryComponent.name());
            }
        }
        return {
            panelComponent: panelComponent,
            panelComponentParams: panelComponentParmas,
            doShowAllUsers: doShowAllUsers,
            doShowHome: doShowHome,
            doShowUserHistory: doShowUserHistory
        };
    }

    function buildButton(arg) {
        var icon;
        if (arg.icon) {
            icon = span({
                class: 'fa fa-' + arg.icon
            });
        }
        var label;
        if (arg.label) {
            label = span(arg.label);
        }
        return div(
            {
                class: 'btn btn-' + arg.type,
                dataBind: {
                    click: arg.click,
                    css: {
                        active: 'panelComponent() === "' + arg.componentName + '"'
                    }
                }
            },
            [icon, label]
        );
    }

    function buildLayout() {
        return div(
            {
                style: {
                    // border: '1px silver solid'
                    margin: '10px'
                }
            },
            [
                div(
                    {
                        style: {
                            marginBottom: '10px'
                        }
                    },
                    [
                        div(
                            {
                                class: 'btn-toolbar'
                            },
                            [
                                buildButton({
                                    type: 'default',
                                    icon: 'home',
                                    componentName: HomeComponent.name(),
                                    click: 'doShowHome'
                                }),
                                // buildButton({
                                //     type: 'default',
                                //     label: 'All Users',
                                //     componentName: AllUsersComponent.name(),
                                //     click: 'doShowAllUsers'
                                // }),
                                buildButton({
                                    type: 'default',
                                    label: 'User Search History',
                                    componentName: UserHistoryComponent.name(),
                                    click: 'doShowUserHistory'
                                })
                            ]
                        )
                    ]
                ),

                div(
                    {
                        style: {
                            // border: '1px blue dashed'
                        }
                    },
                    [
                        div({
                            dataBind: {
                                component: {
                                    name: 'panelComponent',
                                    params: 'panelComponentParams'
                                }
                            }
                        })
                    ]
                )
            ]
        );
    }

    function template() {
        return buildLayout();
    }

    function component() {
        return {
            viewModel: viewModel,
            template: template()
        };
    }

    return reg.registerComponent(component);
});
