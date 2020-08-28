import { Frame } from "./App";

export class DatabaseController
{
    static db : IDBDatabase | null = null;
    static initialized = false;

    static async init()
    {
        if(this.initialized) return;
        this.initialized = true;

        return new Promise<void>((resolve, reject) => 
        { 
            let initialData = [ { id: "abc" }, { id: "def" } ];

            const dbName = "imageDB";
            
            var request = indexedDB.open(dbName, 1);
    
            request.onerror = event =>
            {
                console.log("Database error");
                reject();
            };
    
            request.onsuccess = event =>
            {
                //@ts-ignore
                this.db = event.target.result;
    
                console.log("Database open");
                resolve();
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
                    let customerObjectStore = this.db!.transaction("framebank", "readwrite").objectStore("framebank");
                    initialData.forEach(element =>
                    {
                        customerObjectStore.add(element);
                        console.log("Initial data was added");
                    });

                    resolve();
                };
            };
        });
    }

    static add(id : string, data : Blob)
    {
        if(!this.initialized) throw new Error("DB not initialized");

        var transaction = this.db!.transaction(["framebank"], "readwrite");
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

        let newData = { id: id, data: data };
        
        var objectStore = transaction.objectStore("framebank");
        var request = objectStore.add(newData);
        request.onsuccess = event => 
        {
            // event.target.result === customer.ssn;
        };
    }

    static delete(id : string)
    {
        if(!this.initialized) throw new Error("DB not initialized");

        var request = this.db!.transaction(["framebank"], "readwrite").objectStore("framebank").delete(id);
        request.onsuccess = event => 
        {
            console.log("Data was deleted");
        };
    }

    static async get(id : string)
    {
        if(!this.initialized) throw new Error("DB not initialized");

        return new Promise<Blob>((resolve, reject) => 
        {
            this.db!.transaction("framebank").objectStore("framebank").get(id).onsuccess = event =>
            {
                //@ts-ignore
                let result = event.target.result;

                console.log(result);
                resolve(result);
            };
        });
    }
}

