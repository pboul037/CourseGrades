var strings = {
    'ADD_NEW_COURSE': {
        'en': 'Add a new course',
        'fr': 'Ajouter un nouveau cours'
    },
    'ADD_NEW_SESSION': {
        'en': 'Add a new session',
        'fr': 'Ajouter une nouvelle session'
    },
    'SYLLABUS_ITEMS': {
        'en': 'Syllabus Items',
        'fr': 'Éléments de cours'
    },
    'GRADES_TAB_TITLE': {
        'en': 'Grades',
        'fr': 'Notes'
    },
    'INFO_TAB_TITLE': {
        'en': 'Info',
        'fr': 'Info'
    },
    'ENTER_COURSE_TITLE_PLACEHOLDER': {
        'en': 'Enter course title...',
        'fr': 'Entrez le nom du cours...'
    },
    'CANCEL': {
        'en': 'Cancel',
        'fr': 'Annuler'
    },
    'CREATE': {
        'en': 'Create',
        'fr': 'Créer'
    },
    'CREATE_AND_ADD_ANOTHER': {
        'en': 'Create & Add Another',
        'fr': 'Créer et en ajouter un autre'
    },
    getString: function(string, lang){
        return this[string][lang];
    }
}