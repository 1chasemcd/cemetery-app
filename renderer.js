// Open database
let Datastore = require("nedb");
const homedir = require("os").homedir();
db = new Datastore({filename: homedir + "/Cemetery Database/database.db", autoload: true});


// Variables to store database state
let sortColIndex = 0;
let sortDirection = -1;
let page = 0;
let search = "";

// Function to collect data in correct order based on database state variables
function collectDocs() {

  let searchedDocs
  if (search == "") {
    searchedDocs = db.find({})
  } else {
    sub = RegExp(search, "i");
    searchedDocs = db.find({$or: [{ date: sub }, 
                                  { name: sub }, 
                                  { contact: sub }, 
                                  { email: sub }, 
                                  { phone: sub }]
    });
  }

  let sortedDocs;

  switch (sortColIndex) {
    case 0:
      sortedDocs = searchedDocs.sort({date: sortDirection});
      break;
  
    case 1:
      sortedDocs = searchedDocs.sort({name: sortDirection});
      break;
  
    case 2:
      sortedDocs = searchedDocs.sort({contact: sortDirection});
      break;

    case 3:
      sortedDocs = searchedDocs.sort({email: sortDirection});
      break;

    case 4:
      sortedDocs = searchedDocs.sort({phone: sortDirection});
      break;
  }

  sortedDocs.skip(50 * page).limit(50).exec(function(err, docs) {
    loadDocsInTable(docs);
  });
}

// Function to add html to data table based on json from database
function loadDocsInTable(docs) {
  // Remove old table entry
  document.querySelector("#data-table").removeChild(document.querySelector("tbody"));
  let htmlString = ""

  // Append html elements with correct data to empty string
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

function showAddWindow() {
  document.querySelector("#blur-content").style.filter = "blur(2px)";
  document.querySelector("#add-window").style.visibility = "visible";
}

function hideAddWindow() {
  document.querySelector("#blur-content").style.filter = "blur(0px)";
  document.querySelector("#add-window").style.visibility = "hidden";
}

function updateSortIcon() {
  if (document.querySelector("th i.fa-sort-down")) {
    document.querySelector("th i.fa-sort-down").classList.remove("fa-sort-down");
  }

  if (document.querySelector("th i.fa-sort-up")) {
    document.querySelector("th i.fa-sort-up").classList.remove("fa-sort-up");
  }

  if (sortDirection == 1) {
    headings[sortColIndex].querySelectorAll("i")[1].classList.add("fa-sort-down");

  } else {
    headings[sortColIndex].querySelectorAll("i")[1].classList.add("fa-sort-up");
  }
}

function addEntry() {
  let inputs = document.querySelectorAll("#add-window input");

  let doc = { date: new Date(),
              name: inputs[0].value,
              contact: inputs[1].value,
              email: inputs[2].value,
              phone: inputs[3].value
            };

  db.insert(doc, function (err, newDoc) {   
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