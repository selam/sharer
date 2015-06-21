var _GA_ID = 'UA-64347199-1'

var _gaq = _gaq || [];
_gaq.push(['_setAccount', _GA_ID]);

(function() {
    var ga = document.createElement('script'); ga.type = 'text/javascript'; ga.async = true;
    ga.src = 'https://ssl.google-analytics.com/ga.js';
    var s = document.getElementsByTagName('script')[0]; s.parentNode.insertBefore(ga, s);
})();

chrome.runtime.onInstalled.addListener(function(details) {
    var content_script, manifest, promises;
    manifest = chrome.runtime.getManifest();
    promises = (function() {
    var i, len, ref, results;
    ref = manifest.content_scripts;
    results = [];
    for (i = 0, len = ref.length; i < len; i++) {
      content_script = ref[i];
      results.push(new Promise(function(resolve) {
        chrome.tabs.query({
          url: content_script.matches
        }, function(tabs) {
          var j, len1, tab;
          for (j = 0, len1 = tabs.length; j < len1; j++) {
            tab = tabs[j];
            chrome.tabs.reload(tab.id);
          }
          resolve();
        });
      }));
    }
    return results;
  })();
  return Promise.all(promises);    
});


chrome.extension.onRequest.addListener(function(request, sender, sendResponse) {
    if(request.command == 'create-tab') {
        chrome.tabs.create({"url": request.url, "selected":false}); 
    }
    else if (request.command == '_trackEvent') {
        _gaq.push(['_trackEvent', request.eventName, request.eventStatus]);
    }
    sendResponse({});
});

  