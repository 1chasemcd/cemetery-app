// Open database
let Datastore = require("nedb");
const homedir = require("os").homedir();
db = new Datastore({filename: homedir + "/Cemetery Database/database.db", autoload: true});


// Variables to store database state
let dbState = {
  sortColIndex: 0
};
let sortColIndex = 0;
let sortDirection = -1;
let page = 0;
let search = "";

// Function to collect entries in correct order based on database state variables
function collectDocs() {

  // Store all entries filtered by search term
  let searchedDocs;

  if (search == "") {
    // If no search term is entered, then just gather all entries
    searchedDocs = db.find({});
  } else {
    sub = RegExp(search, "i");
    searchedDocs = db.find({$or: [{ date: sub }, 
                                  { name: sub }, 
                                  { contact: sub }, 
                                  { email: sub }, 
                                  { phone: sub }]
    });
  }

  // Sort previously collected entries based on the currently selected sorting criteria
  let sortedDocs;

  switch (sortColIndex) {
    case 0: // Sort by date
      sortedDocs = searchedDocs.sort({date: sortDirection});
      break;
  
    case 1: // Sort by deceased name
      sortedDocs = searchedDocs.sort({name: sortDirection});
      break;
  
    case 2: // Sort by contact name
      sortedDocs = searchedDocs.sort({contact: sortDirection});
      break;

    case 3: // Sort by contact email
      sortedDocs = searchedDocs.sort({email: sortDirection});
      break;

    case 4: // Sort by contact phone number (not sure why you'd want to do this, but I'll include it for consitency)
      sortedDocs = searchedDocs.sort({phone: sortDirection});
      break;
  }

  // Finalize gathering of documents. Only select 50 entries at a time for performance reasons
  sortedDocs.skip(50 * page).limit(50).exec(function(err, docs) {
    loadDocsInTable(docs);
  });
}

// Function to add html to data table based on json from database
function loadDocsInTable(docs) {
  // Remove old table entries
  document.querySelector("#data-table").removeChild(document.querySelector("tbody"));

  // Append html elements with correct data to empty string
  let htmlString = ""

  for (let doc of docs) {
    htmlString += "<tr>";
    
    for (let key in doc) {
      let value;

      if (key == "date") {
        value = doc[key].toLocaleDateString("en-US");

      } else {
        value = doc[key];
      }

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

// Functions to control state of add/edit entry window
function showAddWindow() {
  document.querySelector("#blur-content").style.filter = "blur(2px)";
  document.querySelector("#add-window").style.visibility = "visible";
}

function hideAddWindow() {
  document.querySelector("#blur-content").style.filter = "blur(0px)";
  document.querySelector("#add-window").style.visibility = "hidden";
}

// Function to manipulate table header html to display the correct sort icon with correct direction
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
  if (sortDirection == 1) {
    headings[sortColIndex].querySelectorAll("i")[1].classList.add("fa-sort-down");

  } else {
    headings[sortColIndex].querySelectorAll("i")[1].classList.add("fa-sort-up");
  }
}

/**
 * @todo clear input fields
 */

 // Function to add info in input fields into database 
function addEntry() {
  let inputs = document.querySelectorAll("#add-window input");

  let doc = { date: new Date(),
              name: inputs[1].value + ", " + inputs[0].value,
              contact: inputs[3].value + ", " + inputs[2].value,
              email: inputs[4].value,
              phone: inputs[5].value
            };

  db.insert(doc, function (err, newDoc) {   
    if (err) console.log(err)
  });

  collectDocs();
}

function editEntry() {
  let inputs = document.querySelectorAll("#add-window input");

  let doc = { date: new Date(),
              name: inputs[1].value + ", " + inputs[0].value,
              contact: inputs[3].value + ", " + inputs[2].value,
              email: inputs[4].value,
              phone: inputs[5].value
            };

  db.update({}, doc, {}, function (err) {   
    if (err) console.log(err)
  });

  collectDocs();
}

document.querySelector("#add-entry-button").addEventListener("click", showAddWindow);

document.querySelector("#close-add-button").addEventListener("click", hideAddWindow);

document.querySelector("#submit-add-button").addEventListener("click", function() {
  hideAddWindow();
  addEntry();
});

document.querySelector("#submit-edit-button").addEventListener("click", function() {
  hideAddWindow();
  editEntry();
});

document.querySelector("#search-bar").addEventListener("input", function() {
  search = document.querySelector("#search-bar").value;
  collectDocs();
});

let headings = document.querySelectorAll("thead tr th");

for (let i = 0; i < headings.length; i++) {
  headings[i].addEventListener("click", function(event) {
    for (element of event.path) {
      if (element.tagName == "TH") {
        if (sortColIndex == element.cellIndex) {
          sortDirection *= -1;
    
        } else {
          sortDirection = 1;
        }

        sortColIndex = element.cellIndex;
      }
    }
    updateSortIcon()
    collectDocs();
  })
}

collectDocs();