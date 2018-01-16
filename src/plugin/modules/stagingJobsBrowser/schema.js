define([
    'knockout-plus',
    './components/controls/startedClock',
    './components/controls/jobClock',
    './components/controls/deleteJob'
], function (
    ko,
    StartedClockComponent,
    JobClockComponent,
    DeleteJobComponent
) {
    
    var columns = [
        {
            name: 'started',
            label: 'Submitted',
            type: 'date',
            format: 'elapsed',
            width: 20,
            sort: {
                keyName: 'created',
                direction: ko.observable('descending'),
                // active: ko.observable(false) 
            },
            component: StartedClockComponent.name()
        },
        {
            name: 'status',
            label: 'Status',
            type: 'string',
            width: 20,
            sort: {
                keyName: 'status_code',
                direction: ko.observable('descending'),
                // active: ko.observable(false)
            }
        },
        {
            name: 'elapsed',
            label: 'Elapsed',
            type: 'date',
            format: 'duration',
            width: 20,
            component: JobClockComponent.name()
            // sort: {
            //     keyName: 'updated',
            //     direction: ko.observable('descending'),
            //     // active: ko.observable(false) 
            // }
        },
        
        // {
        //     name: 'path',
        //     label: 'Path',
        //     type: 'string',
        //     width: 20
        // },
        // {
        //     name: 'updated',
        //     label: 'When?',
        //     type: 'date',
        //     format: 'elapsed',
        //     width: 20,
        //     sort: {
        //         keyName: 'updated',
        //         direction: ko.observable('descending'),
        //         // active: ko.observable(false) 
        //     }
        // },
       
        {
            name: 'filename',
            label: 'Filename',
            type: 'string',
            width: 40,
            sort: {
                keyName: 'filename',
                direction: ko.observable('descending'),
                // active: ko.observable(false) 
            }
        },
        {
            name: 'jobId',
            label: 'Job ID',
            type: 'string',
            width: 20,
            // sort: {
            //     keyName: 'job_id',
            //     direction: ko.observable('descending'),
            //     active: ko.observable(true)
            // }
        },
        {
            name: 'delete',
            label: '',
            width: 10,
            component: DeleteJobComponent.name()
        }
    ];

    var columnsMap = columns.reduce(function (acc, col) {
        acc[col.name] = col;
        return acc;
    }, {});

    return {
        columns: columns,
        columnsMap: columnsMap
    };
});