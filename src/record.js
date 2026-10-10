const DNSRecord = require("./models/DNSrecord");
const DnsCache = require("./cache/cache");
const Cache = new DnsCache(parseInt(process.env.CACHE_MAX_SIZE) || 1000); // Default max size is 1000 if not specified


const findRecord = async (name, type) => {

    const cacheKey = `${name}:${type}`;

    // 1. Check cache
    const cachedRecord = Cache.get(cacheKey);

    if (cachedRecord) {
        console.log(`Cache hit for ${cacheKey}`);
        return cachedRecord;
    }

    console.log(
        `Cache miss for ${cacheKey}. Querying database...`
    );

    // 2. Check MongoDB
    const record = await DNSRecord.findOne({
        name,
        type
    });

    if (record) {

        console.log(
            `Record found in database for ${cacheKey}:`,
            record
        );

        // 3. Put database record into cache
        Cache.set(
            cacheKey,
            record,
            record.ttl
        );

        return record;
    }

    // Nothing found
    return null;
};


const setInCache = (name, type, record) => {

    const cacheKey = `${name}:${type}`;

    Cache.set(
        cacheKey,
        record,
        record.ttl
    );

    console.log(
        `Record set in cache for ${cacheKey}`
    );
};

setInterval(()=>{
    console.log(`Cache Stats - Hits: ${Cache.hits}, Misses: ${Cache.misses}, Size: ${Cache.cache.size}`);
    Cache.cleanupExpired();
}, parseInt(process.env.CLEAN_UP_TIME) || 60000); // Log cache stats every 10 minutes


module.exports = {
    findRecord,
    setInCache
};