define([
    'kb_common/jsonRpc/genericClient',
    'kb_common/props',
    'kb_plugin_jgi-search'
], function (
    GenericClient,
    Props,
    Plugin
) {
    'use strict';

    console.log('plugin?', Plugin);

    function factory(config) {
        var runtime = config.runtime;

        var profileService = new GenericClient({
            url: runtime.config('services.UserProfile.url'),
            token: runtime.service('session').getAuthToken(),
            module: 'UserProfile'
        });

        function updateUserProfile(profileUpdate) {
            return profileService.callFunc('update_user_profile', [profileUpdate])
                .then(function () {
                    return [true, null];
                })
                .catch(function (err) {
                    return [null, {
                        source: 'ProfileService:update_user_profile',
                        code: 'error-in-call',
                        message: 'An error occurred attempting to update the user profile: ' + err.message,
                        errors: [
                            err
                        ],
                        info: {
                            profileUpdate: profileUpdate
                        }
                    }];
                });
        }

        function saveJgiAgreement(agreed) {
            var username = runtime.service('session').getUsername();
            return profileService.callFunc('get_user_profile', [[username]])
                .spread(function (profiles) {
                    var profile = Props.make({
                        data: profiles[0]
                    });

                    // NB we can only update a top level profile property, so we need to 
                    // get all the plugin prefs.
                    var prefs = Props.make({ data: profile.getItem('profile.plugins', {}) });

                    prefs.setItem('jgi-search.settings.jgiDataTerms', {
                        agreed: agreed,
                        time: new Date().getTime()
                    });

                    var profileUpdate = {
                        profile: {
                            profile: {
                                plugins: prefs.debug()
                            },
                            user: profile.getItem('user')
                        }
                    };

                    // Don't want to really replace, but update_user_profile only 
                    return updateUserProfile(profileUpdate);
                })
                .catch(function (err) {
                    return [null, {
                        source: 'ProfileService:get_user_profile',
                        code: 'error-getting-user-profile',
                        message: 'An error occurred attempting to get the user profile: ' + err.message,
                        errors: [
                            err
                        ],
                        info: {
                            username: username
                        }
                    }];
                });
        }

        function getJgiAgreement() {
            var username = runtime.service('session').getUsername();
            return profileService.callFunc('get_user_profile', [[username]])
                .spread(function (profiles) {
                    var profile = Props.make({
                        data: profiles[0]
                    });
                    console.log('hmm', profiles);

                    var agreed = profile.getItem('profile.plugins.jgi-search.settings.jgiDataTerms.agreed', false);
                    return [{
                        agreed: agreed
                    }, null];
                })
                .catch(function (err) {
                    return [null, {
                        source: 'ProfileService:get_user_profile',
                        code: 'error-getting-user-profile',
                        message: 'An error occurred attempting to get the user profile: ' + err.message,
                        errors: [
                            err
                        ],
                        info: {
                            username: username
                        }
                    }];
                });
        }

        function saveSearchHistory(history) {
            var username = runtime.service('session').getUsername();

            return profileService.callFunc('get_user_profile', [[username]])
                .spread(function (profiles) {
                    var profile = Props.make({
                        data: profiles[0]
                    });

                    var prefs = Props.make({ data: profile.getItem('profile.plugins', {}) });

                    prefs.setItem('jgi-search.settings.searchInputHistory', {
                        history: history,
                        time: new Date().getTime()
                    });

                    var profileUpdate = {
                        profile: {
                            profile: {
                                plugins: prefs.debug()
                            },
                            user: profile.getItem('user')
                        }
                    };

                    // Don't want to really replace, but update_user_profile only 
                    return updateUserProfile(profileUpdate);
                })
                .catch(function (err) {
                    return [null, {
                        source: 'ProfileService:get_user_profile',
                        code: 'error-getting-user-profile',
                        message: 'An error occurred attempting to get the user preferences: ' + err.message,
                        errors: [
                            err
                        ],
                        info: {
                            username: username
                        }
                    }];
                });
        }

        function getSearchHistory() {
            var username = runtime.service('session').getUsername();
            return profileService.callFunc('get_user_profile', [[username]])
                .spread(function (profiles) {
                    var profile = Props.make({
                        data: profiles[0]
                    });

                    var history = profile.getItem('profile.plugins.jgi-search.settings.searchInputHistory', {});
                    return [history.history || [], null];
                })
                .catch(function (err) {
                    return [null, {
                        source: 'ProfileService:get_user_profile',
                        code: 'error-getting-user-profile',
                        message: 'An error occurred attempting to get the user preferences: ' + err.message,
                        errors: [
                            err
                        ],
                        info: {
                            username: username
                        }
                    }];
                });
        }

        return Object.freeze({
            saveJgiAgreement: saveJgiAgreement,
            getJgiAgreement: getJgiAgreement,
            getSearchHistory: getSearchHistory,
            saveSearchHistory: saveSearchHistory
        });
    }

    return Object.freeze({
        make: factory
    });
});