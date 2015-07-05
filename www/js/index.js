var vm = {};

document.addEventListener("deviceReady", deviceReady, false);

function deviceReady() {
  deviceReadyDeferred.resolve();
}

$(function(){
  jQueryReadyDeferred.resolve();
});

$.when(deviceReadyDeferred, jqmReadyDeferred).then(createViewModel);

function createViewModel() {
  // TBD
}
