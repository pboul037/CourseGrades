function Session(id, title, courses)
{
    this.id = id;
    this.title = ko.observable(title);
    this.avg = ko.observable(null);
    this.courses = ko.observableArray(courses == null ? [] : courses);
}

function Course(id, title, grade, syllabusItems, infos){
    this.id = id;
    this.title = ko.observable(title);
    this.grade = ko.observable(grade);
    this.gradeGoal = ko.observable(80);
    this.syllabusItems = ko.observableArray(syllabusItems != null ? syllabusItems : []);
    this.infos = ko.observableArray(infos == null ? [] : infos);
}

function SyllabusItem(id, title, state, isParent, weight, dueDate, numItems, children, parent){
    this.id = id;
    this.title = ko.observable(title);
    this.state = ko.observable(state);
    this.weight = ko.observable(weight);
    this.computedGradesWeight = ko.observable(0);
    this.numItems = ko.observable(numItems);
    this.dueDate = ko.observable('15-Sep-2015');
    this.dueDateTime = ko.observable('08:00 AM');
    this.isParent = isParent;
    this.parent = parent;
    this.children = ko.observableArray(isParent ? [] : null);
    this.gradePercent = ko.observable(null);
    this.gradeNumerator = ko.observable(null);
    this.gradeDenominator = ko.observable(100);
    if(isParent){
        for(var i = 0; i < numItems; i++){
            this.children.push(new SyllabusItem(i, this.title() + ' ' + (i + 1), 'NotSubmitted', false, this.weight()/numItems, null, 0, null, this));
        }
    }
}

function Info(id, title, name, email, phone, office)
{
    this.id = id;
    this.title = ko.observable(title);
    this.name = ko.observable(name);
    this.email = ko.observable(email);
    this.phone = ko.observable(phone);
    this.office = ko.observable(office);
}

var fakeInfosData = [
    new Info (-1, 'Description', '', '', '', '', ''),
    new Info(0, 'Teacher', 'John Smith', 'jsmith@yahoo.ca', '555-666-7777', 'SITE2065'),
    new Info(1, 'TA', 'Mary Jones', 'mjones@hotmail.com', '321-444-1234', '')
];

var fakeSyllabusItemsData = [
    new SyllabusItem(1, 'Mid-Term', 'NotSubmitted', false, 30, null, 0, null),
    new SyllabusItem(0, 'Labs', 'NotSubmitted', true, 30, null, 3, null),
    new SyllabusItem(1, 'Final Exam', 'NotSubmitted', false, 40, null, 0, null)
];

var sessionsData = [
    new Session(0, 'Fall 2015', 
               [new Course(0, 'SEG3525', null, fakeSyllabusItemsData, fakeInfosData), 
                new Course(1, 'SEG3505', null, fakeSyllabusItemsData, fakeInfosData)]), 
    new Session(1, 'Summer 2015', 
               [new Course(0, 'CSI2101', null), 
                new Course(1, 'ADM1500', null)])
];