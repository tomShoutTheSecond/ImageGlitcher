import { Frame } from "./App";

export class DatabaseController
{
    static instance = new DatabaseController();
    db : IDBDatabase = new IDBDatabase();

    constructor()
    {
        let initialData = [ { id: "abc" }, { id: "def" } ];

        const dbName = "imageDB";
        
        var request = indexedDB.open(dbName, 0);

        request.onerror = event =>
        {
            console.log("Database error");
        };

        request.onupgradeneeded = event =>
        {
            //@ts-ignore
            this.db = event.target.result as IDBDatabase;

            // Create an objectStore to hold information about our customers. We're
            // going to use "ssn" as our key path because it's guaranteed to be
            // unique - or at least that's what I was told during the kickoff meeting.
            let objectStore = this.db.createObjectStore("framebank", { keyPath: "id" });
            /*
            // Create an index to search customers by name. We may have duplicates
            // so we can't use a unique index.
            objectStore.createIndex("name", "name", { unique: false });

            // Create an index to search customers by email. We want to ensure that
            // no two customers have the same email, so use a unique index.
            objectStore.createIndex("email", "email", { unique: true });
            */
            // Use transaction oncomplete to make sure the objectStore creation is 
            // finished before adding data into it.
            objectStore.transaction.oncomplete = event => 
            {
                // Store values in the newly created objectStore.
                let customerObjectStore =this. db.transaction("framebank", "readwrite").objectStore("framebank");
                initialData.forEach(element =>
                {
                    customerObjectStore.add(element);
                    console.log("Initial data was added");
                });
            };
        };
    }

    add(newFrame : Frame)
    {
        var transaction = this.db.transaction(["customers"], "readwrite");
        // Note: Older experimental implementations use the deprecated constant IDBTransaction.READ_WRITE instead of "readwrite".
        // In case you want to support such an implementation, you can write: 
        // var transaction = db.transaction(["customers"], IDBTransaction.READ_WRITE);

        // Do something when all the data is added to the database.
        transaction.oncomplete = event => 
        {
            console.log("Data was added");
        };
        
        transaction.onerror = event => 
        {
            // Don't forget to handle errors!
        };
        
        var objectStore = transaction.objectStore("customers");
        var request = objectStore.add(newFrame);
        request.onsuccess = event => 
        {
            // event.target.result === customer.ssn;
        };
    }

    delete()
    {
        var request = this.db.transaction(["customers"], "readwrite").objectStore("customers").delete("444-44-4444");
        request.onsuccess = (event : any) => 
        {
            console.log("Data was deleted");
        };
    }

    async get()
    {
        return new Promise<string>((resolve, reject) => 
        {
            this.db.transaction("customers").objectStore("customers").get("444-44-4444").onsuccess = event =>
            {
                //@ts-ignore
                let result = event.target.result.name as string;

                console.log("Name for SSN 444-44-4444 is " + result);

                resolve(result);
            };
        });
    }
}

