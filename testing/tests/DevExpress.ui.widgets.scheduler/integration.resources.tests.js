import $ from 'jquery';

QUnit.testStart(function() {
    $('#qunit-fixture').html(
        '<div id="scheduler">\
            <div data-options="dxTemplate: { name: \'template\' }">Task Template</div>\
            </div>');
});

import 'common.css!';
import 'generic_light.css!';

import fx from 'animation/fx';
import { DataSource } from 'data/data_source/data_source';
import CustomStore from 'data/custom_store';
import translator from 'animation/translator';
import Color from 'color';

import 'ui/scheduler/ui.scheduler';

const SCHEDULER_HORIZONTAL_SCROLLBAR = '.dx-scheduler-date-table-scrollable .dx-scrollbar-horizontal';
const SCHEDULER_SCROLLBAR_CONTAINER = '.dx-scheduler-work-space-both-scrollbar';

QUnit.module('Integration: Resources', {
    beforeEach: function() {
        fx.off = true;
        this.createInstance = function(options) {
            this.instance = $('#scheduler').dxScheduler(options).dxScheduler('instance');
        };
        this.clock = sinon.useFakeTimers();
    },
    afterEach: function() {
        fx.off = false;
        this.clock.restore();
    }
});

QUnit.test('Grouping by value = 0 in case nested groups shouldn\'t ignore(T821935)', function(assert) {
    const views = ['timelineDay', 'day'];
    const expectedValues = [
        {
            'appointment1': {
                top: 26,
                left: 0
            },
            'appointment2': {
                top: 190,
                left: 431
            }
        }, {
            'appointment1': {
                top: 0,
                left: 100
            },
            'appointment2': {
                top: 100,
                left: 406
            }
        }
    ];

    const banquetResource = [{
        text: 'Hall 1',
        id: 0
    }, {
        text: 'Hall 2',
        id: 2
    }];

    const bookingResource = [{
        id: 1,
        text: 'Confirmed',
        status_code: 'CN',
    }, {
        id: 2,
        text: 'Tentative',
        status_code: 'TN'
    }, {
        id: 3,
        text: 'Waitlisted',
        status_code: 'WL'
    }];

    const data = [{
        text: 'appointment1',
        banquetId: 0,
        status: 1,
        startDate: new Date(2015, 4, 25, 10, 0),
        endDate: new Date(2015, 4, 25, 10, 30)
    }, {
        text: 'appointment2',
        banquetId: 0,
        status: 3,
        startDate: new Date(2015, 4, 25, 11, 0),
        endDate: new Date(2015, 4, 25, 11, 30)
    }];

    const findAppointment = (instance, text) => {
        return instance.$element()
            .find('.dx-scheduler-appointment')
            .filter((index, element) => $(element).find('.dx-scheduler-appointment-title').text() === text);
    };

    this.createInstance({
        dataSource: data,
        views: views,
        currentView: views[0],
        currentDate: new Date(2015, 4, 25),
        startDayHour: 10,
        endDayHour: 12,
        height: 600,
        width: 1024,
        groups: ['banquetId', 'status'],
        resources: [{
            fieldExpr: 'banquetId',
            dataSource: banquetResource
        }, {
            fieldExpr: 'status',
            dataSource: bookingResource
        }]
    });

    views.forEach((view, index) => {
        this.instance.option('currentView', view);

        const expectedValue = expectedValues[index];
        ['appointment1', 'appointment2'].forEach(appointmentName => {
            const expectedPosition = expectedValue[appointmentName];
            const position = translator.locate(findAppointment(this.instance, appointmentName));

            assert.roughEqual(position.top, expectedPosition.top, 2, `top position of ${appointmentName} should be valid in ${view}`);
            assert.roughEqual(position.left, expectedPosition.left, 2, `left position of ${appointmentName} should be valid in ${view}`);
        });
    });
});

QUnit.test('Editor for resource should be passed to details view', function(assert) {
    const task1 = {
        text: 'Task 1',
        ownerId: 1,
        startDate: new Date(2015, 1, 9, 1, 0),
        endDate: new Date(2015, 1, 9, 2, 0)
    };
    const task2 = {
        text: 'Task 2',
        roomId: 1,
        startDate: new Date(2015, 1, 9, 1, 0),
        endDate: new Date(2015, 1, 9, 2, 0)
    };
    const roomResource = [
        {
            text: '#1',
            id: 1,
            color: '#606060'
        },
        {
            text: '#2',
            id: 2,
            color: '#606066'
        }
    ];
    const resources = [{
        field: 'ownerId',
        allowMultiple: true,
        dataSource: [
            {
                text: 'Jack',
                id: 1,
                color: '#606060'
            },
            {
                text: 'Mike',
                id: 2,
                color: '#ff0000'
            }
        ]
    }, {
        field: 'roomId',
        allowMultiple: false,
        dataSource: new DataSource(roomResource)
    }];

    this.createInstance({
        resources: resources,
        dataSource: new DataSource({
            store: [task1, task2]
        }),
        currentDate: new Date(2015, 1, 9)
    });

    this.clock.tick();
    this.instance.showAppointmentPopup(task1);

    let taskDetailsView = this.instance.getAppointmentDetailsForm();
    const ownerEditor = taskDetailsView.option('items')[10];

    ownerEditor.editorOptions.dataSource.load();

    assert.ok(taskDetailsView.getEditor('ownerId'), 'Editor is exist');
    assert.equal(ownerEditor.editorType, 'dxTagBox', 'Editor is dxTagBox');
    assert.deepEqual(ownerEditor.editorOptions.dataSource.items(), resources[0].dataSource, 'Data source is OK');
    assert.deepEqual(taskDetailsView.option('formData').ownerId, [1], 'Value is OK');


    this.instance.showAppointmentPopup(task2);
    taskDetailsView = this.instance.getAppointmentDetailsForm();

    const roomEditor = taskDetailsView.option('items')[11];

    roomEditor.editorOptions.dataSource.load();

    assert.ok(taskDetailsView.getEditor('roomId'), 'Editor is exist');
    assert.equal(roomEditor.editorType, 'dxSelectBox', 'Editor is dxSelectBox');
    assert.strictEqual(taskDetailsView.option('formData').roomId, 1, 'Value is OK');
    assert.deepEqual(roomEditor.editorOptions.dataSource.items(), roomResource, 'Data source is OK');
});

QUnit.test('Editor for resource should be passed to details view for scheduler with groups', function(assert) {
    const task = {
        text: 'Task 1',
        ownerId: 1,
        startDate: new Date(2015, 1, 9, 1, 0),
        endDate: new Date(2015, 1, 9, 2, 0)
    };
    const resources = [{
        field: 'ownerId',
        allowMultiple: true,
        displayExpr: 'name',
        dataSource: [
            {
                name: 'Jack',
                id: 1,
                color: '#606060'
            },
            {
                name: 'Mike',
                id: 2,
                color: '#ff0000'
            }
        ]
    }];
    this.createInstance({
        resources: resources,
        groups: ['ownerId'],
        dataSource: new DataSource({
            store: [task]
        }),
        currentDate: new Date(2015, 1, 9)
    });

    this.clock.tick();
    this.instance.showAppointmentPopup(task);

    const taskDetailsView = this.instance.getAppointmentDetailsForm();
    const ownerEditor = taskDetailsView.option('items')[10];


    assert.equal(ownerEditor.editorType, 'dxTagBox', 'Editor is dxTagBox');
    assert.deepEqual(ownerEditor.editorOptions.dataSource, resources[0].dataSource, 'Data source is OK');
    assert.equal(ownerEditor.editorOptions.displayExpr, resources[0].displayExpr, 'displayExpr is OK');
});

QUnit.test('Editor for resource with right value should be passed to details view when fieldExpr is used', function(assert) {
    const appointment = {
        'Price': 10,
        'startDate': new Date(2015, 4, 24, 9, 10, 0, 0),
        'endDate': new Date(2015, 4, 24, 11, 1, 0, 0),
        'Movie': {
            'ID': 3
        },
        'TheatreId': 1
    };

    const resources = [{
        fieldExpr: 'Movie.ID',
        useColorAsDefault: true,
        allowMultiple: false,
        dataSource: [{
            'ID': 1,
            'Color': 'blue'
        }, {
            'ID': 3,
            'Color': 'red'
        }],
        valueExpr: 'ID',
        colorExpr: 'Color'
    }, {
        fieldExpr: 'TheatreId',
        dataSource: [{
            id: 1
        }, {
            id: 2
        }]
    }];
    this.createInstance({
        resources: resources,
        dataSource: [appointment],
        currentDate: new Date(2015, 4, 24)
    });

    this.clock.tick();
    this.instance.showAppointmentPopup(appointment);

    const taskDetailsView = this.instance.getAppointmentDetailsForm();
    const movieEditor = taskDetailsView.option('items')[10];

    movieEditor.editorOptions.dataSource.load();

    assert.deepEqual(movieEditor.editorOptions.dataSource.items(), resources[0].dataSource, 'Data source is OK');
    assert.strictEqual(taskDetailsView.option('formData').Movie.ID, 3, 'Value is OK');
});

QUnit.test('Alias for getResourceDataByValue method', function(assert) {
    this.createInstance({
        resources: [{
            field: 'ownerId',
            dataSource: [
                {
                    text: 'Jack',
                    id: 1,
                    color: '#606060'
                }
            ]
        }]
    });

    const done = assert.async();

    this.instance.getResourceManager().getResourceDataByValue('ownerId', 1).done(function(resource) {
        assert.deepEqual(resource, {
            text: 'Jack',
            id: 1,
            color: '#606060'
        }, 'Resource was found');

        done();
    });

});

QUnit.test('Appointments should be repainted if \'groups\' option is changed', function(assert) {
    this.createInstance({
        dataSource: new DataSource({
            store: [{ text: 'a', startDate: new Date(2015, 4, 26, 5), endDate: new Date(2015, 4, 26, 5, 30), ownerId: [1, 2], roomId: [1, 2] }]
        }),
        currentDate: new Date(2015, 4, 26),
        groups: ['ownerId', 'roomId'],
        resources: [{
            field: 'ownerId',
            allowMultiple: true,
            dataSource: [
                { text: 'o1', id: 1 },
                { text: 'o2', id: 2 }
            ]
        }, {
            field: 'roomId',
            allowMultiple: true,
            dataSource: [
                { text: 'r1', id: 1 },
                { text: 'r2', id: 2 }
            ]
        }]
    });

    assert.equal(this.instance.$element().find('.dx-scheduler-appointment').length, 4, 'Appointments are OK');

    this.instance.option('groups', ['ownerId']);
    assert.equal(this.instance.$element().find('.dx-scheduler-appointment').length, 2, 'Appointments are OK');
});

QUnit.test('Resources should be loaded only once to calculate appts color', function(assert) {
    const loadStub = sinon.stub().returns([
        { text: 'o1', id: 1 },
        { text: 'o2', id: 2 }
    ]);
    this.createInstance({
        dataSource: new DataSource({
            store: [{
                text: 'a',
                startDate: new Date(2015, 4, 26, 5),
                endDate: new Date(2015, 4, 26, 5, 30),
                ownerId: 1
            }, {
                text: 'b',
                startDate: new Date(2015, 4, 26, 5),
                endDate: new Date(2015, 4, 26, 5, 30),
                ownerId: 2
            }]
        }),
        currentDate: new Date(2015, 4, 26),
        groups: ['ownerId'],
        resources: [{
            fieldExpr: 'ownerId',
            allowMultiple: true,
            dataSource: new CustomStore({
                load: loadStub
            })
        }]
    });

    assert.equal(loadStub.callCount, 1, 'Resources are loaded only once');
});

QUnit.test('Paint appts if groups array don\'t contain all resources', function(assert) {
    this.createInstance({
        dataSource: new DataSource({
            store: [{
                text: 'a',
                startDate: new Date(2015, 4, 26, 5),
                endDate: new Date(2015, 4, 26, 5, 30),
                ownerId: 1,
                roomId: [1]
            }, {
                text: 'b',
                startDate: new Date(2015, 4, 26, 5),
                endDate: new Date(2015, 4, 26, 5, 30),
                ownerId: 2,
                roomId: 2
            }]
        }),
        currentDate: new Date(2015, 4, 26),
        groups: ['ownerId'],
        resources: [{
            fieldExpr: 'ownerId',
            allowMultiple: true,
            dataSource: [
                { text: 'o1', id: 1 },
                { text: 'o2', id: 2 }
            ]
        }, {
            fieldExpr: 'roomId',
            allowMultiple: true,
            useColorAsDefault: true,
            dataSource: [
                { text: 'o1', id: 1, color: 'red' },
                { text: 'o2', id: 2, color: 'blue' }
            ]
        }]
    });

    const $appointments = this.instance.$element().find('.dx-scheduler-appointment');

    assert.equal(new Color($appointments.eq(0).css('backgroundColor')).toHex(), '#ff0000', 'Color is OK');
    assert.equal(new Color($appointments.eq(1).css('backgroundColor')).toHex(), '#0000ff', 'Color is OK');
});

QUnit.test('Resources should not be reloaded when details popup is opening', function(assert) {
    const loadStub = sinon.stub().returns([
        { text: 'o1', id: 1 },
        { text: 'o2', id: 2 }
    ]);
    const byKeyStub = sinon.stub();
    const data = [{
        text: 'a',
        startDate: new Date(2015, 4, 26, 5),
        endDate: new Date(2015, 4, 26, 5, 30),
        ownerId: 1
    }, {
        text: 'b',
        startDate: new Date(2015, 4, 26, 5),
        endDate: new Date(2015, 4, 26, 5, 30),
        ownerId: 2
    }];
    this.createInstance({
        dataSource: new DataSource({
            store: data
        }),
        currentDate: new Date(2015, 4, 26),
        groups: ['ownerId'],
        resources: [{
            fieldExpr: 'ownerId',
            allowMultiple: true,
            dataSource: new CustomStore({
                load: loadStub,
                byKey: byKeyStub
            })
        }]
    });

    this.instance.showAppointmentPopup(data[0]);

    assert.equal(loadStub.callCount, 1, 'Resources are loaded only once');
    assert.equal(byKeyStub.callCount, 0, 'Resources are loaded only once');
});

QUnit.test('Resources should be set correctly is the resources[].dataSource option is changed(T396746)', function(assert) {
    const resourceData = [{ id: 1, text: 'John', color: 'red' }];
    this.createInstance({
        dataSource: [],
        currentDate: new Date(2015, 4, 26),
        groups: ['ownerId'],
        resources: [{
            fieldExpr: 'ownerId',
            dataSource: []
        }]
    });

    this.instance.option('resources[0].dataSource', resourceData);
    const resources = this.instance.getResourceManager().getResources();

    assert.deepEqual(resources, [{
        fieldExpr: 'ownerId',
        dataSource: resourceData
    }], 'Resources were changed correctly');
});

QUnit.test('Appointment should have correct color after resources option changing', function(assert) {
    this.createInstance({
        dataSource: new DataSource({
            store: [{
                text: 'a',
                startDate: new Date(2015, 4, 26, 5),
                endDate: new Date(2015, 4, 26, 5, 30),
                roomId: [1]
            }]
        }),
        startDayHour: 4,
        currentDate: new Date(2015, 4, 26)
    });

    this.instance.option('resources', [
        {
            fieldExpr: 'roomId',
            dataSource: [
                { text: 'o1', id: 1, color: 'red' },
                { text: 'o2', id: 2, color: 'blue' }
            ]
        }]);

    const $appointments = this.instance.$element().find('.dx-scheduler-appointment');
    assert.equal(new Color($appointments.eq(0).css('backgroundColor')).toHex(), '#ff0000', 'Color is OK');
});

QUnit.module('Integration: Multiple resources', {
    beforeEach: function() {
        $('#qunit-fixture').css({ top: 0, left: 0 });
        this.createInstance = (options) => {
            this.instance = $('#scheduler').dxScheduler(options).dxScheduler('instance');
        };
        $('#qunit-fixture').html(
            `<div style="width: 400px; height: 500px;">
                <div id="scheduler" style="height: 100%;">
                    <div data-options="dxTemplate: { name: 'template' }">Task Template</div>
                </div>
            </div>`);
    },
    afterEach: function() {
        $('#qunit-fixture').css({ top: '-10000px', left: '-10000px' });
    }
}, () => {
    QUnit.test('Scheduler with multiple resources and fixed height container has visible horizontal scrollbar (T716993)', function(assert) {
        const getData = function(count) {
            const result = [];
            for(let i = 0; i < count; i++) {
                result.push({
                    facilityId: i,
                    facilityName: i.toString(),
                });
            }
            return result;
        };

        this.createInstance({
            groups: ['facilityId'],
            crossScrollingEnabled: true,
            dataSource: [],
            resources: [{
                dataSource: getData(10),
                displayExpr: 'facilityName',
                valueExpr: 'facilityId',
                fieldExpr: 'facilityId',
                allowMultiple: false,
            }]
        });
        const scrollbar = $(this.instance.$element()).find(SCHEDULER_HORIZONTAL_SCROLLBAR);
        assert.roughEqual(scrollbar.offset().top + scrollbar.outerHeight(), $(this.instance.$element()).find(SCHEDULER_SCROLLBAR_CONTAINER).outerHeight(), 1, 'Horizontal scrollbar has visible top coordinate');
    });
});
