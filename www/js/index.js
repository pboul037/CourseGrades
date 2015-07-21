var constants = {
    'SESSIONS_PAGE': 'Sessions',
    'COURSE_PAGE': 'Course',
    'SETTINGS_PAGE': 'Settings',
    'EDIT_SYLLABUS_ITEM': 'EDIT_SYLLABUS_ITEM'
};

var deviceReadyDeferred = new $.Deferred();
var jQueryReadyDeferred = new $.Deferred();

$(function(){
    jQueryReadyDeferred.resolve();
    $(".bootstrap-switch").bootstrapSwitch();
});

$.when(deviceReadyDeferred, jQueryReadyDeferred).then(initialize);

function deviceReady() {
  deviceReadyDeferred.resolve();
}
// commented out for browser emulation testing
//if (navigator.userAgent.match(/(iPhone|iPod|iPad|Android|BlackBerry|IEMobile)/)) {
//  document.addEventListener("deviceready", deviceReady, false);
//} else {
  deviceReady(); //this is the browser
//}


function initialize(){
    var vm = createViewModel();
    
    ko.applyBindings(vm);
}

function createViewModel() {
    
  // define core view model    
  var vm = {
    appSettings: {
      notifyMeNumBeforeDueDate: ko.observable(2),
      notifyMeNumBeforeDueDateUnit: ko.observable('day(s)'),    
        
      notifyMeNumAfterDueDate: ko.observable(2),
      notifyMeNumAfterDueDate: ko.observable('week(s)'),    
        
      notificationTimeUnitsDropdownOptions: ko.observableArray([])
    },
    appCulture: {
        lang: ko.observable('en'),
        strings: ko.observable(strings),
    },
    appState: {
        activePage: ko.observable(constants.SESSIONS_PAGE),
        activePageTitle: ko.observable(constants.SESSIONS_PAGE),
        previousPage: ko.observable(constants.SESSIONS_PAGE),
        previousPageTitle: ko.observable(constants.SESSIONS_PAGE),
        activeSession: ko.observable(null),
        activeCourse: ko.observable(null)
    },
    dataModel: {
        sessions: ko.observableArray(sessionsData),
    },
    sessionPageState: {
        showCreateNewSession: ko.observable(true)
    },
    coursePageState: {
        // grades tab
        activeSyllabusItem: ko.observable(null),
        showCreateNewSyllabusItem: ko.observable(true),
        
        // info tab
        activeInfo: ko.observable(null),
        showCreateNewInfo: ko.observable(true)
    }
  }
  
  // initialize app settings
  vm.appSettings.notificationTimeUnitsDropdownOptions(vm.appCulture.strings()
              .getString('NOTIFICATION_TIME_UNITS_DROPDOWN_OPTIONS', vm.appCulture.lang()));
    
  // define view model's functions
  vm.toggleSessionState = function (session){
    if(vm.appState.activeSession() != null)
        vm.appState.activeSession().state('READ');
    vm.appState.activeSession(session);
    if (session.state() == 'READ'){
        session.state('EDIT');
        session.showDeleteSession(true);
        session.showCreateNewCourse(false);
        $('#session' + session.id).addClass('in');
    } else { 
        session.state('READ');
        session.showDeleteSession(false);
        session.showCreateNewCourse(true);
    }
  }
  
vm.toggleInfoState = function (info){
    if(vm.coursePageState.activeInfo() != null)
        vm.coursePageState.activeInfo().state('READ');
    vm.coursePageState.activeInfo(info);
    if (info.state() == 'READ'){
        info.state('EDIT');
        info.showDeleteInfo(true);
        vm.coursePageState.showCreateNewInfo(false);
        $('#info' + info.id).addClass('in');
    } else { 
        info.state('READ');
        info.showDeleteInfo(false);
        vm.coursePageState.showCreateNewInfo(true);
    }
  }

  vm.deleteSession = function(){
      alertify.confirm("<b>"  
                       + vm.appCulture.strings().getString('DELETE_SESSION_CONFIRM_PROMPT', vm.appCulture.lang()) 
                       + "</b><br><small>"
                       + vm.appCulture.strings().getString('WILL_NOT_BE_ABLE_TO_RECOVER_DATA', vm.appCulture.lang()) 
                       + "</small>",             function (e) {
            if (e) {
                    var sessionToDelete = vm.appState.activeSession();
                    vm.appState.activeSession(null);
                    vm.dataModel.sessions.remove(sessionToDelete);  
            }
        });
  }
  
  vm.deleteCourse = function(course){
            alertify.confirm("<b>"  
                       + vm.appCulture.strings().getString('DELETE_COURSE_CONFIRM_PROMPT', vm.appCulture.lang()) 
                       + "</b><br><small>"
                       + vm.appCulture.strings().getString('WILL_NOT_BE_ABLE_TO_RECOVER_DATA', vm.appCulture.lang()) 
                       + "</small>",             function (e) {
            if (e) {
                vm.appState.activeSession().courses.remove(course);
            }
        });
  }
  
  vm.deleteInfo = function(){
        alertify.confirm("<b>"  
                   + vm.appCulture.strings().getString('DELETE_CONTACT_CONFIRM_PROMPT', vm.appCulture.lang()) 
                   + "</b><br><small>"
                   + vm.appCulture.strings().getString('WILL_NOT_BE_ABLE_TO_RECOVER_DATA', vm.appCulture.lang()) 
                   + "</small>",             function (e) {
            if (e) {
                var infoToDelete = vm.coursePageState.activeInfo();
                vm.coursePageState.activeInfo(null);
                vm.appState.activeCourse().infos.remove(infoToDelete);  
            }
        });
  }
  
  vm.deleteSyllabusItem = function(){
      alertify.confirm("<b>"  
           + vm.appCulture.strings().getString('DELETE_SYLLABUS_ITEM_CONFIRM_PROMPT', vm.appCulture.lang()) 
           + "</b><br><small>"
           + vm.appCulture.strings().getString('WILL_NOT_BE_ABLE_TO_RECOVER_DATA', vm.appCulture.lang()) 
           + "</small>",             function (e) {
            if (e) {
                var syllItem = vm.coursePageState.activeSyllabusItem();
                vm.coursePageState.activeSyllabusItem(null); 

                vm.appState.previousPage(constants.SESSIONS_PAGE);
                vm.appState.previousPageTitle(constants.SESSIONS_PAGE);
                vm.appState.activePageTitle(vm.appState.activeCourse().title());
                vm.appState.activePage(constants.COURSE_PAGE);

                if( syllItem.parent != null ){
                    var parent = syllItem.parent;
                    parent.children.remove(syllItem);
                    vm.computeGradePercentFromChildren(parent);
                }else {
                    vm.appState.activeCourse().syllabusItems.remove(syllItem);
                }
                vm.computeCourseAvg();
            }
        });
  }
  
  vm.computeCourseAvg = function(){
        var course = vm.appState.activeCourse();
        if( course != null){
            var computedGrade = null;
            var sumOfComputedWeights = 0;
            var numberOfComputedGrades = 0;
            if(course.syllabusItems() != null){
                course.syllabusItems().forEach(function(syllItem){
                    if(syllItem.gradePercent() != null){
                        if(computedGrade == null)
                            computedGrade = 0;
                        if(syllItem.isParent){
                            computedGrade += (parseInt(syllItem.gradePercent())*syllItem.computedGradesWeight());
                            sumOfComputedWeights += syllItem.computedGradesWeight();
                        }else {
                            computedGrade += (parseInt(syllItem.gradePercent())*syllItem.weight());
                            sumOfComputedWeights += syllItem.weight();
                        }
                        numberOfComputedGrades++;
                    }
                });
                if(numberOfComputedGrades > 0){
                    course.grade(((computedGrade)/sumOfComputedWeights).toFixed(0));
                    vm.computeSessionAvg();
                }else{
                    course.grade(null);
                }
            }else{
                course.grade(null);
            }
        }
  }
  
  vm.computeSessionAvg = function() {
        var session = vm.appState.activeSession();
        if( session != null){
            var computedGrade = null;
            // TODO: add credits as sessions weights
            //var sumOfComputedWeights = 0;
            var numberOfComputedGrades = 0;
            if(session.courses() != null){
                session.courses().forEach(function(course){
                    if(course.grade() != null){
                        if(computedGrade == null)
                            computedGrade = 0;

                        computedGrade += (parseInt(course.grade())); //*course.weight());
                        //sumOfComputedWeights += syllItem.weight();
                        numberOfComputedGrades++;
                    }
                });
                if(numberOfComputedGrades > 0){
                    session.avg(((computedGrade)/numberOfComputedGrades).toFixed(0));
                }else{
                    session.avg(null);
                }
            }else{
                session.avg(null);
            }
        }
  }
    
  vm.appCulture.lang.subscribe(function(lang){
    if(vm.appState.activePage() == constants.SETTINGS_PAGE){
        vm.appState.activePageTitle(vm.appCulture.strings().getString('SETTINGS_PAGE_TITLE', vm.appCulture.lang()));
        if(vm.appState.previousPage() == constants.EDIT_SYLLABUS_ITEM)
           vm.appState.previousPageTitle(vm.appCulture.strings().getString('EDIT_SYLLABUS_ITEM_PAGE_TITLE', vm.appCulture.lang()));
    }else if(vm.appState.activePage() == constants.EDIT_SYLLABUS_ITEM){
        vm.appState.activePageTitle(vm.appCulture.strings().getString('EDIT_SYLLABUS_ITEM_PAGE_TITLE', vm.appCulture.lang()));
    }
  vm.appSettings.notificationTimeUnitsDropdownOptions(vm.appCulture.strings()
          .getString('NOTIFICATION_TIME_UNITS_DROPDOWN_OPTIONS', vm.appCulture.lang()));
  });
  
  // add state attributes to data model's elements
  vm.dataModel.sessions().forEach(function(session){
    session.showCreateNewCourse = ko.observable(true);
    session.showDeleteSession = ko.observable(false);
    session.courses().forEach(function(course){
        course.creationMode = ko.observable(false);
        course.state = ko.observable('READ');
        
        course.syllabusItems().forEach(function(syllItem){
            syllItem.gradePercent.subscribe(vm.computeCourseAvg);
        });
        
        course.infos().forEach(function(info){
            info.creationMode = ko.observable(false);
            info.state = ko.observable('READ');
            info.showDeleteInfo = ko.observable(false);
        });
    });
  });
    
  vm.dataModel.sessions().forEach(function(session){
      session.state = ko.observable('READ');
      session.creationMode = ko.observable(false);
  });
    
  // re-initialize the datepicker plugin when page is made visible
  vm.appState.activePage.subscribe(function(activePage){
    if(activePage == constants.EDIT_SYLLABUS_ITEM){
        
        // internalisation of the date picker
        if(vm.appCulture.lang() == 'en'){
            jQuery.extend( jQuery.fn.pickadate.defaults, {
                monthsFull: [ 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December' ],
                monthsShort: [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec' ],
                weekdaysFull: [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ],
                weekdaysShort: [ 'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat' ],
                today: 'Today',
                clear: 'Clear',
                close: 'Close',
                format: 'd mmmm, yyyy',
                formatSubmit: 'yyyy/mm/dd',
                labelMonthNext: 'Next month',
                labelMonthPrev: 'Previous month',
                labelMonthSelect: 'Select a month',
                labelYearSelect: 'Select a year',
            });

            jQuery.extend( jQuery.fn.pickatime.defaults, {
                clear: 'Clear'
            });

        }else if(vm.appCulture.lang() == 'fr'){
            jQuery.extend({}, jQuery.fn.pickadate.defaults, {
                monthsFull: [ 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre' ],
                monthsShort: [ 'Jan', 'Fev', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aou', 'Sep', 'Oct', 'Nov', 'Dec' ],
                weekdaysFull: [ 'Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi' ],
                weekdaysShort: [ 'Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam' ],
                today: 'Aujourd\'hui',
                clear: 'Effacer',
                close: 'Fermer',
                firstDay: 1,
                format: 'dd mmmm yyyy',
                formatSubmit: 'yyyy/mm/dd',
                labelMonthNext:"Mois suivant",
                labelMonthPrev:"Mois précédent",
                labelMonthSelect:"Sélectionner un mois",
                labelYearSelect:"Sélectionner une année"
            });

            jQuery.extend({}, jQuery.fn.pickatime.defaults, {
                clear: 'Effacer'
            });
        }
        
        $('.dueDateInput').pickadate({format: 'dd-mmm-yyyy'});
        $('.dueDateTimeInput').pickatime();
    }
  });
    
  vm.changeAndNavigateToActiveCourse = function(course){
      if(!course.creationMode()){
        vm.appState.activePageTitle(course.title);
        vm.appState.activeCourse(course);
        vm.appState.activePage(constants.COURSE_PAGE); 
      }
  }
  
  vm.navigateToSettings = function(){
        vm.appState.activePageTitle(vm.appCulture.strings().getString('SETTINGS_PAGE_TITLE', vm.appCulture.lang()));
        if (vm.appState.activeCourse() != null && vm.appState.activePage() == constants.COURSE_PAGE){
            vm.appState.previousPageTitle(vm.appState.activeCourse().title());
            vm.appState.previousPage(constants.COURSE_PAGE);
        }else if (vm.appState.activePage() == constants.SESSIONS_PAGE){
            vm.appState.previousPageTitle(constants.SESSIONS_PAGE);
            vm.appState.previousPage(constants.SESSIONS_PAGE);
        }else if (vm.appState.activePage() == constants.EDIT_SYLLABUS_ITEM){
            vm.appState.previousPageTitle(vm.appCulture.strings().getString('EDIT_SYLLABUS_ITEM_PAGE_TITLE', vm.appCulture.lang()));
            vm.appState.previousPage(constants.EDIT_SYLLABUS_ITEM); 
        }
        vm.appState.activePage(constants.SETTINGS_PAGE);
  }
  
  vm.navigateBack = function(){
    switch(vm.appState.activePage()){
        case constants.COURSE_PAGE:
            vm.appState.activePageTitle(constants.SESSIONS_PAGE);
            vm.appState.activePage(constants.SESSIONS_PAGE);
            vm.appState.activeCourse(null);
            break;
        case constants.SETTINGS_PAGE:
            if(vm.appState.previousPageTitle() == constants.SESSIONS_PAGE)
            {
                vm.appState.activePageTitle(constants.SESSIONS_PAGE);
                vm.appState.activePage(constants.SESSIONS_PAGE);
            }
            else if(vm.appState.previousPageTitle() == vm.appState.activeCourse().title())
            {
                vm.appState.activePageTitle(vm.appState.previousPageTitle());
                vm.appState.activePage(constants.COURSE_PAGE);
                vm.appState.previousPageTitle(constants.SESSIONS_PAGE);
                vm.appState.previousPage(constants.SESSIONS_PAGE);
            }else if(vm.appState.previousPage() == constants.EDIT_SYLLABUS_ITEM){
                vm.appState.activePageTitle(vm.appCulture.strings().getString('EDIT_SYLLABUS_ITEM_PAGE_TITLE', vm.appCulture.lang()));
                vm.appState.activePage(constants.EDIT_SYLLABUS_ITEM);
                vm.appState.previousPageTitle(vm.appState.activeCourse().title());
                vm.appState.previousPage(constants.COURSE_PAGE);
            }
            break;
        case constants.EDIT_SYLLABUS_ITEM:
            vm.appState.previousPageTitle(constants.SESSIONS_PAGE);
            vm.appState.previousPage(constants.SESSIONS_PAGE);
            vm.appState.activePageTitle(vm.appState.activeCourse().title());
            vm.appState.activePage(constants.COURSE_PAGE);
            break;
    }
  }
  
  vm.sessionOnClick = function(session, elem){
      
    var collapsiblePanel = $(elem.target).parents('.panel-heading').next('.panel-collapse');
    var currentId = $(collapsiblePanel).attr('id');
    $('.panel-collapse').not('#' + currentId).slideUp('fast');
    $(collapsiblePanel).slideToggle('fast');    
    
    var incompleteNewSessionToRemove = null;
    
    if(vm.appState.activeSession()!= null){   // check for an incomplete session creation and delete it
        var incompleteNewCourseToRemove = null;
       if( vm.appState.activeSession().creationMode() )
        incompleteNewSessionToRemove = vm.appState.activeSession();
        
        vm.appState.activeSession().courses().forEach(function(course){
            if(course.creationMode())
                incompleteNewCourseToRemove = course;
        });
        if(incompleteNewCourseToRemove != null){
            vm.appState.activeSession().courses.remove(incompleteNewCourseToRemove);
            vm.appState.activeSession().showCreateNewCourse(true);
        }
    }
      
    if(vm.appState.activeSession() != null && vm.appState.activeSession().id == session.id) // after this all sessions are inactive
      vm.appState.activeSession(null);
    else
      vm.appState.activeSession(session);
      
    if(incompleteNewSessionToRemove != null){
        vm.dataModel.sessions.remove(incompleteNewSessionToRemove);
        vm.sessionPageState.showCreateNewSession(true);
    }
  }

  //Note for time economym every variable kept as 'session' is in fact 'info'
  vm.infoOnClick = function(info, elem){
      
    var collapsiblePanel = $(elem.target).parents('.panel-heading').next('.panel-collapse');
    var currentId = $(collapsiblePanel).attr('id');
    $('.panel-collapse').not('#' + currentId).slideUp('fast');
    $(collapsiblePanel).slideToggle('fast');    
    
    var incompleteNewSessionToRemove = null;
    
    if(vm.coursePageState.activeInfo()!= null){   // check for an incomplete session creation and delete it
        var incompleteNewCourseToRemove = null;
       if( vm.coursePageState.activeInfo().creationMode() )
        incompleteNewSessionToRemove = vm.coursePageState.activeInfo();
        
        if(incompleteNewCourseToRemove != null){
            vm.coursePageState.activeInfo().showCreateNewCourse(true);
        }
    }
      
    if(vm.coursePageState.activeInfo() != null && vm.coursePageState.activeInfo().id == info.id) // after this all sessions are inactive
      vm.coursePageState.activeInfo(null);
    else
      vm.coursePageState.activeInfo(info);
      
    if(incompleteNewSessionToRemove != null){
        vm.appState.activeCourse().infos.remove(incompleteNewSessionToRemove);
        vm.coursePageState.showCreateNewInfo(true);
    }
  }
  
  vm.addNewSession = function(){
    var dfd = new jQuery.Deferred();
    $('.panel-collapse').slideUp('fast'); // collapse open session if any
    vm.sessionPageState.showCreateNewSession(false);
    var s = vm.dataModel.sessions()[vm.dataModel.sessions().length -1];
    var sessionToAdd = new Session(s.id + 1, "", []); // next available session id 
    sessionToAdd.showCreateNewCourse = ko.observable(true);
    sessionToAdd.creationMode = ko.observable(true);
    sessionToAdd.state = ko.observable('EDIT');
    sessionToAdd.showDeleteSession = ko.observable(false);
    vm.dataModel.sessions.push(sessionToAdd); 
    vm.appState.activeSession(sessionToAdd);
    return dfd.resolve();
  }
  
  vm.addNewSyllabusItem = function(){
    var lastSyllabusItemIndex = vm.appState.activeCourse().syllabusItems().length + 1;
    vm.coursePageState.activeSyllabusItem(new SyllabusItem(lastSyllabusItemIndex, "", "CREATION", false, 5, "", 1, [], null)); 
    vm.appState.previousPageTitle(vm.appState.activeCourse().title());
    vm.appState.previousPage(constants.COURSE_PAGE);
    vm.appState.activePageTitle(vm.appCulture.strings().getString('CREATE_SYLLABUS_ITEM_PAGE_TITLE', vm.appCulture.lang()));
    vm.appState.activePage(constants.EDIT_SYLLABUS_ITEM);
      
      $("#beforeDueDateSwitch").bootstrapSwitch();
      $("#afterDueDateSwitch").bootstrapSwitch();
  }
  
  vm.editGrade = function(syllabusItem){
    if(vm.coursePageState.activeSyllabusItem() != null)
        vm.coursePageState.activeSyllabusItem().state('READ');
    syllabusItem.state('EDIT_GRADE');
    vm.coursePageState.activeSyllabusItem(syllabusItem);
  }
  
  vm.editSyllabusItem = function(syllabusItem){
    syllabusItem.state('EDIT');
    vm.coursePageState.activeSyllabusItem(syllabusItem);
    vm.appState.previousPageTitle(vm.appState.activeCourse().title());
    vm.appState.previousPage(constants.COURSE_PAGE);
    vm.appState.activePageTitle(vm.appCulture.strings().getString('EDIT_SYLLABUS_ITEM_PAGE_TITLE', vm.appCulture.lang()));
    vm.appState.activePage(constants.EDIT_SYLLABUS_ITEM);
    $("#beforeDueDateSwitch").bootstrapSwitch();
    $("#afterDueDateSwitch").bootstrapSwitch();
  }
  
  function computeGradePercentFromChildren(parent){
        var computedGrade = null;
        var numberOfComputedGrades = 0;
        var sumOfComputedWeights = 0;
        if(parent.children != null){
            parent.children().forEach(function(child){
                if(child.gradePercent() != null){
                    if(computedGrade == null)
                        computedGrade = 0;
                    computedGrade += parseInt(child.gradePercent());
                    sumOfComputedWeights += child.weight();
                    numberOfComputedGrades++;
                }
            });
            if(numberOfComputedGrades > 0){
                parent.computedGradesWeight(sumOfComputedWeights);
                parent.gradePercent((computedGrade/numberOfComputedGrades).toFixed(0));
            }else{
                parent.gradePercent(null);
            }
        }else{
            parent.gradePercent(null);
        }
  }
  
  vm.setGrade = function(){
    var num = vm.coursePageState.activeSyllabusItem().gradeNumerator();
    var denom = vm.coursePageState.activeSyllabusItem().gradeDenominator();
    if(num != null && denom != null && denom > 0){
        vm.coursePageState.activeSyllabusItem().gradePercent((num*100/denom).toFixed(0));
        if(vm.coursePageState.activeSyllabusItem().parent != null){
            computeGradePercentFromChildren(vm.coursePageState.activeSyllabusItem().parent);
        }
    }else{
        vm.coursePageState.activeSyllabusItem().gradePercent(null);
    }
    vm.coursePageState.activeSyllabusItem().state('READ');
    vm.coursePageState.activeSyllabusItem(null);
  }
  
  vm.doneEditingSyllabusItem = function(){
    vm.setGrade();
    vm.appState.previousPage(constants.SESSIONS_PAGE);
    vm.appState.previousPageTitle(constants.SESSIONS_PAGE);
    vm.appState.activePageTitle(vm.appState.activeCourse().title());
    vm.appState.activePage(constants.COURSE_PAGE);
  }

  vm.addNewInfo = function(){
    var dfd = new jQuery.Deferred();
    $('.panel-collapse').slideUp('fast'); // collapse open info if any
    vm.coursePageState.showCreateNewInfo(false);
    var s = vm.appState.activeCourse().infos()[vm.appState.activeCourse().infos().length -1];
    var infoToAdd = new Info(s.id + 1, '', '', '', '', ''); // next available info id 
    infoToAdd.showCreateNewInfo = ko.observable(true);
    infoToAdd.creationMode = ko.observable(true);
    vm.appState.activeCourse().infos.push(infoToAdd); 
    vm.coursePageState.activeInfo(infoToAdd);
    return dfd.resolve();
  }
  
  vm.createSession = function(session){
      session.creationMode(false);
      session.state('READ');
      vm.sessionPageState.showCreateNewSession(true);
      vm.appState.activeSession(session);
      $('#session' + session.id).addClass('in');
  }
  
  vm.createSyllabusItem = function(){
      var si = vm.coursePageState.activeSyllabusItem();
      var itemToAdd = new SyllabusItem(si.id, si.title(), "READ", si.numItems() > 1, si.weight(), "", si.numItems(), [], null);
      vm.appState.activeCourse().syllabusItems.push(itemToAdd);
      
      vm.appState.activeCourse().syllabusItems().forEach(function(syllItem){
           syllItem.gradePercent.subscribe(vm.computeCourseAvg);
      });
      
      vm.appState.previousPage(constants.SESSIONS_PAGE);
      vm.appState.previousPageTitle(constants.SESSIONS_PAGE);
      vm.appState.activePageTitle(vm.appState.activeCourse().title());      
      vm.appState.activePage(constants.COURSE_PAGE);
  }
  
  vm.cancelCreateSyllabusItem = function(){
      vm.coursePageState.activeSyllabusItem(null);
      vm.appState.activePageTitle(vm.appState.activeCourse().title());
      vm.appState.activePage(constants.COURSE_PAGE);
  }

  vm.createInfo = function(info){
      info.creationMode(false);
      vm.coursePageState.showCreateNewInfo(true);
      vm.coursePageState.activeInfo(info);
      $('#info' + info.id).addClass('in');
  }
  
  vm.cancelAddNewSession = function(session){
    vm.appState.activeSession(vm.dataModel.sessions()[0]); // first session on the list active after cancel
    vm.dataModel.sessions.remove(session);
    vm.sessionPageState.showCreateNewSession(true);
  }

  vm.cancelAddNewInfo = function(info){
    vm.coursePageState.activeInfo(vm.appState.activeCourse().infos()[0]); // first session on the list active after cancel
    vm.appState.activeCourse().infos.remove(info);
    vm.coursePageState.showCreateNewInfo(true);
  }
  
  vm.addNewCourse = function(){
    var dfd = new jQuery.Deferred();
    vm.appState.activeSession().showCreateNewCourse(false);
    var c = vm.appState.activeSession().courses();
    var indexOfNewCourse = 0;
      if(c.length > 0)
        indexOfNewCourse = c[c.length -1].id + 1;
    var courseToAdd = new Course(indexOfNewCourse, "", null)
    courseToAdd.creationMode = ko.observable(true);
    courseToAdd.state = ko.observable('READ');
    vm.appState.activeSession().courses.push(courseToAdd); // next available course id for this session
    return dfd.resolve();
  }
  
  vm.createCourse = function(course){
      course.creationMode(false);
      vm.appState.activeSession().showCreateNewCourse(true);
      vm.changeAndNavigateToActiveCourse(course);
  }
  
  vm.addAnotherCourse = function(course){
    vm.addNewCourse().done(function(){
        course.creationMode(false);
    });
  }
  
  vm.cancelAddNewCourse = function(course){
    vm.appState.activeSession().courses.remove(course);
    vm.appState.activeSession().showCreateNewCourse(true);
  }
  
  return vm;
}

ko.bindingHandlers.fadeVisible = {
    init: function(element, valueAccessor) {
        // Initially set the element to be instantly visible/hidden depending on the value
        var value = valueAccessor();
        $(element).toggle(ko.unwrap(value)); // Use "unwrapObservable" so we can handle values that may or may not be observable
    },
    update: function(element, valueAccessor) {
        // Whenever the value subsequently changes, slowly fade the element in or out
        var value = valueAccessor();
        ko.unwrap(value) ? $(element).fadeIn() : $(element).hide();
    }
};

ko.bindingHandlers.bsChecked = {
    init: function (element, valueAccessor, allBindingsAccessor,
    viewModel, bindingContext) {
        var value = valueAccessor();
        var newValueAccessor = function () {
            return {
                change: function () {
                    value(element.value);
                }
            }
        };
        ko.bindingHandlers.event.init(element, newValueAccessor,
        allBindingsAccessor, viewModel, bindingContext);
    },
    update: function (element, valueAccessor, allBindingsAccessor,
    viewModel, bindingContext) {
        if ($(element).val() == ko.unwrap(valueAccessor())) {
            $(element).closest('.btn').button('toggle');
        }
    }
}
