require('common.css!');
require('generic_light.css!');
require('ui/scheduler/workspaces/ui.scheduler.timeline');
require('ui/scheduler/workspaces/ui.scheduler.timeline_day');
require('ui/scheduler/workspaces/ui.scheduler.timeline_week');
require('ui/scheduler/workspaces/ui.scheduler.timeline_work_week');
require('ui/scheduler/workspaces/ui.scheduler.timeline_month');

const pointerMock = require('../../helpers/pointerMock.js');
const keyboardMock = require('../../helpers/keyboardMock.js');

const $ = require('jquery');
const SchedulerResourcesManager = require('ui/scheduler/ui.scheduler.resource_manager');
const domUtils = require('core/utils/dom');
const resizeCallbacks = require('core/utils/resize_callbacks');
const dateUtils = require('core/utils/date');

QUnit.testStart(function() {
    $('#qunit-fixture').html('<div id="scheduler-timeline"></div>\
                                <div id="scheduler-timeline-rtl"></div>');
});

const CELL_CLASS = 'dx-scheduler-date-table-cell';

const stubInvokeMethod = function(instance) {
    sinon.stub(instance, 'invoke', function() {
        const subscribe = arguments[0];
        if(subscribe === 'createResourcesTree') {
            return new SchedulerResourcesManager().createResourcesTree(arguments[1]);
        }
        if(subscribe === 'convertDateByTimezone') {
            return arguments[1];
        }
    });
};

QUnit.module('Timeline Base', {

    beforeEach: function() {
        this.createInstance = function(options) {
            if(this.instance) {
                this.instance.invoke.restore();
                delete this.instance;
            }

            this.instance = $('#scheduler-timeline').dxSchedulerTimeline().dxSchedulerTimeline('instance');
            stubInvokeMethod(this.instance, options);
        };

        this.createInstance();
    }
});

QUnit.test('Header scrollable should update position if date scrollable position is changed to right', function(assert) {
    const $element = this.instance.$element();
    const headerScrollable = $element.find('.dx-scheduler-header-scrollable').dxScrollable('instance');
    const dateTableScrollable = $element.find('.dx-scheduler-date-table-scrollable').dxScrollable('instance');

    domUtils.triggerHidingEvent($element);
    domUtils.triggerShownEvent($element);

    dateTableScrollable.scrollTo({ left: 100 });

    assert.equal(headerScrollable.scrollLeft(), 100, 'Scroll position is OK');
});

QUnit.test('Header scrollable should have right scrolloByContent (T708008)', function(assert) {
    const $element = this.instance.$element();
    const headerScrollable = $element.find('.dx-scheduler-header-scrollable').dxScrollable('instance');

    assert.strictEqual(headerScrollable.option('scrollByContent'), true, 'scrolloByContent is OK');
});


QUnit.test('Header scrollable shouldn\'t update position if date scrollable position is changed to bottom', function(assert) {
    const $element = this.instance.$element();
    const headerScrollable = $element.find('.dx-scheduler-header-scrollable').dxScrollable('instance');
    const dateTableScrollable = $element.find('.dx-scheduler-date-table-scrollable').dxScrollable('instance');

    domUtils.triggerHidingEvent($element);
    domUtils.triggerShownEvent($element);

    dateTableScrollable.scrollTo({ top: 100 });

    assert.equal(headerScrollable.scrollLeft(), 0, 'Scroll position is OK');
});

QUnit.test('Date table should have a correct width if cell is less than 75px', function(assert) {
    this.instance.option('crossScrollingEnabled', true);

    const $element = this.instance.$element();
    const $cells = $element.find('.dx-scheduler-date-table-cell');

    $cells.css('width', 30);

    domUtils.triggerHidingEvent($element);
    domUtils.triggerShownEvent($element);

    const dateTableWidth = $element.find('.dx-scheduler-date-table').outerWidth();
    assert.equal(dateTableWidth, 1440, 'Width is OK');
});

QUnit.test('Sidebar scrollable should update position if date scrollable position is changed', function(assert) {
    this.instance.option({
        crossScrollingEnabled: true,
        width: 400,
        height: 200,
        groups: [{ name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }, { id: 3, text: 'c' }, { id: 4, text: 'd' }] }]
    });

    const $element = this.instance.$element();
    const groupPanelScrollable = $element.find('.dx-scheduler-sidebar-scrollable').dxScrollable('instance');
    const dateTableScrollable = $element.find('.dx-scheduler-date-table-scrollable').dxScrollable('instance');

    domUtils.triggerHidingEvent($element);
    domUtils.triggerShownEvent($element);

    dateTableScrollable.scrollTo({ top: 200 });

    assert.equal(groupPanelScrollable.scrollTop(), 200, 'Scroll position is OK');
});

QUnit.test('Date table scrollable should update position if sidebar position is changed', function(assert) {
    this.instance.option({
        crossScrollingEnabled: true,
        width: 400,
        height: 200,
        groups: [{ name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }, { id: 3, text: 'c' }, { id: 4, text: 'd' }] }]
    });

    const $element = this.instance.$element();
    const groupPanelScrollable = $element.find('.dx-scheduler-sidebar-scrollable').dxScrollable('instance');
    const dateTableScrollable = $element.find('.dx-scheduler-date-table-scrollable').dxScrollable('instance');

    domUtils.triggerHidingEvent($element);
    domUtils.triggerShownEvent($element);

    groupPanelScrollable.scrollTo({ top: 200 });

    assert.equal(dateTableScrollable.scrollTop(), 200, 'Scroll position is OK');
});

QUnit.test('Date table scrollable should update position if header scrollable position is changed', function(assert) {
    const $element = this.instance.$element();
    const headerScrollable = $element.find('.dx-scheduler-header-scrollable').dxScrollable('instance');
    const dateTableScrollable = $element.find('.dx-scheduler-date-table-scrollable').dxScrollable('instance');

    domUtils.triggerHidingEvent($element);
    domUtils.triggerShownEvent($element);

    headerScrollable.scrollTo({ left: 100 });

    assert.equal(dateTableScrollable.scrollLeft(), 100, 'Scroll position is OK');
});

QUnit.test('Sidebar should be hidden in simple mode', function(assert) {
    const $element = this.instance.$element();

    const $sidebar = $element.find('.dx-scheduler-sidebar-scrollable');

    assert.equal($sidebar.css('display'), 'none', 'Sidebar is invisible');
});

QUnit.test('Sidebar should be visible in grouped mode', function(assert) {
    const $element = this.instance.$element();

    this.instance.option('groups', [{ name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }] }]);
    const $sidebar = $element.find('.dx-scheduler-sidebar-scrollable');

    assert.equal($sidebar.css('display'), 'block', 'Sidebar is visible');
});

QUnit.test('Fixed appointments container should have correct left', function(assert) {
    const $element = this.instance.$element();

    this.instance.option('groups', [
        { name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }] },
        { name: 'two', items: [{ id: 1, text: 'c' }, { id: 2, text: 'd' }] }
    ]);

    const $fixedAppt = $element.find('.dx-scheduler-fixed-appointments');
    const $sidebar = $element.find('.dx-scheduler-sidebar-scrollable');

    assert.equal($fixedAppt.position().left, $sidebar.outerWidth(true), 'Container position is correct');
});

QUnit.test('Group table cells should have correct height', function(assert) {
    const $element = this.instance.$element();

    this.instance.option('groups', [
        { name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }] },
        { name: 'two', items: [{ id: 1, text: '1' }, { id: 2, text: '2' }] }
    ]);

    const $groupTable = $element.find('.dx-scheduler-sidebar-scrollable .dx-scheduler-group-table');
    const $groupRows = $groupTable.find('.dx-scheduler-group-row');
    const $groupHeader = $groupRows.eq(1).find('.dx-scheduler-group-header').eq(0);
    const dateTableCellHeight = $element.find('.dx-scheduler-date-table-cell').get(0).getBoundingClientRect().height;
    const groupHeaderHeight = $groupHeader.get(0).getBoundingClientRect().height;

    assert.roughEqual(dateTableCellHeight, groupHeaderHeight, 1.1, 'Cell height is OK');
});

QUnit.test('the \'getCoordinatesByDate\' method should return right coordinates', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 10, 16),
        startDayHour: 9,
        hoursInterval: 1
    });

    const coordinates = this.instance.getCoordinatesByDate(new Date(2015, 10, 16, 10, 30), 0, false);
    const $expectedCell = this.instance.$element()
        .find('.dx-scheduler-date-table-cell').eq(1);
    const expectedPositionLeft = $expectedCell.position().left + 0.5 * $expectedCell.outerWidth();

    assert.roughEqual(coordinates.left, expectedPositionLeft, 1.001, 'left coordinate is OK');
});

QUnit.test('the \'getCoordinatesByDate\' method should return right coordinates for rtl mode', function(assert) {
    this.createInstance({ rtlEnabled: true });

    this.instance.option({
        width: 100,
        currentDate: new Date(2015, 10, 16),
        startDayHour: 9,
        hoursInterval: 1
    });

    const coordinates = this.instance.getCoordinatesByDate(new Date(2015, 10, 16, 10, 30), 0, false);
    const $expectedCell = this.instance.$element()
        .find('.dx-scheduler-date-table-cell').eq(1);

    const expectedPositionLeft = $expectedCell.position().left + $expectedCell.outerWidth() - 0.5 * $expectedCell.outerWidth();

    assert.roughEqual(coordinates.left, expectedPositionLeft, 1.001, 'left coordinate is OK');
});

QUnit.test('the \'getCoordinatesByDate\' method should return right coordinates for grouped timeline', function(assert) {
    const instance = $('#scheduler-timeline').dxSchedulerTimelineDay({
        'currentDate': new Date(2015, 9, 28),
        groupOrientation: 'vertical'
    }).dxSchedulerTimelineDay('instance');

    stubInvokeMethod(instance);
    try {
        instance.option('groups', [
            { name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }] },
            { name: 'two', items: [{ id: 1, text: '1' }, { id: 2, text: '2' }] }
        ]);
        const coordinates = instance.getCoordinatesByDate(new Date(2015, 9, 28, 1), 1);
        const expectedPosition = instance.$element()
            .find('.dx-scheduler-date-table-row').eq(1)
            .find('.dx-scheduler-date-table-cell').eq(2)
            .position();

        assert.equal(coordinates.left, expectedPosition.left, 'Coordinates are OK');
        assert.equal(coordinates.top, expectedPosition.top, 'Coordinates are OK');
    } finally {
        instance.invoke.restore();
    }
});


QUnit.test('the \'getCellIndexByCoordinates\' method should return right coordinates', function(assert) {
    const cellWidth = this.instance.$element().find('.dx-scheduler-date-table-cell').eq(0).outerWidth();
    const cellIndex = this.instance.getCellIndexByCoordinates({ left: cellWidth * 15, top: 1 });

    assert.equal(cellIndex, 15, 'Cell index is OK');
});

QUnit.test('the \'getCellIndexByCoordinates\' method should return right coordinates for fractional value', function(assert) {
    this.instance.option('groups', [
        { name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }] },
        { name: 'two', items: [{ id: 1, text: '1' }, { id: 2, text: '2' }] }
    ]);

    const cellWidth = this.instance.$element().find('.dx-scheduler-date-table-cell').eq(0).outerWidth();
    const cellHeight = this.instance.$element().find('.dx-scheduler-date-table-cell').eq(0).outerHeight();

    let cellIndex = this.instance.getCellIndexByCoordinates({ left: cellWidth * 15 + 0.656, top: cellHeight * 2 - 0.656 });

    assert.equal(cellIndex, 63, 'Cell index is OK');

    cellIndex = this.instance.getCellIndexByCoordinates({ left: cellWidth + 0.656, top: cellHeight - 0.656 });

    assert.equal(cellIndex, 1, 'Cell index is OK');

    cellIndex = this.instance.getCellIndexByCoordinates({ left: cellWidth + 0.656, top: cellHeight + 0.656 });

    assert.equal(cellIndex, 49, 'Cell index is OK');
});

QUnit.test('Timeline should not have time panel offset', function(assert) {
    const offset = this.instance.getTimePanelWidth();

    assert.strictEqual(offset, 0, 'Offset is 0');
});

QUnit.test('Tables should be rerendered if dimension was changed and horizontal scrolling is enabled', function(assert) {
    this.instance.option('crossScrollingEnabled', true);
    const stub = sinon.stub(this.instance, '_setTableSizes');

    resizeCallbacks.fire();

    assert.ok(stub.calledOnce, 'Tables were updated');
});

QUnit.test('dateUtils.getTimezonesDifference should be called when calculating interval between dates', function(assert) {
    const stub = sinon.stub(dateUtils, 'getTimezonesDifference');
    const minDate = new Date('Thu Mar 10 2016 00:00:00 GMT-0500');
    const maxDate = new Date('Mon Mar 15 2016 00:00:00 GMT-0400');

    this.instance._getIntervalBetween(minDate, maxDate, true);

    assert.ok(stub.calledOnce, 'getTimezonesDifference was called');

    dateUtils.getTimezonesDifference.restore();
});

QUnit.test('Ensure cell min height is equal to cell height(T389468)', function(assert) {
    const stub = sinon.stub(this.instance, 'getCellHeight').returns(10);

    this.instance.option({
        groups: [
            { name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }] }
        ],
        height: 400
    });

    try {
        this.instance.option('currentDate', new Date(2010, 10, 10));
        const height = this.instance.$element().find('.dx-scheduler-group-header').eq(0).outerHeight();
        const expectedHeight = this.instance.$element().find('.dx-scheduler-date-table-cell').first().outerHeight() - 1;

        assert.roughEqual(height, expectedHeight, 2.001, 'Group cell height is OK');

    } finally {
        stub.restore();
    }
});

QUnit.module('Timeline Day', {
    beforeEach: function() {
        this.instance = $('#scheduler-timeline').dxSchedulerTimelineDay().dxSchedulerTimelineDay('instance');
        stubInvokeMethod(this.instance);
    }
});

QUnit.test('Get visible bounds', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 5, 30),
        height: 400,
        width: 950
    });

    const scrollable = this.instance.getScrollable();

    domUtils.triggerShownEvent(this.instance.$element());

    scrollable.scrollBy(0);

    const bounds = this.instance.getVisibleBounds();

    assert.deepEqual(bounds.left, { hours: 0, minutes: 0, date: new Date(2015, 5, 30) }, 'Left bound is OK');
    assert.deepEqual(bounds.right, { hours: 2, minutes: 0, date: new Date(2015, 5, 30) }, 'Right bound is OK');
});

QUnit.test('Get visible bounds if scroll position is not null', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 5, 30),
        height: 400,
        width: 950
    });

    const scrollable = this.instance.getScrollable();

    domUtils.triggerShownEvent(this.instance.$element());

    scrollable.scrollBy(1000);

    const bounds = this.instance.getVisibleBounds();

    assert.deepEqual(bounds.left, { hours: 2, minutes: 30, date: new Date(2015, 5, 30) }, 'Left bound is OK');
    assert.deepEqual(bounds.right, { hours: 4, minutes: 30, date: new Date(2015, 5, 30) }, 'Right bound is OK');
});

QUnit.test('Get visible bounds if hoursInterval is set', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 2, 2),
        height: 400,
        width: 850,
        hoursInterval: 1.5
    });

    const scrollable = this.instance.getScrollable();

    domUtils.triggerShownEvent(this.instance.$element());

    scrollable.scrollBy(1000);

    const bounds = this.instance.getVisibleBounds();

    assert.deepEqual(bounds.left, { hours: 7, minutes: 30, date: new Date(2015, 2, 2) }, 'Left bound is OK');
    assert.deepEqual(bounds.right, { hours: 13, minutes: 30, date: new Date(2015, 2, 2) }, 'Right bound is OK');
});

QUnit.module('Timeline Day, groupOrientation = horizontal', {
    beforeEach: function() {
        this.instance = $('#scheduler-timeline').dxSchedulerTimelineDay({
            groupOrientation: 'horizontal'
        }).dxSchedulerTimelineDay('instance');
        stubInvokeMethod(this.instance);

        this.instance.option('groups', [{ name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }] }]);
    }
});

QUnit.test('Get visible bounds, groupOrientation = horizontal', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 5, 30),
        height: 400,
        width: 950
    });

    const scrollable = this.instance.getScrollable();

    domUtils.triggerShownEvent(this.instance.$element());

    scrollable.scrollBy(0);

    const bounds = this.instance.getVisibleBounds();

    assert.deepEqual(bounds.left, { hours: 0, minutes: 0, date: new Date(2015, 5, 30) }, 'Left bound is OK');
    assert.deepEqual(bounds.right, { hours: 2, minutes: 0, date: new Date(2015, 5, 30) }, 'Right bound is OK');
});

QUnit.test('Sidebar should not be visible in grouped mode, groupOrientation = horizontal', function(assert) {
    const $element = this.instance.$element();

    const $sidebar = $element.find('.dx-scheduler-sidebar-scrollable');

    assert.equal($sidebar.css('display'), 'none', 'Sidebar is visible');
});

QUnit.test('Group table cells should have correct height, groupOrientation = horizontal', function(assert) {
    const $element = this.instance.$element();

    const $groupRows = $element.find('.dx-scheduler-header-panel .dx-scheduler-group-row');
    const $groupHeader = $groupRows.eq(0).find('.dx-scheduler-group-header').eq(0);
    const groupHeaderHeight = $groupHeader.get(0).getBoundingClientRect().height;

    assert.roughEqual(40, groupHeaderHeight, 1.1, 'Cell height is OK');
});

QUnit.test('the \'getCoordinatesByDate\' method should return right coordinates for grouped timeline, groupOrientation = horizontal', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 9, 21),
        firstDayOfWeek: 1,
        startDayHour: 5,
        endDayHour: 8,
        hoursInterval: 1
    });

    const coordinates = this.instance.getCoordinatesByDate(new Date(2015, 9, 21, 6), 1);
    const expectedPosition = this.instance.$element()
        .find('.dx-scheduler-date-table-row').eq(0)
        .find('.dx-scheduler-date-table-cell').eq(4)
        .position();

    assert.equal(coordinates.left, expectedPosition.left, 'Coordinates are OK');
    assert.equal(coordinates.top, expectedPosition.top, 'Coordinates are OK');

});

QUnit.module('Timeline Week', {
    beforeEach: function() {
        this.instance = $('#scheduler-timeline').dxSchedulerTimelineWeek().dxSchedulerTimelineWeek('instance');
        stubInvokeMethod(this.instance);
    }
});

QUnit.test('Scheduler timeline week header cells should have right width', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 9, 29)
    });
    const $element = this.instance.$element();
    const $firstRow = $element.find('.dx-scheduler-header-row').first();
    const $lastRow = $element.find('.dx-scheduler-header-row').last();
    const $firstHeaderCell = $firstRow.find('.dx-scheduler-header-panel-cell').eq(0);
    const $lastHeaderCell = $lastRow.find('.dx-scheduler-header-panel-cell').eq(0);

    assert.roughEqual($firstHeaderCell.outerWidth(), 48 * $lastHeaderCell.outerWidth(), 1.5, 'First row cell has correct width');
});

QUnit.test('Scheduler timeline week header cells should have right width if crossScrollingEnabled = true', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 9, 29),
        crossScrollingEnabled: true
    });

    resizeCallbacks.fire();

    const $element = this.instance.$element();
    const $firstRow = $element.find('.dx-scheduler-header-row').first();
    const $lastRow = $element.find('.dx-scheduler-header-row').last();
    const $firstHeaderCell = $firstRow.find('.dx-scheduler-header-panel-cell').eq(0);
    const $lastHeaderCell = $lastRow.find('.dx-scheduler-header-panel-cell').eq(0);
    const $dateTableCell = $element.find('.dx-scheduler-date-table-cell').eq(0);

    assert.roughEqual($firstHeaderCell.outerWidth(), 48 * $lastHeaderCell.get(0).getBoundingClientRect().width, 1.5, 'First row cell has correct width');
    assert.roughEqual($lastHeaderCell.outerWidth(), $dateTableCell.get(0).getBoundingClientRect().width, 1.5, 'Last row cell has correct width');
});

QUnit.test('Scheduler timeline week cells should have right height if crossScrollingEnabled = true', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 9, 29),
        crossScrollingEnabled: true,
        groups: [{ name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' } ] }]
    });

    resizeCallbacks.fire();

    const $element = this.instance.$element();
    const $firstRowCell = $element.find('.dx-scheduler-date-table-cell').first();
    const $lastRowCell = $element.find('.dx-scheduler-date-table-cell').eq(336);

    assert.roughEqual($firstRowCell.outerHeight(), $lastRowCell.outerHeight(), 1.5, 'Cells has correct height');
});

QUnit.test('The part of long appointment should have right coordinates on current week (T342192)', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 1, 23),
        firstDayOfWeek: 1,
        startDayHour: 1,
        endDayHour: 10,
        hoursInterval: 0.5
    });
    const coordinates = this.instance.getCoordinatesByDate(new Date(2015, 2, 1, 0, 30), 0, false);
    const $expectedCell = this.instance.$element().find('.dx-scheduler-date-table-cell').eq(108);

    const expectedPositionLeft = $expectedCell.position().left;

    assert.roughEqual(coordinates.left, expectedPositionLeft, 1.001, 'left coordinate is OK');

});

QUnit.test('The part of long appointment should have right coordinates on current week (T342192)', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 1, 23),
        firstDayOfWeek: 1,
        startDayHour: 1,
        endDayHour: 10,
        hoursInterval: 0.5
    });
    const coordinates = this.instance.getCoordinatesByDate(new Date(2015, 1, 28, 10, 30), 0, false);
    const $expectedCell = this.instance.$element().find('.dx-scheduler-date-table-cell').eq(108);

    const expectedPositionLeft = $expectedCell.position().left;

    assert.roughEqual(coordinates.left, expectedPositionLeft, 1.001, 'left coordinate is OK');

});

QUnit.test('The part of long appointment should have right coordinates on current week (T342192)', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 1, 23),
        firstDayOfWeek: 1,
        startDayHour: 1,
        endDayHour: 10,
        hoursInterval: 0.5
    });
    const coordinates = this.instance.getCoordinatesByDate(new Date(2015, 2, 1, 4, 30), 0, false);
    const $expectedCell = this.instance.$element().find('.dx-scheduler-date-table-cell').eq(115);

    const expectedPositionLeft = $expectedCell.position().left;

    assert.roughEqual(coordinates.left, expectedPositionLeft, 1.001, 'left coordinate is OK');

});

QUnit.test('Timeline should find cell coordinates by date depend on start/end day hour & hoursInterval', function(assert) {
    const $element = this.instance.$element();

    this.instance.option({
        currentDate: new Date(2015, 2, 1),
        firstDayOfWeek: 0,
        startDayHour: 5,
        endDayHour: 10,
        hoursInterval: 0.75
    });

    const coords = this.instance.getCoordinatesByDate(new Date(2015, 2, 2, 8, 0));

    assert.equal(coords.top, $element.find('.dx-scheduler-date-table-cell').eq(11).position().top, 'Cell coordinates are right');
    assert.equal(coords.left, $element.find('.dx-scheduler-date-table-cell').eq(11).position().left, 'Cell coordinates are right');
});

QUnit.test('Get visible bounds for timelineWeek on init', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 2, 2),
        firstDayOfWeek: 1,
        startDayHour: 1,
        height: 400,
        width: 850
    });

    const scrollable = this.instance.getScrollable();

    domUtils.triggerShownEvent(this.instance.$element());

    scrollable.scrollBy(0);

    const bounds = this.instance.getVisibleBounds();

    assert.deepEqual(bounds.left, { hours: 1, minutes: 0, date: new Date(2015, 2, 2) }, 'Left bound is OK');
    assert.deepEqual(bounds.right, { hours: 3, minutes: 0, date: new Date(2015, 2, 2) }, 'Right bound is OK');
});

QUnit.test('Get visible bounds for timelineWeek', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 2, 2),
        firstDayOfWeek: 1,
        height: 400,
        width: 850
    });
    const scrollable = this.instance.getScrollable();

    domUtils.triggerShownEvent(this.instance.$element());

    scrollable.scrollBy(10600);

    const bounds = this.instance.getVisibleBounds();

    assert.deepEqual(bounds.left, { hours: 2, minutes: 30, date: new Date(2015, 2, 3) }, 'Left bound is OK');
    assert.deepEqual(bounds.right, { hours: 4, minutes: 30, date: new Date(2015, 2, 3) }, 'Right bound is OK');
});

QUnit.test('Get visible bounds for timelineWeek, rtl mode', function(assert) {
    const instance = $('#scheduler-timeline-rtl').dxSchedulerTimelineWeek({
        width: 850,
        rtlEnabled: true,
        currentDate: new Date(2015, 2, 2),
        firstDayOfWeek: 1,
        height: 400
    }).dxSchedulerTimelineWeek('instance');

    const scrollable = instance.getScrollable();

    domUtils.triggerShownEvent(instance.$element());

    scrollable.scrollBy(-10600);

    const bounds = instance.getVisibleBounds();

    assert.deepEqual(bounds.left, { hours: 2, minutes: 30, date: new Date(2015, 2, 3) }, 'Left bound is OK');
    assert.deepEqual(bounds.right, { hours: 4, minutes: 30, date: new Date(2015, 2, 3) }, 'Right bound is OK');
});

QUnit.module('Timeline Month', {
    beforeEach: function() {
        this.instance = $('#scheduler-timeline').dxSchedulerTimelineMonth({ currentDate: new Date(2015, 9, 16), showCurrentTimeIndicator: false, shadeUntilCurrentTime: false }).dxSchedulerTimelineMonth('instance');
        stubInvokeMethod(this.instance);
    }
});

QUnit.test('timeline should have correct group table width (T718364)', function(assert) {
    this.instance.option('crossScrollingEnabled', true);
    this.instance.option('groups', [{ name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }, { id: 3, text: 'c' }, { id: 4, text: 'd' }] }]);

    assert.equal(this.instance.getGroupTableWidth(), 100, 'Group table width is OK');
});

QUnit.test('Scheduler timeline month getPositionShift should return null shift', function(assert) {
    this.instance.option({
        currentDate: new Date(2015, 9, 21)
    });

    assert.deepEqual(this.instance.getPositionShift(), { top: 0, left: 0, cellPosition: 0 }, 'First view date is OK');
});

QUnit.test('Scrollables should be updated after currentDate changing', function(assert) {
    this.instance.option({
        currentDate: new Date(2017, 1, 15)
    });

    const scrollable = this.instance.$element().find('.dx-scheduler-date-table-scrollable').dxScrollable('instance');
    const updateSpy = sinon.spy(scrollable, 'update');

    try {
        this.instance.option('currentDate', new Date(2017, 2, 15));

        assert.ok(updateSpy.calledOnce, 'update was called');
    } finally {
        scrollable.update.restore();
    }
});

QUnit.test('getEndViewDate should return correct value', function(assert) {
    this.instance.option({
        firstDayOfWeek: 0,
        startDayHour: 9,
        endDayHour: 18,
        currentDate: new Date(2018, 3, 20)
    });

    assert.deepEqual(this.instance.getEndViewDate(), new Date(2018, 3, 30, 17, 59), 'End view date is OK');
});

QUnit.module('Timeline Keyboard Navigation', {
    beforeEach: function() {
        this.instance = $('#scheduler-timeline').dxSchedulerTimelineMonth({
            currentDate: new Date(2015, 9, 16)
        }).dxSchedulerTimelineMonth('instance');
        stubInvokeMethod(this.instance);
    }
});


QUnit.test('Timeline should select/unselect cells with shift & arrows', function(assert) {
    this.instance.option({
        focusStateEnabled: true,
        width: 1000,
        height: 800,
        currentDate: new Date(2015, 3, 1),
        groups: [{ name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }, { id: 3, text: 'c' }] }]
    });

    const $element = this.instance.$element();
    const $cells = this.instance.$element().find('.' + CELL_CLASS);
    const keyboard = keyboardMock($element);

    pointerMock($cells.eq(2)).start().click();
    keyboard.keyDown('down', { shiftKey: true });
    assert.equal($cells.filter('.dx-state-focused').length, 1, 'right quantity of focused cells');
    assert.equal($cells.slice(1, 3).filter('.dx-state-focused').length, 1, 'right cells are focused');

    keyboard.keyDown('right', { shiftKey: true });
    assert.equal($cells.filter('.dx-state-focused').length, 2, 'right quantity of focused cells');
    assert.equal($cells.slice(1, 4).filter('.dx-state-focused').length, 2, 'right cells are focused');

    keyboard.keyDown('left', { shiftKey: true });
    assert.equal($cells.filter('.dx-state-focused').length, 1, 'right quantity of focused cells');
    assert.equal($cells.slice(1, 3).filter('.dx-state-focused').length, 1, 'right cells are focused');

    keyboard.keyDown('left', { shiftKey: true });
    assert.equal($cells.filter('.dx-state-focused').length, 2, 'right quantity of focused cells');
    assert.equal($cells.slice(1, 3).filter('.dx-state-focused').length, 2, 'right cells are focused');
});

QUnit.test('Timeline should select/unselect cells with mouse', function(assert) {
    this.instance.option({
        focusStateEnabled: true,
        width: 1000,
        height: 800,
        currentDate: new Date(2015, 3, 1),
        groups: [{ name: 'one', items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }] }]
    });

    const $element = this.instance.$element();
    const cells = $element.find('.' + CELL_CLASS);
    const $table = $element.find('.dx-scheduler-date-table');

    $($table).trigger($.Event('dxpointerdown', { target: cells.eq(3).get(0), which: 1, pointerType: 'mouse' }));

    $($table).trigger($.Event('dxpointermove', { target: cells.eq(35).get(0), which: 1 }));

    assert.equal(cells.filter('.dx-state-focused').length, 1, 'right quantity of focused cells');
});

QUnit.module('TimelineWorkWeek with intervalCount', {
    beforeEach: function() {
        this.instance = $('#scheduler-timeline').dxSchedulerTimelineWorkWeek({
            currentDate: new Date(2015, 9, 16)
        }).dxSchedulerTimelineWorkWeek('instance');
        stubInvokeMethod(this.instance);
    }
});

QUnit.test('\'getCoordinatesByDate\' should return right coordinates with view option intervalCount', function(assert) {
    this.instance.option({
        intervalCount: 2,
        currentDate: new Date(2017, 5, 25),
        startDayHour: 8,
        endDayHour: 20
    });

    const $element = this.instance.$element();

    const coords = this.instance.getCoordinatesByDate(new Date(2017, 6, 6, 12, 0), 0, false);
    const targetCellPosition = $element.find('.dx-scheduler-date-table tbody td').eq(200).position();

    assert.equal(coords.top, targetCellPosition.top, 'Cell coordinates are right');
    assert.equal(coords.left, targetCellPosition.left, 'Cell coordinates are right');
});

QUnit.module('TimelineWeek with grouping by date', {
    beforeEach: function() {
        this.instance = $('#scheduler-timeline').dxSchedulerTimelineWeek({
            currentDate: new Date(2018, 2, 1),
            groupByDate: true,
            startDayHour: 9,
            endDayHour: 12,
            groupOrientation: 'horizontal',
            showCurrentTimeIndicator: false
        }).dxSchedulerTimelineWeek('instance');

        stubInvokeMethod(this.instance);

        this.instance.option('groups', [{
            name: 'one',
            items: [{ id: 1, text: 'a' }, { id: 2, text: 'b' }]
        }]);
    }
});

QUnit.test('Get date range', function(assert) {
    assert.deepEqual(this.instance.getDateRange(), [new Date(2018, 1, 25, 9, 0), new Date(2018, 2, 3, 11, 59)], 'Range is OK');

    this.instance.option('intervalCount', 3);

    assert.deepEqual(this.instance.getDateRange(), [new Date(2018, 1, 25, 9, 0), new Date(2018, 2, 17, 11, 59)], 'Range is OK');
});

QUnit.test('Group header should be rendered correct, groupByDate = true', function(assert) {
    const $headerPanel = this.instance.$element().find('.dx-scheduler-header-scrollable .dx-scheduler-header-panel');
    const $groupRow = $headerPanel.find('.dx-scheduler-group-row');
    const $groupHeaderCells = $groupRow.find('.dx-scheduler-group-header');
    const dateTableCellWidth = this.instance.$element().find('.dx-scheduler-date-table-cell').get(0).getBoundingClientRect().width;
    const groupHeaderWidth = $groupHeaderCells.get(0).getBoundingClientRect().width;

    assert.equal($groupHeaderCells.length, 84, 'Group header cells count is OK');
    assert.roughEqual(dateTableCellWidth, groupHeaderWidth, 1.1, 'Group header cell has correct size');
});

QUnit.test('Date table cells shoud have right cellData, groupByDate = true', function(assert) {
    const $cells = this.instance.$element().find('.dx-scheduler-date-table-cell');

    assert.deepEqual($cells.eq(0).data('dxCellData'), {
        startDate: new Date(2018, 1, 25, 9, 0),
        endDate: new Date(2018, 1, 25, 9, 30),
        allDay: false,
        groups: {
            one: 1
        }
    });

    assert.deepEqual($cells.eq(1).data('dxCellData'), {
        startDate: new Date(2018, 1, 25, 9, 0),
        endDate: new Date(2018, 1, 25, 9, 30),
        allDay: false,
        groups: {
            one: 2
        }
    });

    assert.deepEqual($cells.eq(50).data('dxCellData'), {
        startDate: new Date(2018, 2, 1, 9, 30),
        endDate: new Date(2018, 2, 1, 10),
        allDay: false,
        groups: {
            one: 1
        }
    });

    assert.deepEqual($cells.eq(51).data('dxCellData'), {
        startDate: new Date(2018, 2, 1, 9, 30),
        endDate: new Date(2018, 2, 1, 10),
        allDay: false,
        groups: {
            one: 2
        }
    });

    assert.deepEqual($cells.eq(82).data('dxCellData'), {
        startDate: new Date(2018, 2, 3, 11, 30),
        endDate: new Date(2018, 2, 3, 12),
        allDay: false,
        groups: {
            one: 1
        }
    });

    assert.deepEqual($cells.eq(83).data('dxCellData'), {
        startDate: new Date(2018, 2, 3, 11, 30),
        endDate: new Date(2018, 2, 3, 12),
        allDay: false,
        groups: {
            one: 2
        }
    });
});

QUnit.test('Group table cells should have right cellData, groupByDate = true', function(assert) {
    const $groupRow = this.instance.$element().find('.dx-scheduler-group-row');
    const $groupHeaderCells = $groupRow.find('.dx-scheduler-group-header');

    assert.equal($groupHeaderCells.eq(0).text(), 'a', 'Group header content height is OK');
    assert.equal($groupHeaderCells.eq(1).text(), 'b', 'Group header content height is OK');
    assert.equal($groupHeaderCells.eq(82).text(), 'a', 'Group header content height is OK');
    assert.equal($groupHeaderCells.eq(83).text(), 'b', 'Group header content height is OK');
});

QUnit.test('Timeline should find cell coordinates by date, groupByDate = true', function(assert) {
    const $element = this.instance.$element();

    this.instance.option('currentDate', new Date(2015, 2, 4));
    let coords = this.instance.getCoordinatesByDate(new Date(2015, 2, 4, 2, 0), 1, false);

    assert.equal(coords.top, $element.find('.dx-scheduler-date-table tbody td').eq(17).position().top, 'Top cell coordinates are right');
    assert.equal(coords.left, $element.find('.dx-scheduler-date-table tbody td').eq(17).position().left, 'Left cell coordinates are right');
    assert.equal(coords.hMax, 16800, 'hMax is right');

    coords = this.instance.getCoordinatesByDate(new Date(2015, 2, 5, 2, 0), 2, false);

    assert.equal(coords.top, $element.find('.dx-scheduler-date-table tbody td').eq(30).position().top, 'Top cell coordinates are right');
    assert.equal(coords.left, $element.find('.dx-scheduler-date-table tbody td').eq(30).position().left, 'Left cell coordinates are right');
    assert.equal(coords.hMax, 16800, 'hMax is right');
});

