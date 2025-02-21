const express = require('express');
const cors = require("cors");
const taskQueue = require("./src/queue");
const {GET_MONITOR_DATA} = require("./src/monitor");

const app = express();
app.use(express.json());


const corsOptions = {
    origin: ["http://localhost:3000", "https://telex.im"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
}

app.use(cors(corsOptions));


app.post("/tick", (req, res) => {
    taskQueue.addTask(() => GET_MONITOR_DATA(req.body));
    return res.status(200).json({
        "status": "accepted"
    })
})

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`MongoDB Monitor running on port ${PORT}`);
});