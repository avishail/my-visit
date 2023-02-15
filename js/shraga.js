var locationSelection = [];
var timeSelection = [];

function locationSelectionNextClick() {
    $('#locationSelection').hide();
    $('#timeSelection').css('display', 'flex');
}

function timeSelectionPrevClick() {
    $('#timeSelection').hide();
    $('#locationSelection').css('display', 'flex');
}

function timeSelectionNextClick() {
    console.log(locationSelection);
    console.log(timeSelection);
}

jQuery(function () {
    new jBox('Modal', {
        attach: '#shraga',
        target: '#shraga',
        position: {
            x: 'right',
            y: 'top'
        },
        outside: 'y',
        pointer: true,
        offset: {
            x: -30
        },
        closeOnEsc: false,
        width: 450,
        height: 300,
        blockScroll: true,
        animation: 'zoomIn',
        closeButton: true,
        content: `
            <div class="shraga-container">
                <div style="display: none" id="loggedOutMessage">יש להתחבר אל המערכת על מנת שאוכל לקבוע לך תור</div>
                <div id="locationSelection" style="display: flex; flex-direction: column; width: 100%; height: 100%">
                    <div style="padding: 4px">לאן אני רוצה להגיע?</div>
                    <span style="direction: ltr;" class="location-select"></span>
                    <div style="padding: 4px">אפשר לבחור מספר מקומות. סדר הבחירה קובע את סדר החיפוש</div>
                    <div style="display: flex; flex: 1 1 auto; align-items: flex-end; justify-content: end">
                        <div style="display: none" id="locationSelectionNext" onclick="locationSelectionNextClick()">הבא</div>
                    </div>
                </div>
                <div id="timeSelection" style="display: none; flex-direction: column; width: 100%; height: 100%">
                    <div style="padding: 4px">באיזו שעה אני רוצה להגיע?</div>
                    <span style="direction: ltr;" class="time-select"></span>
                    <div style="padding: 4px">אם כל שעה נוחה, אין צורך לבחור בשעה</div>
                    <div style="padding: 4px">אפשר לבחור מספר שעות. סדר הבחירה קובע את סדר החיפוש</div>
                    <div style="display: flex; flex: 1 1 auto; align-items: flex-end; justify-content: end">
                        <div onclick="timeSelectionPrevClick()">הקודם</div>
                        <div style="flex-grow: 1"></div>
                        <div onclick="timeSelectionNextClick()">הבא</div>
                    </div>
                </div>
            </div>    
        `,
        title: '',
        overlay: false,
        reposition: false,
        repositionOnOpen: false,
        onCreated: () => {
            new SelectPure(".location-select", {
                options: [
                  {
                    label: "ראש העין",
                    value: "ba",
                  },
                  {
                    label: "פתח תקווה",
                    value: "bg",
                  },
                  {
                    label: "כפר סבא",
                    value: "bu",
                  },
                  {
                    label: "תל אביב",
                    value: "bus",
                  },
                ],
                multiple: true,
                autocomplete: true,
                icon: "select-pure__delete",
                onChange: value => { 
                    if (!value.length) {
                        $('#locationSelectionNext').hide();
                    } else {
                        $('#locationSelectionNext').show();
                    }
                    console.log(value);
                    locationSelection = value;
                },
              });

          new SelectPure(".time-select", {
            options: [
                {label: '08:00 - 10:00', value: '08:00-10:00'},
                {label: '10:00 - 12:00', value: '10:00-12:00'},
                {label: '12:00 - 14:00', value: '12:00-14:00'},
                {label: '14:00 - 16:00', value: '14:00-16:00'},
                {label: '16:00 - 18:00', value: '16:00-18:00'},
                {label: '18:00 - 20:00', value: '18:00-20:00'},
            ],
            multiple: true,
            icon: "select-pure__delete",
            onChange: value => { 
                timeSelection = value;
                console.log(value);
            },
          });  
        },
      });
});