class RequestSet {
    private requests: Map<string, number>;
    private expiryTime: number;
    private static instance: RequestSet;
    constructor() {
      this.requests = new Map(); // Use Map for efficient key-value storage
      this.expiryTime = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    }
    static getInstance() {
        if (!RequestSet.instance) {
            RequestSet.instance = new RequestSet();
        }
        return this.instance;
    }
    // Add a user request with the current timestamp
    Check(userName: string): boolean {
      const now = Date.now();
      
      // Initialize if the user has no previous requests
        if (!this.requests.has(userName)) {
            this.requests.set(userName, now + this.expiryTime);
            return true; // allowing request for first time....
        }
      
        const timeCheck: number = this.requests.get(userName) || 0;
        if(timeCheck < now){
            // re add and send true
            this.requests.set(userName, now + this.expiryTime);
            return true; 
        }
        return false;
    }
    // Clear all requests (optional)
    clear(userName: string):boolean {
        if(userName == "p_soni2022" || userName == "Oxarman76"){
            this.requests.clear();
            return true;
        }
        return false;
    }

    print():string{
        return JSON.stringify(Array.from(this.requests.entries()));
    }
}
export default RequestSet.getInstance(); // Export the singleton instance