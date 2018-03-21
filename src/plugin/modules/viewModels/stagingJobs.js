define([
    'knockout-plus',
    '../search/data'
], function (
    ko,
    Data
) {
    'use strict';
    function factory(config) {
        var runtime = config.runtime;
        var subscriptions = ko.kb.SubscriptionManager.make();
        var data = Data.make({
            runtime: runtime
        });

        var stagingJobs = ko.observableArray();


        var stagingJobStates = {
            sent: ko.observable(0),
            submitted: ko.observable(0),
            queued: ko.observable(0),
            restoring: ko.observable(0),
            copying: ko.observable(0),
            completed: ko.observable(0),
            error: ko.observable(0)
        };

        var stagingJobsState = ko.pureComputed(function () {
            var pending = stagingJobStates.sent() +
                stagingJobStates.submitted() +
                stagingJobStates.queued() +
                stagingJobStates.restoring() +
                stagingJobStates.copying();
        
            return {
                pending: pending,
                completed: stagingJobStates.completed(),
                some: pending + stagingJobStates.completed() + stagingJobStates.error()
            };
        });

        function updateStagingJobStates() {
            var states = {
                sent: 0,
                submitted: 0,
                queued: 0,
                restoring: 0,
                copying: 0,
                completed: 0,
                error: 0
            };
            stagingJobs().forEach(function (job) {
                var newState = job.status();
                if (newState in states) {
                    states[newState] += 1;
                } else {
                    // hack for now, get the service to return this.
                    states['error'] += 1;
                    console.warn('Staging job state unrecognized: ', newState);
                }
            });
            Object.keys(states).forEach(function (state) {
                stagingJobStates[state](states[state]);
            });
        }

        subscriptions.add(stagingJobs.subscribe(function () {
            updateStagingJobStates();
        }));

        var disposables = [];

        function jobStatusLoop(state) {
            data.getStagingJobStatus()
                // TODO: handle error!
                // .spread(function (result, error) {
                .spread(function (result) {
                    ['sent', 'submitted', 'queued', 'restoring', 'copying', 'completed', 'error'].forEach(function (state) {
                        stagingJobStates[state](result.states[state]);
                    });
                    
                })
                .finally(function () {
                    if (state.looping) {
                        state.timeoutId = window.setTimeout(function () {
                            state.timeoutId = null;
                            jobStatusLoop(state);
                        }, 10000);
                    }
                });
        }

        function start() {
            var disposable = {
                name: 'Job Status Loop',
                disposer: function () {
                    if (this.timeoutId) {
                        this.looping = false;
                        window.clearTimeout(this.timeoutId);
                        this.timeoutId = null;
                    }
                },
                looping: true,
                timoutId: null
            };
            disposables.push(disposable);
            jobStatusLoop(disposable);
        }

        function stop () {
            disposables.forEach(function (disposable) {
                try {
                    disposable.disposer.call(disposable);
                } catch (ex) {
                    console.error('ERROR running disposer "' + disposable.name + '"', ex);
                }
            });
        }

        function dispose() {
            subscriptions.dispose();
        }

        return {
            stagingJobs: stagingJobs,
            stagingJobsState: stagingJobsState,
            stagingJobStates: stagingJobStates,
            start: start,
            stop: stop,
            dispose: dispose
        };
    }

    return {
        make: factory
    };
});