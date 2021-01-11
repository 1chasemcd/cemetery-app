// To-do list:
// * Implement multiple pages so more than 50 docs can be displayed
// * Allow user to edit location of database
// * Add menu bar items
// * Add keyboard shortcuts
// * Add location/map functionality
// * Add any other requested user info

// --------------------------------------------------------------------------------------------
// Open database and define variables
// --------------------------------------------------------------------------------------------

// Open database
let Datastore = require("nedb");
const homedir = require("os").homedir();
db = new Datastore({filename: homedir + "/Cemetery Database/database.db", autoload: true});


// Variables to store database state
let dbState = {
    sortColIndex: 1,
    sortDirection: -1,
    page: 0,
    search: "",
    editingID: "",
    editingDate: ""
};

// --------------------------------------------------------------------------------------------
// Function to collect entries in correct order based on database state variables
// --------------------------------------------------------------------------------------------

function getEntries() {

    // Store all entries filtered by search term
    let searchedDocs;

    if (dbState.search == "") {
        // If no search term is entered, then just gather all entries
        searchedDocs = db.find({});
    } else {
        // Create a regular expression of search term
        searchSubstring = RegExp(dbState.search, "i");

        // Search for term in every input field
        searchedDocs = db.find({$or: [{ date: searchSubstring }, 
                                      { name: searchSubstring }, 
                                      { contact: searchSubstring },
                                      { address: searchSubstring }, 
                                      { email: searchSubstring }, 
                                      { phone: searchSubstring }]});
    }

    // Sort previously collected entries based on the currently selected sorting criteria
    let sortedDocs;

    switch (dbState.sortColIndex) {
        case 1: // Sort by date
            sortedDocs = searchedDocs.sort({date: dbState.sortDirection});
            break;
  
        case 2: // Sort by deceased name
            sortedDocs = searchedDocs.sort({name: dbState.sortDirection});
            break;
  
        case 3: // Sort by contact name
            sortedDocs = searchedDocs.sort({contact: dbState.sortDirection});
            break;
        
        case 4: // Sort by contact address
            sortedDocs = searchedDocs.sort({address: dbState.sortDirection});
            break;

        case 5: // Sort by contact email
            sortedDocs = searchedDocs.sort({email: dbState.sortDirection});
            break;

        case 6: // Sort by contact phone number (not sure why you'd want to do this, but I'll include it for consitency)
            sortedDocs = searchedDocs.sort({phone: dbState.sortDirection});
            break;
    }

    // Finalize gathering of documents. Only select 50 entries at a time for performance reasons
    sortedDocs.skip(50 * dbState.page).limit(50).exec(function(err, docs) {
        if (err) console.log(err);

        loadEntriesInTable(docs);
    });
}

// --------------------------------------------------------------------------------------------
// Function to add html to data table based on json from database
// --------------------------------------------------------------------------------------------

function loadEntriesInTable(docs) {
    // Remove old table entries
    document.querySelector("#data-table").removeChild(document.querySelector("tbody"));

    // Append html elements with correct data to empty string
    let htmlString = ""

    for (let doc of docs) {
        htmlString += "<tr>";

        // Add edit and map icon buttons to first column in each table row
        htmlString += `<td style="cursor: default">
                           <i class=\"fas fa-pen\" onclick=\"showEditWindow('${doc._id}')\"></i>
                           <i class=\"fas fa-map-marker-alt\"></i>
                       </td>`;
        
        for (let key in doc) {
            let value;

            // Date key must be converted to legible format
            if (key == "date") {
                value = doc[key].toLocaleDateString("en-US");

            } else {
                value = doc[key];
            }

            // Don't display randomly generated alpha-numeric id
            if (key != "_id") {
                htmlString += "<td>" + value + "</td>";
            }
        }

        htmlString += "</tr>";
    }

    // Create new table body node to add docs to
    let tbody = document.createElement("tbody");
    tbody.innerHTML = htmlString;

    document.querySelector("#data-table").appendChild(tbody);
}

// --------------------------------------------------------------------------------------------
// Functions to control visibility state of add/edit entry window
// --------------------------------------------------------------------------------------------

// Opening add window just requires making the window, headings, and buttons visible, 
// and bluring background
function showAddWindow() {
    document.querySelector("#add-title").style.display = "inherit";
    document.querySelector("#submit-add-button").style.display = "inherit";
    document.querySelector("#blur-content").style.filter = "blur(2px)";
    document.querySelector("#add-window").style.display = "inherit";
}

// Opening edit window also requires loading previous content into inputs and saving id in dbState
function showEditWindow(id) {
    searchedDocs = db.findOne({ _id: id }, function (err, doc) {
        if (err) console.log(err);

        dbState.editingID = doc._id;
        dbState.editingDate = doc.date;

        let inputs = document.querySelectorAll("#add-window input");

        [inputs[1].value, inputs[0].value] = doc.name.split(", ");
        [inputs[3].value, inputs[2].value] = doc.contact.split(", ");
        inputs[4].value = doc.address;
        inputs[5].value = doc.email;
        inputs[6].value = doc.phone;

        document.querySelector("#edit-title").style.display = "inherit";
        document.querySelector("#submit-edit-button").style.display = "inherit";

        document.querySelector("#blur-content").style.filter = "blur(2px)";
        document.querySelector("#add-window").style.display = "inherit";
    });
}

// Hide window and clear inputs
function hideAddWindow() {
    document.querySelector("#blur-content").style.filter = "blur(0px)";
    document.querySelector("#add-window").style.display = "none";

    document.querySelector("#add-title").style.display = "none";
    document.querySelector("#submit-add-button").style.display = "none";
    document.querySelector("#edit-title").style.display = "none";
    document.querySelector("#submit-edit-button").style.display = "none";

    let inputs = document.querySelectorAll("#add-window input");

    for (input of inputs) {
        input.value = "";
    }
}

// --------------------------------------------------------------------------------------------
// Functions to change database content when entry created or edited
// --------------------------------------------------------------------------------------------

 // Function to add info in input fields into database 
function addEntry() {
    let inputs = document.querySelectorAll("#add-window input");

    // Fill json document with content user entered into inputs
    let doc = { date: new Date(),
                name: inputs[1].value + ", " + inputs[0].value,
                contact: inputs[3].value + ", " + inputs[2].value,
                address: inputs[4].value,
                email: inputs[5].value,
                phone: inputs[6].value };

    // Put document into database
    db.insert(doc, function (err, newDoc) {   
        if (err) console.log(err);
    });

    // Update html table
    getEntries();
}

function editEntry() {
    let inputs = document.querySelectorAll("#add-window input");

    // Fill json document with content user entered into inputs
    let doc = { date: dbState.editingDate,
                name: inputs[1].value + ", " + inputs[0].value,
                contact: inputs[3].value + ", " + inputs[2].value,
                address: inputs[4].value,
                email: inputs[5].value,
                phone: inputs[6].value };
    

    // Update document associated with previously stored id
    db.update({_id: dbState.editingID}, doc, {}, function (err) {   
        if (err) console.log(err);
    });

    // Update html table
    getEntries();
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
// Add event listeners
// --------------------------------------------------------------------------------------------

// Event listeners to open/close add/edit window
document.querySelector("#add-entry-button").addEventListener("click", function() {
    showAddWindow();
});

document.querySelector("#close-add-button").addEventListener("click", function() {
    hideAddWindow();
});

document.querySelector("#submit-add-button").addEventListener("click", function() {
    addEntry();
    hideAddWindow();
});

document.querySelector("#submit-edit-button").addEventListener("click", function() {
    editEntry();
    hideAddWindow();
});

// Event lister to make real-time updates to table based on search bar filter
document.querySelector("#search-bar").addEventListener("input", function() {
    dbState.search = document.querySelector("#search-bar").value;
    getEntries();
});

// Add event listener to set sort criteria based on which heading is clicked
let headings = document.querySelectorAll("thead tr th");

// Loop through all headings
for (let i = 1; i < headings.length; i++) {
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
        getEntries();
    })
}

// Call getEntries to fill database
getEntries();