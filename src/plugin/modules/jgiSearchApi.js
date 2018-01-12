


function monitorProgress(jobId, progress, color) {
    function checkProgress() {
        return rpc.call('jgi_gateway', 'stage_status', {
                job_id: jobId
            })
            .spread(function (result, stats) {
                // console.log('stage status is', result, stats);
                // hmph, value comes back as a simple string.
                if (!result) {
                    progress('hmm, no progress.');
                    return;
                }
                var stageStats = utils.grokStageStats(result.message);
                // console.log('grokked status', stageStats);
                progress(stageStats.status);

                color(statusConfig[stageStats.status].color);

                if (stageStats.status === 'completed') {
                    return;
                }

                window.setTimeout(checkProgress, 1000);
            })
            .catch(function (err) {
                progress(err.message);
            });
    }
    checkProgress();
}

var statusConfig = {
    queued: {
        color: 'orange',
        label: 'Queued'
    },
    restoring: {
        label: 'Restoring',
        color: 'gray'
    },
    copying: {
        label: 'Copying',
        color: 'green'
    },
    completed: {
        label: 'Completed',
        color: 'blue'
    }
};

    function doStage(stagingSpec) {
        return rpc.call('jgi_gateway', 'stage', {
                ids: [stagingSpec.indexId]
            })
            .spread(function (result) {
                if (result) {
                    stagingSpec.stagingStatus('Staging submitted with job id ' + result.job_id);
                    monitorProgress(result.job_id, stagingSpec.stagingProgress, stagingSpec.stagingProgressColor);
                } else {
                    stagingSpec.stagingStatus('unknown - see console');
                }
                return result;
            })
            .catch(function (err) {
                console.error('ERROR', err, stagingSpec);
                stagingSpec.stagingStatus('error - ' + err.message);
                throw err;
            });
    }




    function buildErrorItem() {
        return div({
            class: 'alert alert-danger',
            role: 'alert'
        }, [
            span({
                dataBind: {
                    text: 'message'
                }
            }),
            button({
                dataBind: {
                    click: '$parent.search.doRemoveError'
                },
                type: 'button',
                class: 'close',
                ariaLabel: 'Close'
            }, span({
                class: 'fa fa-times',
                ariaHidden: 'true'
            }))
        ]);
    }

    function buildMessageItem() {
        return div({
            class: 'alert',
            role: 'alert',
            dataBind: {
                css: {
                    'alert-danger': 'type === "error"',
                    'alert-warning': 'type === "warning"',
                }
            }
        }, [
            span({
                dataBind: {
                    text: 'message'
                }
            }),
            button({
                dataBind: {
                    click: '$parent.search.doRemoveMessage'
                },
                type: 'button',
                class: 'close',
                ariaLabel: 'Close'
            }, span({
                class: 'fa fa-times',
                ariaHidden: 'true'
            }))
        ]);
    }
