define([
    'kb_common/jsonRpc/genericClient',
    'kb_common/props'
], function (
    GenericClient,
    Props
) {
    'use strict';

    function firstSuccess(array, fun) {
        for (var i = 0; i < array.length; i += 1) {
            var result = fun(array[i]);
            if (result) {
                return result;
            }
        }
    }

    function sameArray(a1, a2) {
        if (a1.length !== a2.length) {
            return false;
        }
        for (var i = 0; i < a1.length; i += 1) {
            if (a1[i] !== a2[i]) {
                return false;
            }
        }
        return true;
    }

    class Profile {
        constructor({runtime}) {
            this.runtime = runtime;

            this.profileService = new GenericClient({
                url: this.runtime.config('services.UserProfile.url'),
                token: this.runtime.service('session').getAuthToken(),
                module: 'UserProfile'
            });
        }

        updateUserProfile(profileUpdate) {
            return this.profileService.callFunc('update_user_profile', [profileUpdate])
                .then(() => {
                    return [true, null];
                })
                .catch((err) => {
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

        saveJgiAgreement(agreed) {
            const username = this.runtime.service('session').getUsername();
            return this.profileService.callFunc('get_user_profile', [[username]])
                .spread((profiles) => {
                    const profile = Props.make({
                        data: profiles[0]
                    });

                    // NB we can only update a top level profile property, so we need to
                    // get all the plugin prefs.
                    const prefs = Props.make({
                        data: profile.getItem('profile.plugins', {})
                    });

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
                    return this.updateUserProfile(profileUpdate);
                })
                .catch((err) => {
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

        getJgiAgreement() {
            var username = this.runtime.service('session').getUsername();
            return this.profileService.callFunc('get_user_profile', [[username]])
                .spread((profiles) => {
                    var profile = Props.make({
                        data: profiles[0]
                    });

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

        saveHistory(name, history) {
            const username = this.runtime.service('session').getUsername();
            const key = ['jgi-search', 'settings', 'history', name];

            return this.profileService.callFunc('get_user_profile', [[username]])
                .spread((profiles) => {
                    var profile = Props.make({
                        data: profiles[0]
                    });

                    var prefs = Props.make({
                        data: profile.getItem('profile.plugins', {})
                    });

                    if (prefs.hasItem(key)) {
                        if (sameArray(prefs.getItem(key).history, history)) {
                            return [true, null];
                        }
                    }

                    prefs.setItem(key, {
                        history: history,
                        time: new Date().getTime()
                    });

                    // remove legacy settings.
                    prefs.deleteItem(['jgi-search', 'settings', 'searchInputHistory']);

                    var profileUpdate = {
                        profile: {
                            profile: {
                                plugins: prefs.debug()
                            },
                            user: profile.getItem('user')
                        }
                    };

                    // Don't want to really replace, but update_user_profile only
                    return this.updateUserProfile(profileUpdate);
                })
                .catch((err) => {
                    return [null, {
                        source: 'ProfileService:get_user_profile',
                        code: 'error-getting-user-profile',
                        message: 'An error occurred attempting to save the user preferences: ' + err.message,
                        errors: [
                            err
                        ],
                        info: {
                            username: username
                        }
                    }];
                });
        }

        getHistory(name) {
            const username = this.runtime.service('session').getUsername();
            const key = ['profile', 'plugins', 'jgi-search', 'settings', 'history', name];

            return this.profileService.callFunc('get_user_profile', [[username]])
                .spread((profiles) => {
                    const profile = Props.make({
                        data: profiles[0]
                    });

                    let keys;
                    if (name === 'search') {
                        keys = [
                            key,
                            ['profile', 'plugins', 'jgi-search', 'settings', 'searchInputHistory']
                        ];
                    } else {
                        keys = [key];
                    }

                    let history= firstSuccess(keys, function (key) {
                        return profile.getItem(key);
                    });

                    if (!history) {
                        history = {
                            history: [],
                            time: new Date().getTime()
                        };
                    } else if (!(history.history instanceof Array)) {
                        history = {
                            history: [],
                            time: new Date().getTime()
                        };
                    }
                    return [history.history, null];
                })
                .catch((err) => {
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
    }
    return Profile;
});