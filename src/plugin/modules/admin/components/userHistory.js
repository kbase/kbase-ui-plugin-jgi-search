define([
    'knockout-plus',
    'kb_common/html',
    'kb_common/jsonRpc/genericClient',
    'kb_common/props'
], function (
    ko,
    html,
    GenericClient,
    Props
) {
    'use strict';

    var t = html.tag,
        div = t('div'),
        table = t('table'),
        thead = t('thead'),
        tr = t('tr'),
        th = t('th'),
        tbody = t('tbody'),
        td = t('td'),
        label = t('label'),
        input = t('input');

    function getAllProfilesWithAgreement(runtime) {
        var url =  runtime.config('services.user_profile.url');
        // var url = 'https://' + host + '.kbase.us/services/user_profile/rpc';
        var userProfileService = new GenericClient({
            module: 'UserProfile',
            url: url,
            token: runtime.service('session').getAuthToken()
        });
        return userProfileService.callFunc('filter_users', [{
            filter: ''
        }])
            .spread(function (result) {
                var usernames = result.map(function (user) {
                    return user.username;
                });
                return userProfileService.callFunc('get_user_profile', [usernames]);
            })
            .spread(function (result) {
                var profilesWithAgreement = result
                    .reduce(function (profiles, rawProfile) {
                        var profile = Props.make({data: rawProfile});
                        if (profile.hasItem('profile.plugins.jgi-search.settings.jgiDataTerms.agreed')) {
                            var history;
                            var savedAt;
                            var source;
                            // yuck, need to clean up old versions.
                            if (profile.hasItem('profile.plugins.jgi-search.settings.history.search')) {
                                source = 'ver2';
                                history = profile.getItem('profile.plugins.jgi-search.settings.history.search.history');
                                savedAt =  profile.getItem('profile.plugins.jgi-search.settings.history.search.time');
                            } else if (profile.hasItem('profile.plugins.jgi-search.settings.searchInputHistory')) {
                                source = 'ver1';
                                history = profile.getItem('profile.plugins.jgi-search.settings.searchInputHistory.history');
                                savedAt =  profile.getItem('profile.plugins.jgi-search.settings.searchInputHistory.time');                           
                            } else {
                                source = 'missing';
                                history = [];
                                savedAt = 0;
                            }
                            var hasV1 = profile.hasItem('profile.plugins.jgi-search.settings.searchInputHistory');

                            profiles.push({
                                username: profile.getItem('user.username'),
                                realname: profile.getItem('user.realname', '** MISSING **'),
                                history: history,
                                savedAt: savedAt,
                                source: source,
                                hasV1: hasV1
                            });
                        }
                        return profiles;
                    }, []);
                return profilesWithAgreement;
            });
    }

    function viewModel(params, componentInfo) {
        var context = ko.contextFor(componentInfo.element);
        var runtime = context['$root'].runtime;
        var subscriptions = ko.kb.SubscriptionManager.make();

        var status = ko.observable();

        var sorter = ko.observable({
            column: 'date',
            direction: 'descending'
        });

        var profiles = ko.observableArray().extend({rateLimit: 100});

        var userFilter = ko.observable();

        // var selectedHost = ko.observable('ci');
        // var hosts = [
        //     'ci',
        //     'next', 
        //     'appdev',
        //     'prod'
        // ];

        var userFilterRegex = ko.pureComputed(function () {
            if (!userFilter()) {
                return null;
            }
            return new RegExp(userFilter(), 'i');
        });

        var sortedProfiles = ko.pureComputed(function () {
            return profiles.slice(0)
                .sort(function (a, b) {
                    var dir = sorter().direction === 'ascending' ? 1 : -1;
                    switch (sorter().column) {
                    case 'date':
                        return dir * (a.savedAt - b.savedAt);
                    case 'username':
                        if (a.username < b.username) {
                            return dir * -1;
                        } else if (a.username > b.username) {
                            return dir;
                        }
                        return 0;
                    case 'history':
                        return dir * (a.history.length - b.history.length);
                    }
                })
                .filter(function (a) {
                    if (!userFilterRegex()) {
                        return true;
                    }
                    return (userFilterRegex().test(a.username) || userFilterRegex().test(a.realname));
                });
        });
        
        function fetchData() {
            // if (status() === 'fetched' || status() === 'fetching') {
            //     return;
            // }

            status('fetching');
            getAllProfilesWithAgreement(runtime)
                .then(function (foundProfiles) { 
                    profiles(foundProfiles);
                    // foundProfiles.forEach(function(profile) {
                    //     profiles.push(profile);
                    // });
                    status('fetched');
                });
        }

        // subscriptions.add(selectedHost.subscribe(function () {
        //     fetchData();
        // }));

        // fetch data initially
        fetchData();

        function dispose() {
            subscriptions.dispose();
        }

        return {
            profiles: sortedProfiles,
            status: status,
            userFilter: userFilter,
            // selectedHost: selectedHost,
            // hosts: hosts,
            dispose: dispose
        };
    }

    function buildTable(def) {
        return table({
            class: 'table table-striped'
        }, [
            thead([
                tr(def.columns.map(function (column) {
                    if (column.width) {
                        return th({
                            style: {
                                width: column.width
                            }
                        }, column.label);
                    } else {
                        return th(column.label);
                    }
                }))
            ]),
            tbody({
                dataBind: {
                    foreach: def.field
                }
            }, tr(
                def.columns.map(function (column) {
                    return td({
                        dataBind: {
                            text: column.field
                        }
                    });
                })
            ))
        ]);
    }

    function buildUserTable() {
        return table({
            class: 'table table-striped'
        }, [
            thead([
                tr([
                    th({
                        style: {
                            width: '15%'
                        }
                    }, 'Username'),
                    th({
                        style: {
                            width: '25%'
                        }
                    }, 'Realname'),
                    th({
                        style: {
                            width: '20%'
                        }
                    }, 'Saved at'),
                    th({
                        style: {
                            width: '30%'
                        }
                    }, 'Search history'),
                    th({
                        style: {
                            width: '5%'
                        }
                    }, 'Source'),
                    th({
                        style: {
                            width: '5%'
                        }
                    }, 'v1?')
                ])
            ]),
            tbody({
                dataBind: {
                    foreach: 'profiles'
                }
            }, [
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
                    }),
                    td({
                        dataBind: {
                            typedText: {
                                value: 'savedAt',
                                type: '"date"',
                                format: '"YYYY-MM-DD @ hh:mm:ss"'
                            }
                        }
                    }),
                    td( buildTable({
                        field: 'history',
                        columns: [{
                            label: '#',
                            width: '2em',
                            field: '$index() + 1'
                        }, {
                            label: 'search terms',
                            field: '$data'
                        }]
                    })),
                    td({
                        dataBind: {
                            text: 'source'
                        }
                    }),
                    td({
                        dataBind: {
                            text: 'hasV1 ? "yes" : "-"'
                        }
                    })
                ])
            ])
        ]);
    }

    function buildControls() {
        return div({
            style: {
                height: '50px',
                // border: '1px silver solid'
            }
        }, [
            div({
                class: 'form-inline'
            }, [
                div({
                    class: 'form-group'
                }, [
                    label('Filter users:'),
                    input({
                        class: 'form-control',
                        dataBind: {
                            textInput: 'userFilter'
                        }
                    })
                ]),

                // div({
                //     class: 'form-group',
                //     style: {
                //         marginLeft: '10px'
                //     }
                // }, [
                //     label('Host:'),
                //     select({
                //         class: 'form-control',
                //         dataBind: {
                //             options: 'hosts',
                //             value: 'selectedHost'
                //         }
                //     })
                // ])
            ])
        ]);
    }


    function buildLayout() {
        return div([
            buildControls(),
            '<!-- ko if: status() === "fetching" -->',
            div({
                class: 'well',
                style: {
                    padding: '20px',
                    textAlign: 'center'
                }
            }, html.loading('Loading user profiles')),
            '<!-- /ko -->',
            '<!-- ko if: status() === "fetched" -->',
            buildUserTable(),
            '<!-- /ko -->'
        ]);
    }

    function template() {
        return buildLayout();
    }

    function component () {
        return {
            viewModel: {
                createViewModel: viewModel
            },
            template: template()
        };
    }

    return ko.kb.registerComponent(component);
});