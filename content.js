// TODO - popup with simple "קבע לי תור" button. Will open
// with extra hash that will triger the open of Shraga

const STATE_INIT = 'STATE_INIT';
const STATE_INIT_COMPLETE = 'STATE_INIT_COMPLETE';
const STATE_INIT_FAILURE = 'STATE_INIT_FAILURE';
const STATE_LOGGED_OUT = 'STATE_LOGGED_OUT';

const STATE_LOAD_LAST_USER_DATA = 'STATE_LOAD_LAST_USER_DATA';
const STATE_LOAD_LAST_SEARCH_DATA = 'STATE_LOAD_LAST_SEARCH_DATA';

const STATE_ID_INPUT = 'STATE_ID_INPUT';
const STATE_ID_INPUT_VALIDATION = 'STATE_ID_INPUT_VALIDATION';
const STATE_PHONE_INPUT = 'STATE_PHONE_INPUT';
const STATE_PHONE_INPUT_VALIDATION = 'STATE_PHONE_INPUT_VALIDATION';

const STATE_SERVICE_TYPE_INPUT = 'STATE_SERVICE_TYPE_INPUT';
const STATE_LOCATION_INPUT = 'STATE_LOCATION_INPUT';
const STATE_MONTH_INPUT = 'STATE_MONTH_INPUT';
const STATE_TIME_INPUT = 'STATE_TIME_INPUT';
const STATE_SEARCHING = 'STATE_SEARCHING';
const STATE_SEARCH_SUCCESS = 'STATE_SEARCH_SUCCESS';
const STATE_SEARCH_FAILURE = 'STATE_SEARCH_FAILURE';
const STATE_SOMETHING_WENT_WRONG = 'STATE_SOMETHING_WENT_WRONG';
const STATE_ALREADY_HAVE_AN_APPONTMENT = 'STATE_ALREADY_HAVE_AN_APPONTMENT';
const STATE_USER_ALREADY_HAVE_AN_APPONTMENT = 'STATE_USER_ALREADY_HAVE_AN_APPONTMENT';
const STATE_DISCLAIMER = 'DISCLAIMER';

const MIN_MINUTES_FROM_TODAYS_SLOT = 90;

var apiHost = window.location.host === 'piba.myvisit.com'
    ? 'piba-api.myvisit.com' : 'central.myvisit.com';

var toolTipObject = null;
var allLocations = [];
var hasAppointment = false;
var disclaimerAccepted = false;

var curState = STATE_INIT;

// personal data
var userId;
var userPhone;

// search data
var serviceIdSelection = [];
var serviceTypeSelection;
var timeSelection = [];
var monthSelection = [];

var serviceTypeId;
var isLoggedIn;
var initComplete;

var appointment;

var windowWasOpened = false;
var input;

var onBoardServices;

function handleInput(i) {
    // add buuble
    const container = $(`<div class="shraga-user-input-bubble">${i}</div>`);

    addChatContent(container, false);

    input = i;
    switch (curState) {
        case STATE_ID_INPUT:
            runStateMachine(STATE_ID_INPUT_VALIDATION);
            break;
        case STATE_PHONE_INPUT:    
            runStateMachine(STATE_PHONE_INPUT_VALIDATION);
            break;
        default:
            console.error('unknown input state', curState);    
    }
}

function dateAdd(date, interval, units) {
    if(!(date instanceof Date))
      return undefined;
    var ret = new Date(date); //don't change original date
    var checkRollover = function() { if(ret.getDate() != date.getDate()) ret.setDate(0);};
    switch(String(interval).toLowerCase()) {
        case 'year'   :  ret.setFullYear(ret.getFullYear() + units); checkRollover();  break;
        case 'quarter':  ret.setMonth(ret.getMonth() + 3*units); checkRollover();  break;
        case 'month'  :  ret.setMonth(ret.getMonth() + units); checkRollover();  break;
        case 'week'   :  ret.setDate(ret.getDate() + 7*units);  break;
        case 'day'    :  ret.setDate(ret.getDate() + units);  break;
        case 'hour'   :  ret.setTime(ret.getTime() + units*3600000);  break;
        case 'minute' :  ret.setTime(ret.getTime() + units*60000);  break;
        case 'second' :  ret.setTime(ret.getTime() + units*1000);  break;
      default       :  ret = undefined;  break;
    }
    return ret;
}

function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

function hideInput() {
    $(".jBox-content").animate({
        height: '560px'
     }, { duration: 200, queue: false });
 
     $(".shraga-user-input-container").animate({
        height: '0px'
     }, { duration: 200, queue: false });
}

function showInput() {
    mainWindowHeight = $(".jBox-content").innerHeight();

    $(".jBox-content").animate({
        height: '500px',
    }, { duration: 200, queue: false });
 
    $(".shraga-user-input-container").animate(
        { height: '60px' },
        { 
            duration: 200,
            queue: false,
         },
    );

    const container = $(".shraga-container").parent();
    container.animate({ scrollTop: container.prop("scrollHeight")}, {duration:200, queue: false});
}

async function getServiceTypeId() {
    const res = await fetch(`https://${apiHost}/CentralAPI/GetServiceTypeList?organizationId=56`, {
        "headers": {
          "accept": "application/json, text/plain, */*",
          "accept-language": "en",
          "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
          "application-name": "myVisit.com v3.5",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site"
        },
        "referrer": "https://myvisit.com/",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
      });

    const json = await res.json();
    return json["Results"].find(service => service.serviceTypeName === 'תיאום פגישה לתיעוד ביומטרי')["serviceTypeId"];
}

async function getOrgId() {
    const res = await fetch(`https://${apiHost}/CentralAPI/ProviderSearch?CategoryId=0&CountryId=1&ResultsInPage=20&SearchPhrase=&ViewMode=0&currentPage=1&mostPopular=true&src=mvws`, {
        "headers": {
          "accept": "application/json, text/plain, */*",
          "accept-language": "en",
          "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
          "application-name": "myVisit.com v3.5",
          "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Google Chrome\";v=\"109\", \"Chromium\";v=\"109\"",
          "sec-ch-ua-mobile": "?0",
          "sec-ch-ua-platform": "\"macOS\"",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site"
        },
        "referrer": "https://myvisit.com/",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
      });
}

async function getLoggedInStatus() {
    res = await fetch(`https://${apiHost}/CentralAPI/Organization/56/PrepareVisit`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en",
            "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
            "application-name": "myVisit.com v3.5",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
});

    return res.status !== 401;  
}

async function getLocations() {
    res = await fetch(`https://${apiHost}/CentralAPI/LocationSearch?organizationId=56&resultsInPage=100&serviceTypeId=156`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en",
            "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
            "application-name": "myVisit.com v3.5",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
          },
          "mode": "cors",
          "credentials": "include"
    });

    if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
    }

    const json = await res.json();

    return json['Results'].map(res => {
        return {
            name: res['LocationName'],
            id: res['ServiceId']
        }
    });
}

function playSound(soundToPlay) {
    var audio = document.createElement('audio');
    audio.src = chrome.runtime.getURL('sound/' + soundToPlay);
    audio.autoplay = true;
    return audio.play(); 
}

async function getRelevantTimeSlots(serviceId, calendarInfo) {
    const calendarId = calendarInfo['calendarId']
    res = await fetch(`https://${apiHost}/CentralAPI/SearchAvailableSlots?CalendarId=${calendarId}&ServiceId=${serviceId}&dayPart=0`, {
      "headers": {
        "accept": "application/json, text/plain, */*",
        "accept-language": "en",
        "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
        "application-name": "myVisit.com v3.5",
        "sec-fetch-dest": "empty",
        "sec-fetch-mode": "cors",
        "sec-fetch-site": "same-site"
      },
      "mode": "cors",
      "credentials": "include"
    });

    if (res.status === 401) {
        throw new Error('http error');
    }
    
    if (!res.ok) {
        return;
    }
    
    const json = await res.json();
    if (!json["Success"] || !json['TotalResults']) {
        return;
    }

    const now = new Date();
    const isToday = now.toDateString() === new Date(calendarInfo['calendarDate']).toDateString();

    const slots = json['Results'].filter(slot => {
        // if the slot is today and less than 90 minutes from now, skip it since
        // the user might not have enough time to get there and they won't be able
        // to cancel it either due to the restriction of can't cancel an hour before
        // the appointment
        if (isToday) {
            const minutesFromMidnight = now.getHours() * 60 + now.getMinutes();
            if (slot['Time'] - minutesFromMidnight < MIN_MINUTES_FROM_TODAYS_SLOT) {
                return false;
            }
        }
        if (!timeSelection.length) {
            return true;
        }

        for (const relevantTs of timeSelection) {
            parts = relevantTs.split('-')
            const from = Number(parts[0]);
            const to = Number(parts[1]);
            if (slot['Time'] >= from && slot['Time'] <= to) {
                return true;
            }
        }
    })
    .map(slot => slot['Time']);
    
    if (isToday) {
        // since it takes time to get to the appointment, if the free slot is today
        // prefer the latest available slot
        slots.reverse();
    }

    return slots;
}


async function getAvailableDates(serviceId) {
    var res;
    try {
        res = await fetch(`https://${apiHost}/CentralAPI/SearchAvailableDates?maxResults=365&serviceId=${serviceId}&startDate=${getTodayDate()}`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en",
            "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
            "application-name": "myVisit.com v3.5",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "mode": "cors",
        "credentials": "include"
        });
    } catch {
        return [];
    }
  
    if (res.status === 401) {
      throw new Error('http error');
    }

    if (!res.ok) {
        return [];
    }
  
    const json = await res.json();

    if (!json["Success"]) {
        return [];
    }
    
    return (json['Results'] || []).filter(r => {
        const appDate = r['calendarDate'].split('T')[0];
        const dateParts = appDate.split('-');
        if (monthSelection.includes(`${dateParts[0]}-${dateParts[1]}`)) {
            return true;
        }

        const rDate = new Date(r['calendarDate']);
        const now = new Date();
        
        // check the options 1-4 next weeks
        for (var w = 1 ; w <= 4 ; w++) {
            if (!monthSelection.includes(`w${w}`)) {
                continue;
            }

            if (dateAdd(now, 'week', w) >= rDate) {
                return true;
            }
        }

        return false;
    });
}

function getRelevantDates(res) {
    return res.filter(d => {
        const appDate = json['Results'][0]['calendarDate'].split('T')[0];
        const dateParts = appDate.split('-');
        return monthSelection.includes(`${dateParts[0]}-${dateParts[1]}`);
    });
}


async function runSearchForServiceId(serviceId) {
    const availableDates = await getAvailableDates(serviceId)
    if (!availableDates.length) {
        return false;
    }

    for (const availableDate of availableDates) {
        const relevantSlots = await getRelevantTimeSlots(serviceId, availableDate);
        for (const relevantTimeSlot of relevantSlots) {
            const state = await setAnAppointment(onBoardServices.find(s => s["Data"]["ServiceId"] === serviceId), availableDate["calendarDate"], relevantTimeSlot);
            if (!state) {
                await new Promise(r => setTimeout(r, 2000));
                continue;
            }

            if (state === STATE_ALREADY_HAVE_AN_APPONTMENT) {
                return STATE_ALREADY_HAVE_AN_APPONTMENT;
            }
                
            const appDate = availableDate['calendarDate'].split('T')[0];
            const dateParts = appDate.split('-');
            const printDate = `${dateParts[2]}/${dateParts[1]}/${dateParts[0]}`

            const timeDate = dateAdd(new Date(2023,1,1), 'minute', relevantTimeSlot);

            appointment = {
                name: allLocations.find(l => l.id === serviceId).name,
                date: printDate,
                time: `${pad(timeDate.getHours(),2)}:${pad(timeDate.getMinutes(),2)}`,
            }

            return STATE_SEARCH_SUCCESS;
        }
    }

    return false;
}

async function runSearch() {
    // let's wait for all services to be onboarded
    try {
        await onboardSelectedServices();
    } catch {
        runStateMachine(STATE_SOMETHING_WENT_WRONG);
        return;
    }

    try {
        while (true) {
            for (serviceId of serviceIdSelection) {
                const state = await runSearchForServiceId(serviceId);
                if (!state) {
                    await new Promise(r => setTimeout(r, 15000));
                    continue;
                }

                runStateMachine(state);
                return;
            }
        }
    } catch {
        runStateMachine(STATE_SEARCH_FAILURE);
    }
}

async function init() {
    try {
        runStateMachine(STATE_INIT);
        [allLocations, isLoggedIn, hasAppointment] = await Promise.all([getLocations(), getLoggedInStatus(), checkIfUserHasAppontments()]);
        runStateMachine(STATE_DISCLAIMER);
    } catch (err) {
        console.log('unable to init system', err);
        runStateMachine(STATE_INIT_FAILURE);
    }    
}

var chatMessagesQueue = [];

function addChatMessage(message, withDotsAnimation, callback) {
    const div = $('<div/>');
    div.addClass('shraga-message-bubble');
    div.html(message);

    chatMessagesQueue.push({content: div, animation: withDotsAnimation, callback: callback});
    if (chatMessagesQueue.length === 1) {
        displayNextChatMessage();
    }
}

function addChatContent(content, withDotsAnimation, callback) {
    chatMessagesQueue.push({content: $(content), animation: withDotsAnimation, callback: callback});
    if (chatMessagesQueue.length === 1) {
        displayNextChatMessage();
    }
}

var isDotsVisible = false;
function addDots() {
    isDotsVisible = true;
    const div = $('<div/>');
    div.html(`
        <span class="shraga-dots-cont">
            <span class="shraga-dot shraga-dot-1"></span>
            <span class="shraga-dot shraga-dot-2"></span>
            <span class="shraga-dot shraga-dot-3"></span>
        </span>
    `);

    addChatItem(div);
}

function replaceDotsWithContent(content) {
    isDotsVisible = false;
    $('.shraga-container > :last').prev().remove();
    addChatItem(content)
}

function addChatItem(content) {
    // disable all previous buttons
    $('.shraga-chat-button').each(function() {
        jQuery(this).addClass('disabled');
        jQuery(this).off('click');
        jQuery(this).removeAttr('id');
    })
    content.addClass('shraga-chat-item');

    $('.shraga-container > :last').before(content);

    document.querySelector('.jBox-content').style.overflowY = 'scroll';
    const container = $(".shraga-container").parent();
    container.animate({ scrollTop: container.prop("scrollHeight")}, 500);
}
    
function displayNextChatMessage() {
    const msg = chatMessagesQueue[0];

    if (isDotsVisible) {
        replaceDotsWithContent(msg.content);
        msg.callback && msg.callback();

        chatMessagesQueue.shift();
        if (chatMessagesQueue.length) {
            setTimeout(displayNextChatMessage, 0);
        }
        
        return;
    }

    if (!msg.animation) {
        addChatItem(msg.content);
        msg.callback && msg.callback();
        
        chatMessagesQueue.shift();
        if (chatMessagesQueue.length) {
            setTimeout(displayNextChatMessage, 0);
        }
        return;
    }

    addDots();

    setTimeout(
        () => {
            replaceDotsWithContent(msg.content);
            msg.callback && msg.callback();

            chatMessagesQueue.shift();
            if (chatMessagesQueue.length) {
                setTimeout(displayNextChatMessage, 0);
            }            
        },
        2000,
    );
}

function initServiceTypeSelection(id) {
    new lc_select(`#${id}`, {
        wrap_width: '100%',
        pre_placeh_opt: true,
        enable_search: false,
        autofocus_search: true,
        addit_classes: ['lcslt-rtl'],
        on_change: (selections) => {
            $('#acceptServiceButton').removeClass('disabled');
            serviceTypeSelection = selections[0];
        },
    });
    
}


function initLocationSelection(id) {
    new lc_select(`#${id}`, {
        wrap_width: '100%',
        enable_search: true,
        min_for_search: 0,
        autofocus_search: true,
        labels: ['הקלידו את שם הלשכה', '', '', 'לא נמצאה תוצאה'],
        addit_classes: ['lcslt-rtl'],
        on_change: (selections) => {
            if (!selections.length) {
                $('#acceptLocationsButton').addClass('disabled');
            } else {
                $('#acceptLocationsButton').removeClass('disabled');
            }
            serviceIdSelection = selections.map(id => Number(id));
        },
    });
}

function initMonthSelection(id) {
    new lc_select(`#${id}`, {
        wrap_width: '100%',
        enable_search: false,
        autofocus_search: true,
        addit_classes: ['lcslt-rtl'],
        on_change: (selections) => {
            if (!selections.length) {
                $('#acceptMonthsButton').addClass('disabled');
            } else {
                $('#acceptMonthsButton').removeClass('disabled');
            }
            monthSelection = selections;
        },
    });
}

function initTimeSelection(id) {
    new lc_select(`#${id}`, {
        wrap_width: '100%',
        enable_search: false,
        autofocus_search: true,
        addit_classes: ['lcslt-rtl'],
        on_change: (selections) => {
            timeSelection = selections;
        },
    });
}

function isValidId(id) {
	id = String(id).trim();
	if (id.length > 9 || isNaN(id)) return false;
	id = id.length < 9 ? ("00000000" + id).slice(-9) : id;
		return Array.from(id, Number).reduce((counter, digit, i) => {
			const step = digit * ((i % 2) + 1);
			return counter + (step > 9 ? step - 9 : step);
		}) % 10 === 0;
}

var uiIdCounter = 0;

function runStateMachine(newState) {
    if (curState === newState) {
        return;
    }

    curState = newState || curState;

    if (!windowWasOpened) {
        return;
    }

    switch(curState) {
        case STATE_INIT: {
            addChatMessage('טוען נתונים...', false, addDots);
            break;
        }
        case STATE_DISCLAIMER: {
            const onDisclaimerAccept = () => {
                disclaimerAccepted = true;
                if (hasAppointment) {
                    runStateMachine(STATE_USER_ALREADY_HAVE_AN_APPONTMENT);
                } else if (!isLoggedIn) {
                    runStateMachine(STATE_LOGGED_OUT);
                } else {
                    runStateMachine(STATE_LOAD_LAST_USER_DATA);
                }
            };

            if (disclaimerAccepted) {
                onDisclaimerAccept();
                break;
            }

            addChatMessage('לידיעתכם, השימוש בשרגא הוא בניגוד לתנאי השימוש של האתר ועל אחריותכם בלבד', true, addDots);
            addChatContent(`
                    <div class="shraga-chat-buttons-container">
                        <div class="shraga-primary-button shraga-chat-button" id="shragaAcceptDisclaimer">אני רוצה להמשיך</div>
                        <div class="shraga-primary-button shraga-chat-button" id="shragaDeclineDisclaimer">אני רוצה לצאת</div>
                    </div>    
                `,
                false,
                () => {
                    $('#shragaAcceptDisclaimer').click(() => {
                        onDisclaimerAccept();
                    });
                    $('#shragaDeclineDisclaimer').click(() => {
                        toolTipObject.close();
                    });
                }
            );
            break;
        }
        case STATE_LOGGED_OUT: {
            addChatMessage('אינכם מחוברים למערכת. יש להתחבר ורק אז אפשר יהיה להמשיך', true, addDots);
            addChatContent(`
                    <div class="shraga-chat-buttons-container">
                        <div class="shraga-primary-button shraga-chat-button" id="shragaLoginButton">התחבר למערכת</div>
                        <div class="shraga-primary-button shraga-chat-button" id="shragaInitButton">המשך אחרי חיבור למערכת</div>
                    </div>    
                `,
                false,
                () => {
                    $('#shragaLoginButton').click(() => {
                        window.open("https://myvisit.com/#!/home/signin/", "_blank");
                    });
                    $('#shragaInitButton').click(() => {
                        runStateMachine(STATE_INIT);
                        void init();
                    });
                }
            );
            break;
        }
        case STATE_INIT_FAILURE: {
            addChatMessage('ארעה שגיאה באתחול. יש לטעון מחדש את הדף', false);
            break;
        }
        case STATE_LOAD_LAST_USER_DATA: {
            chrome.storage.local.get([
                "last-user-id",
                "last-user-phone",
            ]
            ).then((result) => {
                if (!result || !result["last-user-id"] || !result["last-user-phone"]) {
                    runStateMachine(STATE_ID_INPUT);

                    return;
                }

                addChatMessage(
                    `
                    האם להשתמש בפרטים האישיים מהחיפוש הקודם?
                    <br>
                    <br>
                    מספר זהות: ${result["last-user-id"]}
                    <br>
                    טלפון: ${result["last-user-phone"]}
                    `,
                    false);
                addChatContent(`
                    <div class="shraga-chat-buttons-container">
                        <div class="shraga-primary-button shraga-chat-button" id="loadPersonalDataButton">כן</div>
                        <div class="shraga-primary-button shraga-chat-button" id="declinePersonalDataButton">לא</div>
                    </div>`,
                    false,
                    () => {
                        $('#loadPersonalDataButton').click(() => {
                            userId = result["last-user-id"];
                            userPhone = result["last-user-phone"];
                            runStateMachine(STATE_LOAD_LAST_SEARCH_DATA);
                        });
                        $('#declinePersonalDataButton').click(() => {
                            runStateMachine(STATE_ID_INPUT);
                        });
                    }
                );
            }).catch(_ => runStateMachine(STATE_ID_INPUT));
            break;
        }
        case STATE_LOAD_LAST_SEARCH_DATA: {
        
            chrome.storage.local.get([
                "last-service-type-selection",
                "last-service-id-selection",
                "last-month-selection",
                "last-time-selection",
            ]
            ).then((result) => {
                if (!result || !result["last-service-type-selection"] || !result["last-service-id-selection"] || !result["last-month-selection"] || !result["last-time-selection"]) {
                    runStateMachine(STATE_SERVICE_TYPE_INPUT);

                    return;
                }

                const locations = result["last-service-id-selection"].map(
                    lsid => allLocations.find(ll => ll.id === lsid).name
                ).join(",");

                const dates = result[["last-month-selection"]].map(ld => {
                    switch (ld) {
                        case "w1":
                            return "בשבוע הקרוב";
                        case "w2":
                            return "בשבועיים הקרובים";    
                        case "w3":
                            return "בשלושת השבועות הקרובים";
                        case "w4":
                            return "בחודש הקרוב";
                        default:
                            const parts = ld.split('-');
                            return parts[1]+'/'+parts[0];     
                    }
                }).join(",");

                var times;
                if (!result["last-time-selection"].length) {
                    times = 'בכל שעה';
                } else {
                    times = result["last-time-selection"].map(t => {
                        const parts = t.split('-');
                        const from = dateAdd(new Date(2023, 1, 1), 'minute', Number(parts[0]));
                        const to = dateAdd(new Date(2023, 1, 1), 'minute', Number(parts[1]));
                        return `${pad(from.getHours(),2)}:${pad(from.getMinutes(),2)}-${pad(to.getHours(),2)}:${pad(to.getMinutes(),2)}`
                    }).join(',');
                }

                addChatMessage(
                    `
                    האם להשתמש בפרטים של החיפוש הקודם?
                    <br>
                    <br>
                    שירות: ${result["last-service-type-selection"]}
                    <br>
                    לשכות: ${locations}
                    <br>
                    תאריכים: ${dates}
                    <br>
                    שעות: ${times}
                    `,
                    false);
                addChatContent(`
                    <div class="shraga-chat-buttons-container">
                        <div class="shraga-primary-button shraga-chat-button" id="loadSearchDataButton">כן</div>
                        <div class="shraga-primary-button shraga-chat-button" id="declineSearchDataButton">לא</div>
                    </div>`,
                    false,
                    () => {
                        $('#loadSearchDataButton').click(() => {
                            serviceIdSelection = result["last-service-id-selection"]; 
                            serviceTypeSelection = result["last-service-type-selection"];
                            timeSelection = result["last-time-selection"];
                            monthSelection = result["last-month-selection"];

                            runStateMachine(STATE_SEARCHING);
                        });
                        $('#declineSearchDataButton').click(() => {
                            runStateMachine(STATE_SERVICE_TYPE_INPUT);
                        });
                    }
                );
            }).catch(_ => runStateMachine(STATE_ID_INPUT));
            break;
        }
        case STATE_ID_INPUT: {
            addChatMessage('מה מספר תעודת הזהות שלכם?', true, showInput);
            break;
        }
        case STATE_ID_INPUT_VALIDATION: {
            if (isValidId(input)) {
                userId = input;
                runStateMachine(STATE_PHONE_INPUT);
            } else {
                addChatMessage('מספר זהות אינו תקין', true);
                runStateMachine(STATE_ID_INPUT);
            }
            break;
        }
        case STATE_PHONE_INPUT: {
            addChatMessage('מה מספר הטלפון שלכם? (מתחיל ב 05 ומורכב מספרות בלבד)', true);
            break;
        }
        case STATE_PHONE_INPUT_VALIDATION: {
            if (input.startsWith('05') && input.length >= 10 && isNaN(input) === false) {
                userPhone = input;
                hideInput();

                chrome.storage.local.set({
                    "last-user-id": userId,
                    "last-user-phone": userPhone,
                });

                runStateMachine(STATE_SERVICE_TYPE_INPUT);
            } else {
                addChatMessage('מספר הטלפון אינו תקין', true);
                runStateMachine(STATE_PHONE_INPUT);
            }
            break;
        }
        case STATE_SERVICE_TYPE_INPUT: {
            const id = `serviceSelect_${uiIdCounter++}`;
            addChatMessage('בואו נתחיל!', true);
            addChatContent(`
                <span id="w${id}">
                    <select id="${id}" name="multiple" data-placeholder="בחרו בשירות הרלוונטי">
                        <option value="הנפקת ת.ז. ביומטרית">הנפקת ת.ז. ביומטרית</option>
                        <option value="דרכון ביומטרי- ראשון">דרכון ביומטרי- ראשון</option>
                        <option value="דרכון ביומטרי- חידוש">דרכון ביומטרי- חידוש</option>
                        <option value="דרכון ביומטרי- אבדן/גניבה/השחתה">דרכון ביומטרי- אבדן/גניבה/השחתה</option>
                        <option value="שינוי מצב אישי (עם בחירת שם)">שינוי מצב אישי (עם בחירת שם)</option>
                        <option value="שינוי שם פרטי/משפחה">שינוי שם פרטי/משפחה</option>
                        <option value="הצהרה על תאריך לידה (יום וחודש)">הצהרה על תאריך לידה (יום וחודש)</option>
                    </select>
                </span>
            `, false, () => initServiceTypeSelection(id));

            addChatContent(`
                <div class="shraga-chat-buttons-container">
                    <div class="shraga-primary-button shraga-chat-button disabled" id="acceptServiceButton">המשך</div>
                </div>
                `,
                false,
                () => {
                    $('#acceptServiceButton').click(() => {
                        $('#acceptServiceButton').off('click');
                        document.querySelector(`#w${id}`).addEventListener('click', (e) => e.stopPropagation(), true);
                        runStateMachine(STATE_LOCATION_INPUT);
                    });
                }
            );

            break;
        }
        case STATE_LOCATION_INPUT: {
            const id = `locationSelect_${uiIdCounter++}`;
            
            addChatMessage('לאילו לשכות תרצו להגיע? ניתן לבחור יותר מלשכה אחת.', false);
            
            options = '';
            for (const loc of allLocations) {
                options += `<option value="${loc.id}">${loc.name}</option>`
            }
            addChatContent(`
                <span id="w${id}">
                    <select id="${id}" name="multiple" data-placeholder="בחרו בלשכות רלוונטיות" multiple>
                        ${options}
                    </select>
                </span>
                `,
                false,
                () => initLocationSelection(id),
            );

            addChatContent(`
                <div class="shraga-chat-buttons-container">
                    <div class="shraga-primary-button shraga-chat-button disabled" id="acceptLocationsButton">המשך</div>
                </div>
                `,
                false,
                () => {
                    $('#acceptLocationsButton').click(() => {
                        if (!serviceIdSelection.length) {
                            return;
                        }
                        $('#acceptLocationsButton').off('click');
                        document.querySelector(`#w${id}`).addEventListener('click', (e) => e.stopPropagation(), true);
                        
                        runStateMachine(STATE_MONTH_INPUT);
                    });
                }
            );
            break;
        }
        case STATE_MONTH_INPUT: {
            const id = `monthSelect_${uiIdCounter++}`;
            addChatMessage('באילו חודשים תרצו לקבוע את התור? ניתן לבחור יותר מאפשרות אחת.', false);
            
            options = `
                <option value="w1">בשבוע הקרוב</option>
                <option value="w2">בשבועיים הקרובים</option>
                <option value="w3">בשלושת השבועות הקרובים</option>
                <option value="w4">בחודש הקרוב</option>
            `;
            const baselineDate = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
            for (i = 0 ; i < 12 ; i++) {
                const date = dateAdd(baselineDate, 'month', i);
                const month = pad(date.getMonth() + 1, 2);
                const year = date.getFullYear();

                options += `<option value="${year}-${month}">${month}/${year}</option>`;
            }

            addChatContent(`
                <span id="w${id}">
                    <select id="${id}" name="multiple" data-placeholder="תאריכים רלוונטיים" multiple>
                        ${options}
                    </select>
                </span>
                `,
                false,
                () => initMonthSelection(id),
            );

            addChatContent(`
                <div class="shraga-chat-buttons-container">
                    <div class="shraga-primary-button shraga-chat-button disabled" id="acceptMonthsButton">המשך</div>
                </div>`,
                false,
                () => {
                    $('#acceptMonthsButton').click(() => {
                        if (!monthSelection.length) {
                            return;
                        }
                        $('#acceptMonthsButton').off('click');
                        document.querySelector(`#w${id}`).addEventListener('click', (e) => e.stopPropagation(), true);
                        runStateMachine(STATE_TIME_INPUT);
                    });
                }
            );
            break;
        }
        case STATE_TIME_INPUT: {
            const id = `timeSelect_${uiIdCounter++}`;
            addChatMessage('באילו שעות תרצו להגיע? עבור כל שעות היום אין צורך לבחור. ניתן לבחור יותר מטווח שעות אחד.', false);
            
            minutesFromMidnight = (hour) => {
                return hour * 60;
            }

            addChatContent(`
                    <span id="w${id}">
                        <select id="${id}" name="multiple" data-placeholder="בחרו בשעות הרלוונטיות" multiple>
                            <option value="${minutesFromMidnight(8)}-${minutesFromMidnight(10)}">08:00-10:00</option>
                            <option value="${minutesFromMidnight(10)}-${minutesFromMidnight(12)}">10:00-12:00</option>
                            <option value="${minutesFromMidnight(12)}-${minutesFromMidnight(14)}">12:00-14:00</option>
                            <option value="${minutesFromMidnight(14)}-${minutesFromMidnight(16)}">14:00-16:00</option>
                            <option value="${minutesFromMidnight(16)}-${minutesFromMidnight(18)}">16:00-18:00</option>
                            <option value="${minutesFromMidnight(18)}-${minutesFromMidnight(20)}">18:00-20:00</option>
                        </select>
                    </span>
                `,
                false,
                () => initTimeSelection(id),
            );
            addChatContent(`
                <div class="shraga-chat-buttons-container">
                    <div class="shraga-primary-button shraga-chat-button" id="acceptTimesButton">המשך</div>
                </div>`,
                false,
                () => {
                    $('#acceptTimesButton').click(() => {
                        $('#acceptTimesButton').off('click');
                        document.querySelector(`#w${id}`).addEventListener('click', (e) => e.stopPropagation(), true);
                        
                        chrome.storage.local.set({
                            "last-service-type-selection": serviceTypeSelection,
                            "last-service-id-selection": serviceIdSelection,
                            "last-month-selection": monthSelection,
                            "last-time-selection": timeSelection,
                        });

                        runStateMachine(STATE_SEARCHING);
                    });
                }
            );
            break;
        }
        case STATE_SEARCHING: {
            const successSoundId = `successSound${uiIdCounter++}`;
            const failureSoundId = `failureSound${uiIdCounter++}`
            addChatMessage('מתחיל לחפש', false);
            
            addChatMessage(`
                <div style="display: flex; flex-direction: row; flex-wrap: wrap">
                    כשהחיפוש יסתיים ישמע צליל של
                    <div class="shraga-clickable-chat-text" id="${successSoundId}">הצלחה</div>
                     או 
                    <div class="shraga-clickable-chat-text" id="${failureSoundId}">כישלון</div>
                     (לחצו כדי לשמוע)
                </div>
                `,
                false,
                () => {
                    $(`#${successSoundId}`).click(() => playSound('success.mp3'));
                    $(`#${failureSoundId}`).click(() => playSound('failure.mp3'));
                }
            );
            addDots();
            runSearch();
            break;
        }
        case STATE_SEARCH_FAILURE: {
            playSound('failure.mp3');
            addChatMessage('נגמר הזמן ולא הצלחתי למצוא תור פנוי. יש להתחבר אל המערכת שוב ולהמשיך את החיפוש', false);
            addChatContent(`
                    <div class="shraga-chat-buttons-container">
                        <div class="shraga-primary-button shraga-chat-button" id="shragaLoginButton">התחבר למערכת</div>
                        <div class="shraga-primary-button shraga-chat-button" id="shragaContinueSearchButton">המשיכו את החיפוש</div>
                        <div class="shraga-primary-button shraga-chat-button" id="shragaNewSearchButton">חיפש חדש</div>
                    </div>    
                `,
                false,
                () => {
                    $('#shragaLoginButton').click(() => {
                        window.open("https://myvisit.com/#!/home/signin/", "_blank");
                    });
                    $('#shragaContinueSearchButton').click(() => {
                        runStateMachine(STATE_SEARCHING);
                    });
                    $('#shragaNewSearchButton').click(() => {
                        runStateMachine(STATE_SERVICE_TYPE_INPUT);
                    });
                }
            );
            break;
        }
        case STATE_SEARCH_SUCCESS: {
            playSound('success.mp3');
            addChatMessage('קבעתי לך תור בהצלחה!', false);
            addChatMessage(
                `
                פרטי התור
                <br>
                <br>
                לשכה: ${appointment.name}
                <br>
                תאריך: ${appointment.date}
                <br>
                שעה: ${appointment.time}
                `,
                false);
            addChatMessage(`
                    <div class="shraga-chat-buttons-container" style="display: flex; flex-direction: row">
                        הצלחתי לעזור? אשמח אם תשקלו <div onclick="window.open('https://www.buymeacoffee.com/avishail', '_blank')" class="shraga-clickable-chat-text">לקנות לי קפה</div> :)
                    </div>
                `,
                false,
            );
            addChatContent(`
                    <div class="shraga-chat-buttons-container">
                        <div class="shraga-primary-button shraga-chat-button" id="shragaNewSearchButton">חיפוש חדש</div>'
                        <div class="shraga-primary-button shraga-chat-button" id="shragaBuyMeCoffee" onclick="window.open('https://www.buymeacoffee.com/avishail', '_blank')">קנו לי קפה</div>'
                    </div>
                `,
                false,
                () => {
                    $('#shragaGoToAppointment').click(() => {
                        window.open('https://myvisit.com/#!/home/provider/56', '_blank');
                    });
                    $('#shragaNewSearchButton').click(() => {
                        runStateMachine(STATE_LOAD_LAST_USER_DATA);
                    });
                }
            );
            break;
        }
        case STATE_SOMETHING_WENT_WRONG: {
            playSound('failure.mp3');
            addChatMessage('אופס... משהו השתבש', false);
            addChatMessage('נסו לרענן את הדף ולנסות שוב', false);
            break;
        }
        case STATE_ALREADY_HAVE_AN_APPONTMENT: {
            playSound('failure.mp3');
            addChatMessage('כבר קיים תור על תעודת הזהות שלכם', false);
            addChatMessage('אנא בטלו את התור ונסו שוב', false);
            break;
        }
        case STATE_USER_ALREADY_HAVE_AN_APPONTMENT: {
            addChatMessage('כבר קיים תור על תעודת הזהות שלכם', false);
            addChatMessage('אנא בטלו את התור ונסו שוב', false);
            addChatContent(`
                    <div class="shraga-chat-buttons-container">
                        <div class="shraga-primary-button shraga-chat-button" id="shragaMyAppointmentsButton">התורים שלי</div>'
                        <div class="shraga-primary-button shraga-chat-button" id="shragaTryAgain">נסו שוב</div>'
                    </div>
                `,
                false,
                () => {
                    $('#shragaMyAppointmentsButton').click(() => {
                        location.href = 'https://myvisit.com/#!/home/myvisits/';
                    });
                    $('#shragaTryAgain').click(() => {
                        void init();
                        runStateMachine(STATE_INIT);
                    });
                }
            );
            break;
        }
    }
}    

async function prepareVisit() {
    const res = await fetch(`https://${apiHost}/CentralAPI/Organization/56/PrepareVisit`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en",
            "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
            "application-name": "myVisit.com v3.5",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": "https://myvisit.com/",
        "referrerPolicy": "no-referrer-when-downgrade",
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
        },
    );

    const json = await res.json();
    return json
}

async function sendUserId(initialPrepare) {
    const preparedVisitToken = initialPrepare["Data"]["PreparedVisitToken"];
    const res = await fetch(`https://${apiHost}/CentralAPI/PreparedVisit/${preparedVisitToken}/Answer`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en",
            "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
            "application-name": "myVisit.com v3.5",
            "content-type": "application/json;charset=UTF-8",
            "sec-ch-ua": "\"Not_A Brand\";v=\"99\", \"Google Chrome\";v=\"109\", \"Chromium\";v=\"109\"",
            "sec-ch-ua-mobile": "?0",
            "sec-ch-ua-platform": "\"macOS\"",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": "https://myvisit.com/",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": JSON.stringify(
            {
               "PreparedVisitToken": preparedVisitToken,
               "QuestionnaireItemId": initialPrepare["Data"]["QuestionnaireItem"]["QuestionnaireItemId"],
               "QuestionId": initialPrepare["Data"]["QuestionnaireItem"]["QuestionId"],
               "AnswerIds": null,
               "AnswerText": userId,
            }
        ),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    });
    json = await res.json();
    return json;
}

async function sendUserPhone(userIdAnswer) {
    const res = await fetch(`https://${apiHost}/CentralAPI/PreparedVisit/${userIdAnswer["Data"]["PreparedVisitToken"]}/Answer`, {
        "headers": {
          "accept": "application/json, text/plain, */*",
          "accept-language": "en",
          "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
          "application-name": "myVisit.com v3.5",
          "content-type": "application/json;charset=UTF-8",
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site"
        },
        "referrer": "https://myvisit.com/",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": JSON.stringify({
            "PreparedVisitToken": userIdAnswer["Data"]["PreparedVisitToken"],
            "QuestionnaireItemId": userIdAnswer["Data"]["QuestionnaireItem"]["QuestionnaireItemId"],
            "QuestionId": userIdAnswer["Data"]["QuestionnaireItem"]["QuestionId"],
            "AnswerIds": null,
            "AnswerText": userPhone,
        }),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
    });

    const json = await res.json();
    return json;
}

async function prepareServiceVisit(serviceId, userPhoneAnswer) {
    const preparedvisittoken  = userPhoneAnswer["Data"]["PreparedVisitToken"];
    const res = await fetch(`https://${apiHost}/CentralAPI/Service/${serviceId}/PrepareVisit`, {
        "headers": {
          "accept": "application/json, text/plain, */*",
          "accept-language": "en",
          "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
          "application-name": "myVisit.com v3.5",
          "content-type": "application/json;charset=UTF-8",
          "preparedvisittoken": preparedvisittoken,
          "sec-fetch-dest": "empty",
          "sec-fetch-mode": "cors",
          "sec-fetch-site": "same-site"
        },
        "referrer": "https://myvisit.com/",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": JSON.stringify(preparedvisittoken),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
      });

    const json = await res.json();
    return json;  
}

async function sendServiceService(prepareServiceVisit) {
    const preparedVisitToken = prepareServiceVisit["Data"]["PreparedVisitToken"];

    const answers = prepareServiceVisit["Data"]["QuestionnaireItem"]["Question"]["Answers"];
    answer = answers.find(ans => ans["Text"] === serviceTypeSelection);
    if (!answer) {
        const randomIndex = Math.floor(Math.random() * answers.length);
        answer = answers[randomIndex];
    }

    const res = await fetch(`https://${apiHost}/CentralAPI/PreparedVisit/${preparedVisitToken}/Answer`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en",
            "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
            "application-name": "myVisit.com v3.5",
            "content-type": "application/json;charset=UTF-8",
            "preparedvisittoken": "36fc3dd3-3525-493a-9e88-b0eb3d7f760f",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": "https://myvisit.com/",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": JSON.stringify({
            "PreparedVisitToken": preparedVisitToken,
            "QuestionnaireItemId": prepareServiceVisit["Data"]["QuestionnaireItem"]["QuestionnaireItemId"],
            "QuestionId": prepareServiceVisit["Data"]["QuestionnaireItem"]["Question"]["QuestionId"],
            "AnswerIds": [answer["AnswerId"]],
            "AnswerText": null,
        }),
        "method": "POST",
        "mode": "cors",
        "credentials": "include"
        });
    const json = await res.json();
    return json;
}

function getTodayDate() {
    const d = Date.parse(new Date())
    const   date_obj = new Date(d)
    return `${date_obj.getFullYear()}-${date_obj.toLocaleString("default", { month: "2-digit" })}-${date_obj.toLocaleString("default", { day: "2-digit"})}`
}

async function checkIfUserHasAppontments() {
    const res = await fetch(`https://${apiHost}/CentralAPI/User/Visits/?$orderby=ReferenceDate%20desc&$filter=ReferenceDate%20ge%20${getTodayDate()}&position=`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en",
            "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
            "application-name": "myVisit.com v3.5",
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": "https://myvisit.com/",
        "referrerPolicy": "no-referrer-when-downgrade",
        "body": null,
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    });
    const json = await res.json();
    if (!json["Data"]) {
        return false;
    }

    for (appointment of json["Data"]) {
        if (appointment["CurrentEntityStatus"] === 0) {
            return true;
        }
    }

    return false;
}

async function setAnAppointment(serviceService, appDate, appTime) {
    const preparedVisitId = serviceService["Data"]["PreparedVisitId"];
    const serviceId = serviceService["Data"]["ServiceId"];
    const preparedVisitToken = serviceService["Data"]["PreparedVisitToken"];
    const res = await fetch(`https://${apiHost}/CentralAPI/AppointmentSet?ServiceId=${serviceId}&appointmentDate=${appDate}&appointmentTime=${appTime}&preparedVisitId=${preparedVisitId}&position=%7B%22lat%22:%2232.0837%22,%22lng%22:%2234.8282%22,%22accuracy%22:1440%7D`, {
        "headers": {
            "accept": "application/json, text/plain, */*",
            "accept-language": "en",
            "application-api-key": "8640a12d-52a7-4c2a-afe1-4411e00e3ac4",
            "application-name": "myVisit.com v3.5",
            "preparedvisittoken": preparedVisitToken,
            "sec-fetch-dest": "empty",
            "sec-fetch-mode": "cors",
            "sec-fetch-site": "same-site"
        },
        "referrer": "https://myvisit.com/",
        "referrerPolicy": "no-referrer-when-downgrade",
        "method": "GET",
        "mode": "cors",
        "credentials": "include"
    });

    if (res.status === 401) {
        throw new Error('http error');
    }

    if (!res.ok) {
        return false;
    }

    const json = await res.json();
    if (json["Success"]) {
        return STATE_SEARCH_SUCCESS;
    }

    if ((json["Messages"]?.[0] || '').includes('המערכת זיהתה תור קיים לתעודת הזהות שהקשת')) {
        return STATE_ALREADY_HAVE_AN_APPONTMENT;
    }

    return false;
}

async function onboardService(serviceId) {
    const initialPrepare = await prepareVisit();
    const userIdAnswer = await sendUserId(initialPrepare);
    const userPhoneAnswer = await sendUserPhone(userIdAnswer);
    const prepareService = await prepareServiceVisit(serviceId, userPhoneAnswer);
    const serviceService = await sendServiceService(prepareService);

    return serviceService;
}

async function onboardSelectedServices() {
    onBoardServices = []
    // one by one so the service won't block us
    for (serviceId of serviceIdSelection) {
        service = await onboardService(serviceId);
        onBoardServices.push(service);
    }
    return;
}

window.onload = () => {
    const container = document.createElement('div');
    container.id="shraga";
    container.classList.add("shraga");
    container.classList.add("main-button");
    container.innerHTML = `<img src=${chrome.runtime.getURL("img/icons/big-icon.png")} width="80%"/>`;
    document.body.appendChild(container);

    toolTipObject = new jBox('Modal', {
        attach: '#shraga',
        target: '#shraga',
        position: {
            x: 'right',
            y: 'top'
        },
        outside: 'y',
        pointer: true,
        offset: {
            x: -40
        },
        closeOnEsc: false,
        width: 450,
        height: 500,
        blockScroll: true,
        animation: 'zoomIn',
        closeButton: true,
        content: `
            <div class="shraga-container">
                <div class="shraga-chat-bottom-space"></div>
            </div>
        `,
        overlay: false,
        reposition: false,
        repositionOnOpen: false,
        onCreated: () => {
            $('.jBox-container').append(`
                <div class="shraga-user-input-container">
                    <input class="shraga-user-input" placeholder="Write something..."></input>
                    <img class="shraga-user-input-send" src=${chrome.runtime.getURL("img/icons/send.svg")} />
                </div>
            `);

            hideInput();

            $('.shraga-user-input-send').click(() => {
                const inputText = $('.shraga-user-input').val().trim();
                if (!inputText) {
                    return;
                }
                $('.shraga-user-input').val('');
                handleInput(inputText);
            })

            $('.shraga-user-input').keypress(function(event){
                const keycode = (event.keyCode ? event.keyCode : event.which);
                const inputText = $('.shraga-user-input').val().trim();
                if (keycode === 13 && inputText) {
                    event.preventDefault();
                    $('.shraga-user-input').val('');
                    handleInput(inputText);
                }
            });

            windowWasOpened = true;
            addChatMessage('אהלן! אני שרגא ואני אעזור לכם למצוא תור פנוי בהקדם', false);
            runStateMachine();
        },
    });

    if (location.hash.includes('help-me-shraga')) {
        toolTipObject.open();
    }
}

void init();
