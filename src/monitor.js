const { MongoClient } = require('mongodb');
const axios = require('axios');
const { z } = require('zod');

const settingSchema = z.object({
    label: z.string(),
    type: z.string(),
    required: z.boolean(),
    default: z.string() //mongo db url
})

const PayloadSchema = z.object({
    channel_id: z.string(),
    return_url: z.string().url(),
    settings: z.array(settingSchema),
});

class Monitor {
    constructor(mongoUrl) {
        this.mongoUrl = mongoUrl;
        this.client = null;
    }
    
    //connection to mongdb
    async connect() {
        if (!this.client) {
            this.client = await MongoClient.connect(this.mongoUrl);
        }
        return this.client;
    }

    //fetch databases and colections for db
    async discoverDatabases() {
        try {
            const adminDb = this.client.db('admin');
            
            const dbs = await this.client.db().admin().listDatabases();
            
            const dbDetails = await Promise.all(
                dbs.databases
                    .filter(db => !['admin', 'local', 'config'].includes(db.name))
                    .map(async db => {
                        const collections = await this.client
                            .db(db.name)
                            .listCollections()
                            .toArray();
                        return {
                            name: db.name,
                            sizeOnDisk: db.sizeOnDisk,
                            collections: collections.map(c => ({
                                name: c.name,
                                type: c.type
                            }))
                        };
                    })
            );
            return dbDetails;
        } catch (error) {
            console.error('Database discovery error:', error);
            throw error;
        }
    }

    //measure and calculate db performance
    async measureQueryPerformance(dbName, collectionName, query = {}) {
        const db = this.client.db(dbName);
        const collection = db.collection(collectionName);
        
        const startTime = process.hrtime();
        
        try {
            const queryStats = await collection.find(query)
                .explain('executionStats');
            
            const [seconds, nanoseconds] = process.hrtime(startTime);
            const totalTime = seconds * 1000 + nanoseconds / 1000000;

            return {
                executionTimeMs: totalTime,
                documentsExamined: queryStats.executionStats.totalDocsExamined,
                documentsReturned: queryStats.executionStats.nReturned,
                indexesUsed: queryStats.queryPlanner.winningPlan.inputStage?.indexName || 'none'
            };
        } catch (error) {
            console.error(`Query performance measurement error for ${dbName}.${collectionName}:`, error);
            return {
                error: error.message,
                executionTimeMs: null
            };
        }
    }

    //assemble all performance data
    async collectPerformanceData(query = {}) {
        try {
            const databases = await this.discoverDatabases();
            
            const dbPerformance = await Promise.all(
                databases.map(async db => ({
                    database: db.name,
                    sizeOnDisk: db.sizeOnDisk,
                    collections: await Promise.all(
                        db.collections.map(async collection => ({
                            name: collection.name,
                            type: collection.type,
                            performance: await this.measureQueryPerformance(
                                db.name, 
                                collection.name, 
                                query
                            )
                        }))
                    )
                }))
            );

            return {
                timestamp: new Date().toISOString(),
                databaseMetrics: JSON.stringify(dbPerformance)
            };
        } catch (error) {
            console.error('Performance data collection error:', error);
            throw error;
        }
    }
}

//Get data and send it to telex through the telex return url
const GET_MONITOR_DATA = async (data) => {
    try {
        const payload = PayloadSchema.parse(data);

        const mongoUrlArray = payload.settings
        .filter((setting) => setting.label.startsWith("mongodb"))
        .map((setting) => setting.default);

        const performanceData = []
        
        for (const url of mongoUrlArray) {
            if (url === "") {
                continue;
            }
            
            const monitor = new Monitor(url);
            await monitor.connect();

            const get_performance = await monitor.collectPerformanceData({})
            
            performanceData.push(get_performance);
        }


        if (performanceData.length === 0) {
            await axios.post(payload.return_url, {
                message: "Error: You have not passed in any mongodb url. Please do so through the integration setting",
                username: "MongoDB Monitor",
                event_name: "Performance Monitor",
                status: "success",
            });

            console.log("missing pauload");
        } else {
            await axios.post(payload.return_url, {
                message: `performanceData: ${JSON.stringify(performanceData)}`,
                username: "MongoDB Monitor",
                event_name: "Performance Monitor",
                status: "success",
            });  
            console.log(performanceData);
        }

    } catch (error) {
        console.error('Monitoring error:', error);
    }
};




module.exports = {
    Monitor,
    GET_MONITOR_DATA
}

