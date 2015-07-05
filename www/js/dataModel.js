function Session(id, title, courses)
{
    this.id = id;
    this.title = ko.observable(title);
    this.courses = ko.observableArray(courses == null ? [] : courses);
}

function Course(id, title, grade){
    this.id = id;
    this.title = ko.observable(title);
    this.grade = ko.observable(grade);
}

var sessionsData = [
    new Session(0, 'Fall 2015', 
               [new Course(0, 'SEG3525', 99), new Course(1, 'SEG3505', 98)]),
    new Session(1, 'Summer 2015', 
               [new Course(0, 'CSI2101', 78), new Course(1, 'ADM1500', 97)])
];