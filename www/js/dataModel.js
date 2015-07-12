function Session(id, title, courses)
{
    this.id = id;
    this.title = ko.observable(title);
    this.courses = ko.observableArray(courses == null ? [] : courses);
}

function Course(id, title, grade, syllabusItems){
    this.id = id;
    this.title = ko.observable(title);
    this.grade = ko.observable(grade);
    this.syllabusItems = ko.observableArray(syllabusItems != null ? syllabusItems : []);
}

function SyllabusItem(id, title, state, isParent, weight, dueDate, numItems, children){
    this.id = id;
    this.title = ko.observable(title);
    this.isParent = isParent;
    this.children = ko.observableArray(isParent ? [] : null);
    this.gradePercent = ko.observable(null);
    this.gradeNumerator = ko.observable(null);
    this.gradeDenominator = ko.observable(100);
    if(isParent){
        for(var i = 0; i < numItems; i++){
            this.children.push(new SyllabusItem(i, this.title() + ' ' + (i + 1), 'NotSubmitted', false, this.weight/numItems, null, 0, null));
        }
        this.gradePercent = ko.computed(function() {
            var computedGrade = null;
            var numberOfComputedGrades = 0;
            if(this.children != null){
                this.children().forEach(function(child){
                    if(child.gradePercent() != null){
                        computedGrade += child.gradePercent();
                        numberOfComputedGrades++;
                    }
                });
                if(numberOfComputedGrades > 0)
                    return computedGrade/numberOfComputedGrades;
                else
                    return null;
            }else{
                return null;
            }
        }, this);
    }
}

var sessionsData = [
    new Session(0, 'Fall 2015', 
               [new Course(0, 'SEG3525', 99,
                          [new SyllabusItem(1, 'Mid-Term', 'NotSubmitted', false, 30, null, 0),
                           new SyllabusItem(0, 'Labs', 'NotSubmitted', true, 30, null, 3),
                           new SyllabusItem(1, 'Final Exam', 'NotSubmitted', false, 40, null, 0)]), 
                new Course(1, 'SEG3505', null)]),
    new Session(1, 'Summer 2015', 
               [new Course(0, 'CSI2101', 78), 
                new Course(1, 'ADM1500', 97)])
];

var infoData = [
    new Session(0, 'Teacher', 
               [new Course(0, 'Name : John Smith', null), 
                new Course(1, 'email : jsmith@yahoo.ca', null),
                new Course(1, 'phone : 555-666-7777', null)]),
    new Session(1, 'TA', 
               [new Course(0, 'Name : Mary Jones', null), 
                new Course(1, 'email : mjones@hotmail.com', null),
                new Course(1, 'phone : 321-444-1234', null)])
];