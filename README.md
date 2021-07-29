# PubNub Developer Tools Chrome Extension

## Clone repository

    git clone https://github.com/Hoang-Tang/Pubnub-Developer-Tools.git
    
## Load the unpacked extension

1. In Chrome, open chrome://extensions/
2. Click + Developer mode
3. Click Load unpacked extension…
4. Navigate to the extension’s folder and click OK
5. Delete the (extracted) folder (the extension have copied) 

## Chrome Web Store

[PubNub Developer Tools](https://chrome.google.com/webstore/detail/pubnub-console-2/lheeeennaibflmlobegogdphfhdgbobl)

## Description

Monitor PubNub traffic filtered by channels. Support PubNub version 4.xx.x

 Use Ctrl+Shift+I (or Cmd+Opt+I on Mac) to open DevTools

Adds a PubNub tab in Google Chrome’s developer tools.

The extension monitors PubNub traffics on the page you are inspecting. Whenever the page publishes or receives a message 
it shows up in the console for that channel.

Channel tabs are added to the menu on the left when messages are published or subscribed to on the page. You can click 
on a channel to view the PubNub traffic for that specific channel.

It includes a few special features:

1. All output is JSON formatted and color coded. 
2. Channel output can be cleared by clicking “Clear Output”
3. If history are enabled on your PubNub account, you can load the previous two minutes of messages in a channel by 
clicking “Previous 2 minutes.” You can continue clicking this to go back in time. (NOTE: This only work if you enable 
history from your PubNub account.)
4. Data persists through navigation.
5. Add Dark and Light Mode so the words are readable.
