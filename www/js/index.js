var constants = {
    'SESSIONS_PAGE_TITLE': 'Sessions',
    'COURSE_PAGE_TITLE': 'Course'
};

var deviceReadyDeferred = new $.Deferred();
var jQueryReadyDeferred = new $.Deferred();

$(function(){
    jQueryReadyDeferred.resolve();
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
    appCulture: {
        lang: ko.observable('en'),
        strings: ko.observable(strings),
    },
    appState: {
        activePage: ko.observable(constants.SESSIONS_PAGE_TITLE),
        activePageTitle: ko.observable(constants.SESSIONS_PAGE_TITLE),
        previousPageTitle: ko.observable(constants.SESSIONS_PAGE_TITLE),
        activeSession: ko.observable(null),
        activeCourse: ko.observable(null)
    },
    dataModel: {
        sessions: ko.observableArray(sessionsData)
    },
    sessionPageState: {
        showCreateNewSession: ko.observable(true)
    }
  }
  
  // add state attributes to data model's elements
  vm.dataModel.sessions().forEach(function(session){
    session.showCreateNewCourse = ko.observable(true);
    session.courses().forEach(function(course){
        course.creationMode = ko.observable(false);
    });
  });
    
  vm.dataModel.sessions().forEach(function(session){
      session.creationMode = ko.observable(false);
  });
     
  // define view model's functions
  vm.changeAndNavigateToActiveCourse = function(course){
      if(!course.creationMode()){
        vm.appState.activePageTitle(course.title);
        vm.appState.activeCourse(course);
        vm.appState.activePage(constants.COURSE_PAGE_TITLE); 
      }
  }
  
  vm.navigateBack = function(){
    switch(vm.appState.activePage()){
        case constants.COURSE_PAGE_TITLE:
            vm.appState.activePage(constants.SESSIONS_PAGE_TITLE);
            vm.appState.activeCourse(null);
            break;
    }
  }
  
  vm.sessionOnClick = function(session, elem){
      
    var collapsiblePanel = $(elem.target).parents('.panel-heading').next('.panel-collapse');
    var currentId = $(collapsiblePanel).attr('id');
    $('.panel-collapse').not('#' + currentId).slideUp('fast');
    $(collapsiblePanel).slideToggle('fast');    
    
    var incompleteNewSessionToRemove = null;
    
    if(vm.appState.activeSession()!= null && vm.appState.activeSession().creationMode()){
        incompleteNewSessionToRemove = vm.appState.activeSession();
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
  
  vm.addNewSession = function(){
    var dfd = new jQuery.Deferred();
    $('.panel-collapse').slideUp('fast'); // collapse open session if any
    vm.sessionPageState.showCreateNewSession(false);
    var s = vm.dataModel.sessions()[vm.dataModel.sessions().length -1];
    var sessionToAdd = new Session(s.id + 1, "", []); // next available session id 
    sessionToAdd.showCreateNewCourse = ko.observable(true);
    sessionToAdd.creationMode = ko.observable(true);
    vm.dataModel.sessions.push(sessionToAdd); 
    vm.appState.activeSession(sessionToAdd);
    return dfd.resolve();
  }
  
  vm.createSession = function(session){
      session.creationMode(false);
      vm.sessionPageState.showCreateNewSession(true);
      vm.appState.activeSession(session);
      $('#session' + session.id).addClass('in');
  }
  
  vm.cancelAddNewSession = function(session){
    vm.appState.activeSession(vm.dataModel.sessions()[0]); // first session on the list active after cancel
    vm.dataModel.sessions.remove(session);
    vm.sessionPageState.showCreateNewSession(true);
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
    vm.appState.activeSession().courses.push(courseToAdd); // next available course id for this session
    return dfd.resolve();
  }
  
  vm.createCourse = function(course){
      course.creationMode(false);
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
