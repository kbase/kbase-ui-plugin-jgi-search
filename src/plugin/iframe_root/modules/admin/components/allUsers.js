define(['knockout', 'kb_knockout/registry', 'kb_lib/html', 'kb_lib/jsonRpc/genericClient'], function (
    ko,
    reg,
    html,
    GenericClient
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        p = t('p'),
        table = t('table'),
        thead = t('thead'),
        tr = t('tr'),
        th = t('th'),
        tbody = t('tbody'),
        td = t('td');

    function getAllUsers(runtime) {
        var userProfileService = new GenericClient({
            module: 'UserProfile',
            url: runtime.config('services.user_profile.url'),
            token: runtime.service('session').getAuthToken()
        });
        return userProfileService
            .callFunc('filter_users', [
                {
                    filter: ''
                }
            ])
            .spread(function (result) {
                return result;
            });
    }

    function viewModel(params, componentInfo) {
        var context = ko.contextFor(componentInfo.element);
        var runtime = context['$root'].runtime;

        var users = ko.observableArray();

        getAllUsers(runtime).then(function (foundUsers) {
            foundUsers
                .map(function (user) {
                    // hmm, some users don't have a realname?
                    if (typeof user.realname === 'undefined') {
                        user.realname = '** MISSING **';
                    }
                })
                .sort(function (a, b) {
                    if (a.username < b.username) {
                        return -1;
                    } else if (a.username === b.username) {
                        return 0;
                    }
                    return 1;
                });
            users(foundUsers);
        });

        return {
            users: users
        };
    }

    function buildUserTable() {
        return table(
            {
                class: 'table table-striped'
            },
            [
                thead([tr([th('Username'), th('Realname')])]),
                tbody(
                    {
                        dataBind: {
                            foreach: 'users'
                        }
                    },
                    [
                        tr([
                            td({
                                dataBind: {
                                    text: 'username'
                                }
                            }),
                            td({
                                dataBind: {
                                    text: 'realname'
                                }
                            })
                        ])
                    ]
                )
            ]
        );
    }

    function buildLayout() {
        return div([p('I will show all users...'), buildUserTable()]);
    }

    function template() {
        return buildLayout();
    }

    function component() {
        return {
            viewModel: {
                createViewModel: viewModel
            },
            template: template()
        };
    }

    return reg.registerComponent(component);
});
