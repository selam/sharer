var SDK_APP_ID = 'sdk_sharer_effe0d10e8';
var PHOTO_EXTS = ['jpg', 'jpeg', 'png', 'tiff', 'tif', 'gif', 'bmp'];
var IMGUR_CLIENT_ID = "9d2eb0468195340";

InboxSDK.load('1', SDK_APP_ID).then(function(sdk){  
    var update_progress_bar = function(percentComplete) {
        document.getElementById("progress-bar").innerHTML = parseInt(percentComplete).toString() + '%';
        document.getElementById("progress-bar").style.width = parseInt(percentComplete).toString() + '%';
    };
    
    var something_went_wrong = function() {
        sdk.ButterBar.showMessage({
            text: chrome.i18n.getMessage("something_wrong")
        });
    };
    
    sdk.Conversations.registerMessageViewHandler(function(message_view){
        attachment_cards = message_view.getFileAttachmentCardViews();
        for (i = 0, len = attachment_cards.length; i < len; i++) {   
            (function(attachment_card) {
                var cardElem = attachment_card._attachmentCardImplementation.getElement();
                var download_url = cardElem.getAttribute('download_url');
                var re = /([^:]+):([^:]+):(.+)/;
                var match = re.exec(download_url);
                if (!match) {
                    return;
                }
                var filename = decodeURIComponent(match[2]);
                var ext = filename.toLowerCase().split(".").pop()
                if(PHOTO_EXTS.indexOf(ext) >= 0){                    
                    attachment_card.addButton({
                        iconUrl: chrome.runtime.getURL('images/white_sharer48.png'),
                        tooltip: chrome.i18n.getMessage('saver_button_tooltip'),
                        onClick: function(event) {
                            var modal;
                            var xhr = new XMLHttpRequest();
                            xhr.responseType = 'blob';
                            xhr.onprogress = function(evt){
                                if (evt.lengthComputable) {  
                                    var percentComplete = (evt.loaded / evt.total) * 100;     
                                   update_progress_bar(percentComplete);
                                }
                            };
                            xhr.onloadstart = function() {
                                modal = sdk.Modal.show({
                                    el: '<div style="width:250px;margin:15px;"><h4 id="progress-title">'+chrome.i18n.getMessage("downloading")+'</h4><div class="progress"><div id="progress-bar" class="progress-bar" role="progressbar" aria-valuenow="60" aria-valuemin="0" aria-valuemax="100" style="width:0%;"></div></div></div>',
                                    chrome: false,
                                });
                            };
                            xhr.withCredentials = true;
                            xhr.onload = function(resp) {
                                if (xhr.status == 200) {
                                    var formData = new FormData();                                    
                                    formData.append("image", xhr.response);
                                    // Download finish    
                                    var uploader =  new XMLHttpRequest();
                                    uploader.onloadstart = function(e){
                                        document.getElementById('progress-title').innerHTML = chrome.i18n.getMessage('uploading');
                                        update_progress_bar('0');
                                    };
                                    uploader.onload = function() {
                                        if(uploader.status == 200) {
                                            resp = JSON.parse(uploader.response);
                                            chrome.extension.sendRequest({url: resp.data.link}, function(response) {
                                                modal.close();
                                                sdk.ButterBar.showMessage({
                                                    text: chrome.i18n.getMessage("successfuly_uploaded")
                                                });
                                            });                                      
                                        } else { // if uploader.status neq 200
                                            modal.close();
                                            something_went_wrong();
                                        }                                                                                
                                    };
                                    uploader.upload.onprogress = function(evt){
                                        if (evt.lengthComputable) {  
                                            var percentComplete = (evt.loaded / evt.total) * 100;     
                                            update_progress_bar(percentComplete);
                                        }
                                    };
                                    uploader.open("POST", "https://api.imgur.com/3/upload");
                                    uploader.setRequestHeader('Authorization', 'Client-ID '+IMGUR_CLIENT_ID);    
                                    uploader.send(formData);
                                } else { // xhr.status neq 200
                                    modal.close();
                                    something_went_wrong();
                                }                                
                            };
                            xhr.open("GET", match[3]);                            
                            xhr.send();
                        }
                    });
                }
            })(attachment_cards[i])
        }        
    });
});