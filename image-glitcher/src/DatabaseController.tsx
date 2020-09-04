export class DatabaseController
{
    static get objectStoreId() { return "transitionFrames" };

    static db : IDBDatabase | null = null;
    static initialized = false;

    static async init()
    {
        if(this.initialized) return;
        this.initialized = true;

        return new Promise<void>((resolve, reject) => 
        { 
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

                let objectStore = this.db.createObjectStore(this.objectStoreId, { keyPath: "id" });
                objectStore.transaction.oncomplete = event => 
                {
                    resolve();
                };
            };
        });
    }

    static add(id : string, data : Blob)
    {
        if(!this.initialized) throw new Error("DB not initialized");

        var transaction = this.db!.transaction([this.objectStoreId], "readwrite");
        transaction.oncomplete = event => 
        {
            console.log("Data was added");
        };
        
        transaction.onerror = event => 
        {
            console.log("Error adding data");
        };

        let newData = { id: id, data: data };
        
        var objectStore = transaction.objectStore(this.objectStoreId);
        var request = objectStore.add(newData);
        request.onsuccess = event => 
        {
            // event.target.result === customer.ssn;
        };
    }

    static delete(id : string)
    {
        if(!this.initialized) throw new Error("DB not initialized");

        var request = this.db!.transaction([this.objectStoreId], "readwrite").objectStore(this.objectStoreId).delete(id);
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
            let request = this.db!.transaction(this.objectStoreId).objectStore(this.objectStoreId).get(id);
            
            request.onsuccess = event =>
            {
                //@ts-ignore
                let result = event.target.result;

                console.log(result);
                resolve(result.data);
            };

            request.onerror = event =>
            {
                reject();
            };
        });
    }
}

