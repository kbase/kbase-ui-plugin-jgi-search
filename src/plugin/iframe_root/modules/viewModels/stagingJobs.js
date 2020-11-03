define([
    'knockout',
    'kb_knockout/lib/viewModelBase',
    '../lib/model'
], function (
    ko,
    ViewModelBase,
    Model
) {
    'use strict';

    const MONITOR_INTERVAL = 10000;

    class StagingJobsViewModel extends ViewModelBase {
        constructor(params) {
            super(params);

            this.runtime = params.runtime;
            this.model = new Model({
                runtime: this.runtime
            });

            this.stagingJobs = ko.observableArray();

            this.stagingJobStates = {
                sent: ko.observable(0),
                submitted: ko.observable(0),
                queued: ko.observable(0),
                restoring: ko.observable(0),
                copying: ko.observable(0),
                completed: ko.observable(0),
                error: ko.observable(0)
            };

            this.stagingJobsState = ko.pureComputed(() => {
                var pending = this.stagingJobStates.sent() +
                    this.stagingJobStates.submitted() +
                    this.stagingJobStates.queued() +
                    this.stagingJobStates.restoring() +
                    this.stagingJobStates.copying();

                return {
                    pending: pending,
                    completed: this.stagingJobStates.completed(),
                    some: pending + this.stagingJobStates.completed() + this.stagingJobStates.error()
                };
            });

            this.subscribe(this.stagingJobs, () => {
                this.updateStagingJobStates();
            });

            this.jobStatusLooper = {
                timerId: null,
                looping: true
            };

            this.jobStatusLoop();
        }

        updateStagingJobStates() {
            var states = {
                sent: 0,
                submitted: 0,
                queued: 0,
                restoring: 0,
                copying: 0,
                completed: 0,
                error: 0
            };
            this.stagingJobs().forEach((job) => {
                var newState = job.status();
                if (newState in states) {
                    states[newState] += 1;
                } else {
                    // hack for now, get the service to return this.
                    states['error'] += 1;
                    console.warn('Staging job state unrecognized: ', newState);
                }
            });
            Object.keys(states).forEach((state) => {
                this.stagingJobStates[state](states[state]);
            });
        }

        jobStatusLoop() {
            this.model.getStagingJobStatus()
                .then(([result]) => {
                    ['sent', 'submitted', 'queued', 'restoring', 'copying', 'completed', 'error'].forEach((state) => {
                        this.stagingJobStates[state](result.states[state]);
                    });

                })
                .finally(() => {
                    if (this.jobStatusLooper.looping) {
                        this.jobStatusLooper.timerId = window.setTimeout(() => {
                            if (!this.jobStatusLooper.looping) {
                                return;
                            }
                            this.jobStatusLooper.timeoutId = null;
                            this.jobStatusLoop();
                        }, MONITOR_INTERVAL);
                    }
                });
        }

        dispose() {
            super.dispose();
            this.jobStatusLooper.looping = false;
            if (this.jobStatusLooper.timerId) {
                window.clearTimeout(this.jobStatusLooper.timerId);
            }
        }
    }

    return StagingJobsViewModel;
});