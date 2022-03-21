let db;
const request = indexedDB.open("budget_tracker", 1);

request.onupgradeneeded = function (event) {
  const db = event.target.result;
  // create an object store (table) called new_budget and give it an auto incrementing primary key
  db.createObjectStore("new_budget", { autoIncrement: true });
};

request.onsuccess = function (event) {
  // when db is successfully created with its object store or gains a connection, save reference to db in global variable
  db = event.target.result;

  // check if app is online, if yes run checkDatabase() function to send all local db data to api
  if (navigator.onLine) {
    uploadBudget();
  }
};

request.onerror = function (event) {
  console.log("Error: " + event.target.errorCode);
};

// if no internet then run this function with any budget changes/saves
function saveRecord(record) {
  // open a new transaction with the database with read and write permission
  const transaction = db.transaction(["new_budget"], "readwrite");

  // access the object store for new budget
  const store = transaction.objectStore("new_budget");

  // add method will store your record
  store.add(record);
}

function uploadBudget() {
  // open a transaction on db
  const transaction = db.transaction(["new_budget"], "readwrite");

  // access object store
  const store = transaction.objectStore("new_budget");

  // get all records from store and set to a variable
  const getAll = store.getAll();

  getAll.onsuccess = function () {
    if (getAll.result.length > 0) {
      fetch("/api/transaction/bulk", {
        method: "POST",
        body: JSON.stringify(getAll.result),
        headers: {
          Accept: "application/json, text/plain, */*",
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then(() => {
          // delete records if successful
          const transaction = db.transaction(["new_budget"], "readwrite");
          const store = transaction.objectStore("new_budget");
          store.clear();
        });
    }
  };
}
function deletePending() {
  const transaction = db.transaction(["new_budget"], "readwrite");
  const store = transaction.objectStore("new_budget");
  store.clear();
}

// listen for app coming back online
window.addEventListener("online", uploadBudget);
