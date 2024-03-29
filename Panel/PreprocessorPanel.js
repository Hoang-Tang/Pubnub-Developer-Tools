(function() {
  var rendered_channels = {},
      instances = {};

  var library = {
    pad: function(n) { return ("0" + n).slice(-2); },
    json: {
      replacer: function(match, pIndent, pKey, pVal, pEnd) {
        var key = '<span class=json-key>';
        var val = '<span class=json-value>';
        var str = '<span class=json-string>';
        var r = pIndent || '';
        if (pKey)
          r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
        if (pVal)
          r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
        return r + (pEnd || '');
      },
      prettyPrint: function(obj) {
        var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
        return JSON.stringify(obj, null, 2)
            .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
            .replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(jsonLine, library.json.replacer);
      }
    }
  };

  function scrollWatch(channel) {
    var $div = $('.console[data-channel="' + channel + '"] .lines');
    $div.scroll(function() {
      if((($div.prop('scrollHeight') - 30) < ($div.scrollTop() + $div.height()))) {
        rendered_channels[channel].auto_scroll = true;
      } else {
        rendered_channels[channel].auto_scroll = false;
      }
    });
  }

  function autoScroll(channel) {
    var $div = $('.console[data-channel="' + channel + '"] .lines');
    if(rendered_channels[channel].auto_scroll) {
      $div.prop('scrollTop', $div.prop('scrollHeight'));
    }
  }

  function render(channel_, message, timestamp, type, subscribe_key) {
    if(typeof message !== "undefined") {
      var date = new Date(timestamp / 10000),
          channel = escape(channel_),
          $new_line = $('<li></li>'),
          $channels = $('#channels'),
          $consoles = $('#consoles'),
          $new_console = null,
          $the_console = null,
          $load_history = null,
          $clear_lines = null,
          $filter = null,
          $notes = null;

      if (subscribe_key && !(subscribe_key in instances)) {
        instances[subscribe_key] = new PubNub({
          subscribeKey: subscribe_key
        });
      }

      if (typeof rendered_channels[channel] == 'undefined') {
        $new_console = $('<ul class="lines"></ul>');
        $tools = $('<div class="tools"><a class="logo" href="#"><img src="http://www.pubnub.com/static/images/structure/pubnub.png"/></a></div>');
        $tools.find('.logo').click(function(){
          window.open("http://www.pubnub.com");
          return false;
        });

        $new_console_wrapper = $('<div class="console hide" data-channel="' + channel + '"></div>');
        $new_console_wrapper.append($tools);
        $new_console_wrapper.append($new_console);

        $new_channel = $('<li class="channel" data-channel="' + channel + '"><div class="name">' + channel_ + '</div><div class="sparky"></div></li>');
        $channels.append($new_channel);

        $new_channel.click(function() {
          changePage(channel);
          return false;
        });

        $consoles.append($new_console_wrapper);

        $clear_lines = $('<a class="tool" href="#"><i class="fa fa-eye-slash"></i>Clear</a>');
        $tools.append($clear_lines);

        $clear_lines.click(function(e) {
          $('.console[data-channel="' + channel + '"] .lines').html('');
          rendered_channels[channel].last_timestamp = new Date().getTime() * 10000;
          return false;
        });

        $load_history = $('<a class="tool" href="#"><i class="fa fa-clock-o"></i>Previous 2 Minutes</a>');
        $tools.append($load_history);

        $load_history.click(function(e) {
          load_history(channel, subscribe_key);
          return false;
        });

        $presence = $('<a class="tool" href="#"><i class="fa fa-users"></i>Here Now</a>');
        $tools.append($presence);

        $presence.click(function(e) {
          presence(channel, subscribe_key);
          return false;
        });

        $filter = $('<select class="tool filter"> \
          <option value="0">All Messages</option> \
          <option value="1">Only Subscribe</option> \
          <option value="2">Only Publish</option> \
          <option value="3">Only History</option> \
          <option value="4">Only Presence</option> \
        </select>');

        $tools.append($filter);

        $filter.on('change', function() {

          $new_console_wrapper.find('li').each(function(i, el) {
            $(el).removeClass('hide');
          });

          if(this.value === 1) {
            $new_console_wrapper.find('li:not(.subscribe)').each(function(i, el) {
              $(el).addClass('hide');
            });
          }

          if(this.value === 2) {
            $new_console_wrapper.find('li:not(.publish)').each(function(i, el) {
              $(el).addClass('hide');
            });
          }

          if(this.value === 3) {
            $new_console_wrapper.find('li:not(.history)').each(function(i, el) {
              $(el).addClass('hide');
            });
          }

          if(this.value === 4) {
            $new_console_wrapper.find('li:not(.presence)').each(function(i, el) {
              $(el).addClass('hide');
            });
          }
        });

        if($('#channels .channel').length === 1) {
          changePage(channel);
        }

        rendered_channels[channel] = {
          auto_scroll: true,
          last_timestamp: timestamp,
          messages: 0,
          messages_over_time: []
        };

        scrollWatch(channel);
        resizeLines();
        switch_on();
      }

      rendered_channels[channel].messages = rendered_channels[channel].messages + 1;
      $notes = $('<div></div>');
      $notes.addClass('notes');
      $the_console_wrapper = $('.console[data-channel="' + channel + '"]');
      $the_console = $($the_console_wrapper.find('.lines')[0]);
      $new_line.html(library.json.prettyPrint(message));
      $new_line.append($notes);

      if(type === 3) {
        $new_line.addClass('history');
        $the_console.prepend($new_line);
      } else if (type === 5) {
        $new_line.addClass('history');
        $the_console.append($new_line);
      } else if (type === 4) {
        $new_line.addClass('presence');
        $the_console.append($new_line);
      } else {
        if(type === 2) {
          $new_line.addClass('publish');
          if($the_console_wrapper.find('.tool.filter')[0].value === 1) {
            $new_line.classList.add('hide');
          }
        } else {
          $new_line.addClass('subscribe');
          if($the_console_wrapper.find('.tool.filter')[0].value === 2) {
            $new_line.classList.add('hide');
          }
        }
        $notes.html(library.pad(date.getHours()) + ':' + library.pad(date.getMinutes()) + ':' + library.pad(date.getSeconds()));
        $the_console.append($new_line);
      }
      autoScroll(channel);
    }
  }

  function changePage(channel) {
    var $consoles = $('.console'),
        $the_console = $('.console[data-channel="' + channel + '"]'),
        $channels = $('.channel'),
        $the_channel = $('.channel[data-channel="' + channel +'"]');

    $consoles.each(function(i, el) {
      $(el).removeClass('show');
      $(el).addClass('hide');
    });

    $channels.each(function(i, el) {
      $(el).removeClass('active');
    });

    $the_console.removeClass('hide');
    $the_console.addClass('show');
    $the_channel.addClass('active');
  }

  function load_history(channel, subscribe_key) {
    var since_when = rendered_channels[channel].last_timestamp - (2 * 60 * 1000 * 10000);

    if (!subscribe_key in instances) {
      return;
    }

    instances[subscribe_key].history({
      channel: channel,
      start: since_when,
      end: rendered_channels[channel].last_timestamp
    }, function(status, history){
      if(history && history.messages && history.messages.length > 0){
        history.messages.reverse();

        for(var i = 0; i < history.messages.length; i++) {
          render(channel, history.messages[i].entry, history.messages[i].timetoken, 3);
        }

        rendered_channels[channel].auto_scroll = false;
        rendered_channels[channel].last_timestamp = since_when;
        $('.console[data-channel="' + channel + '"] .lines').prop('scrollTop', 0);
      } else {
        alert('No history for this channel.');
      }
    });
  }

  function presence(channel, subscribe_key) {
    if (!subscribe_key in instances) {
      return;
    }

    instances[subscribe_key].hereNow({
      channels: [channel]
    }, function (status, hereNow){
      render(channel, hereNow, (new Date().getTime() * 10000), 4);
    });
  }

  function bindRequest() {
    chrome.devtools.network.onRequestFinished.addListener(function(request) {

      var parser = document.createElement('a'),
          params = null,
          channel = null,
          message = null,
          subscribe_key = null,
          channels = [],
          i = 0;

      parser.href = request.request.url;

      if(parser.hostname.split('.')[1] === 'pndsn' || parser.hostname.split('.')[1] === 'pubnub') {
        params = parser.pathname.split('/');

        if(params[1] === 'publish') {
          channel = decodeURIComponent(params[5]);
          subscribe_key = decodeURIComponent(params[3]);
          message = JSON.parse(decodeURIComponent(params[7]));
          render(channel, message, (new Date().getTime() * 10000), 2, subscribe_key);
        }

        if(params[2] === 'history') {
          channel = decodeURIComponent(params[6]);
          subscribe_key = decodeURIComponent(params[4]);

          request.getContent(function(body){
            var parsed = JSON.parse(body);
            if(parsed && parsed[0].length) {
              for(var i = 0; i < parsed[0].length; i++) {
                render(channel, parsed[0][i], parsed[1], 5, subscribe_key);
              }
            }
          });
        }

        if(params[2] === 'presence' && !params[7]) {
          channel = decodeURIComponent(params[6]);
          subscribe_key = decodeURIComponent(params[4]);

          request.getContent(function(body){
            var parsed = JSON.parse(body);

            if(parsed) {
              render(channel, parsed, (new Date().getTime() * 10000), 4, subscribe_key);
            }
          });
        }

        if(params[2] === 'subscribe') {
          request.getContent(function(body){
            var parsed = JSON.parse(body);
            subscribe_key = decodeURIComponent(params[3]);
            if(parsed) {
              if(typeof parsed[2] !== 'undefined') {
                channels = parsed[2].split(',');

                for(var i = 0; i < parsed[0].length; i++) {
                  render(channels[i], parsed[0][i], (new Date().getTime() * 10000), 1, subscribe_key);
                }
              } else {
                if(parsed.error) {
                  render(parsed.payload.channels[0], parsed.service + ': ' + parsed.message, (new Date().getTime() * 10000), 1, subscribe_key);
                } else {
                  channel = params[4];

                  if(parsed && parsed.m && typeof parsed.m[0] !== 'undefined') {
                    channel = parsed.m[0].c;
                    message = parsed.m[0].d;
                    render(channel, message, (new Date().getTime() * 10000), 1, subscribe_key);
                  }
                }
              }
            } else {
              console.log('parsed fail on message')
              console.log(body)
            }
          });
        }
      }
    });
  }

  function resizeLines() {
    var $lines = $('.lines'), new_height = ($(window).height() - 25);

    $lines.each(function(i, el) {
      $(el).height(new_height);
    });
  }

  function switch_on() {
    if($('#off').is(':visible')) {
      $('#off').hide();
    }
  }

  function start() {
    bindRequest();
    resizeLines();

    $(window).resize(resizeLines);

    setInterval(function(){
      $('.channel').each(function(i, el) {
        var a_channel = rendered_channels[$(el).attr('data-channel')];
        if(a_channel.messages_over_time.length > 10) {
          a_channel.messages_over_time.shift();
        }
        a_channel.messages_over_time.push(a_channel.messages);
        a_channel.messages = 0;
        $(el).find('.sparky').sparkline(a_channel.messages_over_time, {type: 'bar', width: '50px', barColor: '#BBB', height: '15px', chartRangeMin: 0, chartRangeMax: 8, disableTooltips: true, disableHighlight: true});
      });
    }, 1000);
  }

  start();

})();
