// To-do list:
// * Allow user to edit location of database
// * Add menu bar items
// * Add keyboard shortcuts
// * Add any other requested user info

// --------------------------------------------------------------------------------------------
// Open database and define variables
// --------------------------------------------------------------------------------------------

// Open database
let Datastore = require("nedb");
const homedir = require("os").homedir();
let db = new Datastore({filename: homedir + "/Cemetery Database/database.db", autoload: true});

// Variables to store database state
let dbState = {
    sortColIndex: 0,
    sortDirection: -1,
    search: "",
    editingID: "",
    editingDate: ""
};

// Entry attributes that shouldn't get placed in table
const NO_DISPLAY_KEYS = ["_id", "position", "notes"]

// --------------------------------------------------------------------------------------------
// Function to gather docs for table and map
// --------------------------------------------------------------------------------------------

function getFilteredDocs() {
    // Store all docs filtered by search term
    let filteredDocs;

    if (dbState.search == "") {
        // If no search term is entered, then just gather all docs
        filteredDocs = db.find({});
    } else {
        // Create a regular expression of search term
        searchSubstring = RegExp(dbState.search, "i");

        // Search for term in every input field
        filteredDocs = db.find({$or: [{ date: searchSubstring }, 
                                         { name: searchSubstring }, 
                                         { contact: searchSubstring },
                                         { address: searchSubstring }, 
                                         { email: searchSubstring }, 
                                         { phone: searchSubstring }]
                                        });
    }

    return filteredDocs;
}

function getSortedDocs(filteredDocs) {
    // Sort previously collected docs based on the currently selected sorting criteria
    let sortedDocs;

    switch (dbState.sortColIndex) {
        case 0: // Sort by date
            sortedDocs = filteredDocs.sort({date: dbState.sortDirection});
            break;
  
        case 1: // Sort by deceased name
            sortedDocs = filteredDocs.sort({name: dbState.sortDirection});
            break;
  
        case 2: // Sort by contact name
            sortedDocs = filteredDocs.sort({contact: dbState.sortDirection});
            break;
        
        case 3: // Sort by contact address
            sortedDocs = filteredDocs.sort({address: dbState.sortDirection});
            break;

        case 4: // Sort by contact email
            sortedDocs = filteredDocs.sort({email: dbState.sortDirection});
            break;

        case 5: // Sort by contact phone number (not sure why you'd want to do this, but I'll include it for consitency)
            sortedDocs = filteredDocs.sort({phone: dbState.sortDirection});
            break;
    }

    return sortedDocs;
}

function generateHTMLFromDocs(docs) {
    // Append html elements with correct data to empty string
    let htmlString = ""

    for (let doc of docs) {
        htmlString += `<tr onclick="showEditPage('${doc._id}')">`;
        
        for (let key in doc) {
            let value;

            // Date key must be converted to legible format
            if (key == "date") {
                value = doc[key].toLocaleDateString("en-US");

            } else {
                value = doc[key];
            }

            // Don't display randomly generated alpha-numeric id
            if (!NO_DISPLAY_KEYS.includes(key)) {
                htmlString += "<td>" + value + "</td>";
            }
        }

        htmlString += "</tr>";
    }

    return htmlString;
}

function loadDocsInTable() {
    let filteredDocs = getFilteredDocs();
    let sortedDocs = getSortedDocs(filteredDocs);

    sortedDocs.exec(function(err, docs) {
        if (err) console.log(err);

        let htmlString = generateHTMLFromDocs(docs);

        // Remove old table entries
        document.querySelector("#data-table").removeChild(document.querySelector("tbody"));

        // Create new table body node to add docs to
        let tbody = document.createElement("tbody");
        tbody.innerHTML = htmlString;
        document.querySelector("#data-table").appendChild(tbody);
});
}

function loadDocsInMap(map) {
    let filteredDocs = getFilteredDocs();

    filteredDocs.exec(function(err, docs) {
        if (err) console.log(err);
        map.setDocs(docs);
    });
}


// Opening edit window also requires loading previous content into inputs and saving id in dbState
function loadDocOnAddPage(id) {
    searchedDocs = db.findOne({ _id: id }, function (err, doc) {
        if (err) console.log(err);

        dbState.editingID = doc._id;
        dbState.editingDate = doc.date;

        let inputs = document.querySelectorAll("#add-page input");
        let textArea = document.querySelectorAll("#add-page textarea");

        [inputs[1].value, inputs[0].value] = doc.name.split(", ");
        [inputs[3].value, inputs[2].value] = doc.contact.split(", ");
        inputs[4].value = doc.address;
        inputs[5].value = doc.email;
        inputs[6].value = doc.phone;
        textArea.value = doc.notes;

        editMap.editingPosition.x = doc.position.x;
        editMap.editingPosition.y = doc.position.y;
    });
}

function emptyAddPage() {
    let inputs = document.querySelectorAll("#add-page input");

    inputs[0].value = "";
    inputs[1].value = "";
    inputs[2].value = "";
    inputs[3].value = "";
    inputs[4].value = "";
    inputs[5].value = "";
    inputs[6].value = "";
    document.querySelector("#add-page textarea").value = "";

    editMap.editingPosition = {};
}

// Function to format phone number inputs
function formatPhoneInput() {
    let inputNode = document.querySelector("#phone-input");
    let originalCursorPosition = inputNode.selectionStart;
    let originalValue = inputNode.value;

    let validChars = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    let unformattedNumber = "";

    for (let char of originalValue) {
        if (char in validChars) {
            unformattedNumber += char;
        }
    }

    if (unformattedNumber.length <= 3) {
        formattedNumber = unformattedNumber;

    } else if (unformattedNumber.length <= 6) {
        formattedNumber = unformattedNumber.substring(0, 3) + " " + unformattedNumber.substring(3); 

    } else {
        formattedNumber = unformattedNumber.substring(0, 3) + " " + unformattedNumber.substring(3, 6) + " " + unformattedNumber.substring(6, 10); 
    }

    let newCursorPosition = originalCursorPosition + (formattedNumber.length - originalValue.length);

    inputNode.value = formattedNumber;
    inputNode.setSelectionRange(newCursorPosition, newCursorPosition);
}





function addEntry() {
    let inputs = document.querySelectorAll("#add-page input");
    let textArea = document.querySelectorAll("#add-page textarea");

    // Fill json document with content user entered into inputs
    let doc = { date: new Date(),
                name: inputs[1].value + ", " + inputs[0].value,
                contact: inputs[3].value + ", " + inputs[2].value,
                address: inputs[4].value,
                email: inputs[5].value,
                phone: inputs[6].value,
                position: {x: editMap.editingPosition.x, y: editMap.editingPosition.y},
                notes: textArea.value };

    // Put document into database
    db.insert(doc, function (err, newDoc) {   
        if (err) console.log(err);
    });
}

function editEntry() {
    let inputs = document.querySelectorAll("#add-page input");
    let textArea = document.querySelectorAll("#add-page textarea");

    // Fill json document with content user entered into inputs
    let doc = { date: dbState.editingDate,
                name: inputs[1].value + ", " + inputs[0].value,
                contact: inputs[3].value + ", " + inputs[2].value,
                address: inputs[4].value,
                email: inputs[5].value,
                phone: inputs[6].value,
                position: {x: editMap.editingPosition.x, y: editMap.editingPosition.y},
                notes: textArea.value };
    

    // Update document associated with previously stored id
    db.update({_id: dbState.editingID}, doc, {}, function (err) {   
        if (err) console.log(err);
    });
}

function deleteEntry() {
    db.remove({ _id: dbState.editingID }, {}, function (err, numRemoved) {
        if (err) console.log(err);
    });
}

// --------------------------------------------------------------------------------------------
// Function to manipulate table header html to display the correct sort icon with correct direction
// --------------------------------------------------------------------------------------------

function updateSortIcon() {
    // Remove previous downward sort icon, if it exists
    if (document.querySelector("th i.fa-sort-down")) {
        document.querySelector("th i.fa-sort-down").classList.remove("fa-sort-down");
    }

    // Remove previous upward sort icon, if it exists
    if (document.querySelector("th i.fa-sort-up")) {
        document.querySelector("th i.fa-sort-up").classList.remove("fa-sort-up");
    }

    // Add sort icon with correct direction to new heading
    if (dbState.sortDirection == 1) {
        headings[dbState.sortColIndex].querySelectorAll("i")[1].classList.add("fa-sort-down");

    } else {
        headings[dbState.sortColIndex].querySelectorAll("i")[1].classList.add("fa-sort-up");
    }
}

// --------------------------------------------------------------------------------------------
// Functions to toggle between different pages
// --------------------------------------------------------------------------------------------

function showTablePage() {
    loadDocsInTable();

    document.querySelector("#table-page").style.display = "inherit";
    document.querySelector("#map-page").style.display = "none";
    document.querySelector("#add-page").style.display = "none";

    document.querySelector("#table-page-tab").style.backgroundColor = "#333";
    document.querySelector("#map-page-tab").style.backgroundColor = "#222";
    document.querySelector("#add-page-tab").style.backgroundColor = "#222";
    document.querySelector("#edit-page-tab").style.backgroundColor = "#222";
}

function showMapPage() {
    loadDocsInMap(mainMap);

    document.querySelector("#table-page").style.display = "none";
    document.querySelector("#map-page").style.display = "inherit";
    document.querySelector("#add-page").style.display = "none";

    document.querySelector("#table-page-tab").style.backgroundColor = "#222";
    document.querySelector("#map-page-tab").style.backgroundColor = "#333";
    document.querySelector("#add-page-tab").style.backgroundColor = "#222";
    document.querySelector("#edit-page-tab").style.backgroundColor = "#222";
}

function showAddPage() {
    emptyAddPage();
    document.querySelector("#search-bar").value = "";
    dbState.search = "";
    loadDocsInMap(editMap);

    document.querySelector("#add-title").style.display = "inherit";
    document.querySelector("#edit-title").style.display = "none";
    document.querySelector("#add-button-container").style.display = "flex";
    document.querySelector("#edit-button-container").style.display = "none";

    document.querySelector("#table-page").style.display = "none";
    document.querySelector("#map-page").style.display = "none";
    document.querySelector("#add-page").style.display = "inherit";

    document.querySelector("#table-page-tab").style.backgroundColor = "#fff0";
    document.querySelector("#map-page-tab").style.backgroundColor = "#fff0";
    document.querySelector("#add-page-tab").style.backgroundColor = "#333";
    document.querySelector("#edit-page-tab").style.backgroundColor = "#fff0";

    editMap.draw();
}

function showEditPage(id) {
    emptyAddPage();
    loadDocOnAddPage(id);   
    document.querySelector("#search-bar").value = "";
    dbState.search = "";
    loadDocsInMap(editMap);

    document.querySelector("#add-title").style.display = "none";
    document.querySelector("#edit-title").style.display = "inherit";
    document.querySelector("#add-button-container").style.display = "none";
    document.querySelector("#edit-button-container").style.display = "flex";

    document.querySelector("#table-page").style.display = "none";
    document.querySelector("#map-page").style.display = "none";
    document.querySelector("#add-page").style.display = "inherit";

    document.querySelector("#table-page-tab").style.backgroundColor = "#fff0";
    document.querySelector("#map-page-tab").style.backgroundColor = "#fff0";
    document.querySelector("#add-page-tab").style.backgroundColor = "#fff0";
    document.querySelector("#edit-page-tab").style.backgroundColor = "#333";

    editMap.draw();
}

// --------------------------------------------------------------------------------------------
// Add event listeners
// --------------------------------------------------------------------------------------------

const { ipcRenderer } = require('electron')

ipcRenderer.on('menu-action', (event, message) => {
    if (message == 'show-add-window') {
        showAddPage();
    }
});

document.querySelector("#table-page-tab").addEventListener("click", function() {
    showTablePage();
});

document.querySelector("#map-page-tab").addEventListener("click", function() {
    showMapPage();
});

document.querySelector("#add-page-tab").addEventListener("click", function() {
    showAddPage();
});

// Event lister to make real-time updates to table based on search bar filter
document.querySelector("#search-bar").addEventListener("input", function() {
    dbState.search = document.querySelector("#search-bar").value;
    loadDocsInTable();
    loadDocsInMap(mainMap);
    loadDocsInMap(editMap);
});

// Event lister to format phone number input when it is used
document.querySelector("#phone-input").addEventListener("input", function() {
    formatPhoneInput();
});

document.querySelector("#close-add-button").addEventListener("click", function() {
    showTablePage();
});

document.querySelector("#submit-add-button").addEventListener("click", function() {
    addEntry();
    showTablePage();
});

document.querySelector("#close-edit-button").addEventListener("click", function() {
    showTablePage();
});

document.querySelector("#delete-edit-button").addEventListener("click", function() {
    document.querySelector("#delete-window").style.display = "inherit";
});

document.querySelector("#submit-edit-button").addEventListener("click", function() {
    editEntry();
    showTablePage();
});

document.querySelector("#close-delete-button").addEventListener("click", function() {
    document.querySelector("#delete-window").style.display = "none";
});

document.querySelector("#submit-delete-button").addEventListener("click", function() {
    deleteEntry();
    document.querySelector("#delete-window").style.display = "none";
    showTablePage();
});


// Add event listener to set sort criteria based on which heading is clicked
let headings = document.querySelectorAll("thead tr th");

// Loop through all headings
for (let i = 0; i < headings.length; i++) {
    headings[i].addEventListener("click", function(event) {
        for (element of event.path) {
            // Find which th element was clicked
            if (element.tagName == "TH") {
                // Check if this heading was already selected
                if (dbState.sortColIndex == element.cellIndex) {
                    // If so, change the direction
                    dbState.sortDirection *= -1;
    
                } else {
                    // Otherwise, set direction to low to high
                    dbState.sortDirection = 1;
                }

                // Update dbState with new sort index
                dbState.sortColIndex = element.cellIndex;
            }
        }
        
        // Update the html icon to the newly update sort index and direction
        updateSortIcon()
        loadDocsInTable();
    })
}

// Set up main map
let mainMap = new ViewMap(document.querySelector("#main-map"), showEditPage);
let editMap = new EditMap(document.querySelector("#edit-map"));

showTablePage();