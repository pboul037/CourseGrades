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

function SyllabusItem(id, title, state, isParent, weight, dueDate, numItems, children, parent){
    this.id = id;
    this.title = ko.observable(title);
    this.state = ko.observable(state);
    this.weight = ko.observable(weight);
    this.numItems = ko.observable(numItems);
    this.isParent = isParent;
    this.parent = parent;
    this.children = ko.observableArray(isParent ? [] : null);
    this.gradePercent = ko.observable(null);
    this.gradeNumerator = ko.observable(null);
    this.gradeDenominator = ko.observable(100);
    if(isParent){
        for(var i = 0; i < numItems; i++){
            this.children.push(new SyllabusItem(i, this.title() + ' ' + (i + 1), 'NotSubmitted', false, this.weight/numItems, null, 0, null, this));
        }
    }
    /*
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
    }else{
        this.gradePercent = ko.computed(function() {
            if(this.gradeNumerator() == null || this.gradeDenominator() == null || this.gradeDenominator() < 1)
                return null;
            else 
                return (this.gradeNumerator()*100/this.gradeDenominator()).toFixed(1);
        }, this);
    } */
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

var sessionsData = [
    new Session(0, 'Fall 2015', 
               [new Course(0, 'SEG3525', 99,
                          [new SyllabusItem(1, 'Mid-Term', 'NotSubmitted', false, 30, null, 0, null),
                           new SyllabusItem(0, 'Labs', 'NotSubmitted', true, 30, null, 3, null),
                           new SyllabusItem(1, 'Final Exam', 'NotSubmitted', false, 40, null, 0, null)]), 
                new Course(1, 'SEG3505', null)]),
    new Session(1, 'Summer 2015', 
               [new Course(0, 'CSI2101', 78), 
                new Course(1, 'ADM1500', 97)])
];

var infoData = [
    new Info (-1, 'Description', '', '', '', '', ''),
    new Info(0, 'Teacher', 'John Smith', 'jsmith@yahoo.ca', '555-666-7777', 'SITE2065'),
    new Info(1, 'TA', 'Mary Jones', 'mjones@hotmail.com', '321-444-1234', '')
];