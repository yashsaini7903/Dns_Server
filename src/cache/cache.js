class CacheNode{
    constructor(key, value, expiresAt){
        this.key = key;        
        this.value = value;
        this.expiresAt = expiresAt;

        this.prev = null;
        this.next = null;
    }
}

class DnsCache{
    constructor(maxSize = process.env.CACHE_MAX_SIZE || 1000){
        this.maxSize = maxSize;
        this.size = 0;
        this.cache = new Map();

         this.head = null; // Most Recently Used
        this.tail = null; // Least Recently Used

        this.expiryHeap = [];
         // Statistics
        this.hits = 0;
        this.misses = 0;
        console.log('Cache Instance created with size:', maxSize);
    }

    addToFront(node) {

        node.prev = null;
        node.next = this.head;

        if (this.head) {
            this.head.prev = node;
        }

        this.head = node;

        if (!this.tail) {
            this.tail = node;
        }
    }

    moveToFront(node) {

        if (node === this.head) {
            return;
        }

        // Remove from current position
        if (node.prev) {
            node.prev.next = node.next;
        }

        if (node.next) {
            node.next.prev = node.prev;
        }

        if (node === this.tail) {
            this.tail = node.prev;
        }

        // Put at front
        this.addToFront(node);
    }

    get(key){
        const node = this.cache.get(key);

        // Cache miss
        if (!node) {
            this.misses++;
            return null;
        }

        // Lazy expiration
        if (node.expiresAt <= Date.now()) {

            this.removeNode(node);

            this.misses++;

            return null;
        }

        // Cache hit
        this.hits++;

        // Update LRU
        this.moveToFront(node);

        return node.value;
    }

    set(key, value, ttl) {

        const expiresAt =
            Date.now() + ttl * 1000;

        // If key already exists
        const existingNode = this.cache.get(key);

        if (existingNode) {

            existingNode.value = value;
            existingNode.expiresAt = expiresAt;

            this.moveToFront(existingNode);

            this.heapPush({
                key,
                expiresAt
            });

            return;
        }
        // Create new node
        const node = new CacheNode(
            key,
            value,
            expiresAt
        );

        this.cache.set(key, node);

        // Add to LRU front
        this.addToFront(node);

        // Add to expiration heap
        this.heapPush({
            key,
            expiresAt
        });


        // Fixed-size eviction
        if (this.cache.size > this.maxSize) {

            this.removeLRU();
        }
    }

    delete(key) {

        const node = this.cache.get(key);

        if (!node) {
            return false;
        }

        this.removeNode(node);

        return true;
    }

     size() {

        return this.cache.size;
    }


    getStats() {

        return {
            size: this.cache.size,
            maxSize: this.maxSize,
            hits: this.hits,
            misses: this.misses
        };
    }

    removeLRU() {

        if (!this.tail) {
            return;
        }

        const node = this.tail;

        this.removeNode(node);
    }


    removeNode(node) {

        // Remove from Map
        this.cache.delete(node.key);

        // Remove from linked list
        if (node.prev) {
            node.prev.next = node.next;
        } else {
            this.head = node.next;
        }

        if (node.next) {
            node.next.prev = node.prev;
        } else {
            this.tail = node.prev;
        }

        node.prev = null;
        node.next = null;
    }

     heapPush(entry) {

        this.expiryHeap.push(entry);

        let index =
            this.expiryHeap.length - 1;

        while (index > 0) {

            const parent =
                Math.floor((index - 1) / 2);

            if (
                this.expiryHeap[parent].expiresAt
                <=
                this.expiryHeap[index].expiresAt
            ) {
                break;
            }

            [
                this.expiryHeap[parent],
                this.expiryHeap[index]
            ] = [
                this.expiryHeap[index],
                this.expiryHeap[parent]
            ];

            index = parent;
        }
    }

    heapPop() {

        if (this.expiryHeap.length === 0) {
            return null;
        }

        const root = this.expiryHeap[0];

        const last =
            this.expiryHeap.pop();

        if (this.expiryHeap.length > 0) {

            this.expiryHeap[0] = last;

            this.heapifyDown(0);
        }

        return root;
    }

     heapifyDown(index) {

        const size =
            this.expiryHeap.length;

        while (true) {

            let smallest = index;

            const left =
                2 * index + 1;

            const right =
                2 * index + 2;


            if (
                left < size &&
                this.expiryHeap[left].expiresAt
                <
                this.expiryHeap[smallest].expiresAt
            ) {
                smallest = left;
            }


            if (
                right < size &&
                this.expiryHeap[right].expiresAt
                <
                this.expiryHeap[smallest].expiresAt
            ) {
                smallest = right;
            }


            if (smallest === index) {
                break;
            }


            [
                this.expiryHeap[index],
                this.expiryHeap[smallest]
            ] = [
                this.expiryHeap[smallest],
                this.expiryHeap[index]
            ];

            index = smallest;
        }
    }

    cleanupExpired() {
        console.log("Running cache cleanup...");
        const now = Date.now();

        while (this.expiryHeap.length > 0) {

            const entry =
                this.expiryHeap[0];

            // Earliest entry hasn't expired
            if (entry.expiresAt > now) {
                break;
            }

            this.heapPop();

            const node =
                this.cache.get(entry.key);

            if (!node) {
                continue;
            }

            /*
             * Important:
             *
             * The heap may contain an old
             * expiration entry if the same
             * key was updated.
             */

            if (
                node.expiresAt ===
                entry.expiresAt
            ) {
                this.removeNode(node);
            }
            
        }
        console.log(`Expired cache entry removed. Current cache size: ${this.cache.size}`);
    }

}

module.exports = DnsCache;