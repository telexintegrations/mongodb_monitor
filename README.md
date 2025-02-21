## This is a Telex integration application that monitors the health and speed of your mongo database authomatically through the Telex channel app.

## How To test:

# INSTALLATION
Clone the repo into your system
Follow the steps below to run the server:
```bash
1. npm install
2. npm run dev
```

Run a GET request using the format below:

*You can either use https://mongodb-monitor.onrender.com/tick OR http://localhost:3000/tick*

# You can also use this dummy mongo database for testing purpose: 
```bash
mongodb+srv://nkirevictor77:TuAzCAaUDmdp19df@cluster01.tyjeg.mongodb.net/?retryWrites=true&w=majority&appName=Cluster01
```
```bash
curl --location 'http://localhost:3000/tick' \
--header 'Content-Type: application/json' \
--data '{
    "channel_id": "<your-test-telex-channel-id>",
    "return_url": "https://ping.telex.im/v1/return/<your-test-telex-channel-id>",
    "settings": [
        {
            "label": "site-1",
            "type": "text",
            "required": true,
            "default": "", //input your mongo database connect url as default. 
        },
        {
            "label": "interval",
            "type": "text",
            "required": true,
            "default": "* * * * *"
        }
    ]
}'
```

This will send your performance data to your telex channel.

## Testing using the Telex Platform:
1. Navigate to the app section of your telex account

2. Click on "Add New" button at the top left side.

3. Input this integration json link: https://integration-json.onrender.com/integration.json

4. This will automatically add the Mongo Performance Monitor to your Telex account.

5. Activate the Integration and Click Manage App button

6. Navigate to the Settings section

7. Input your preferred interval

8. Input your mongo db url
*SAVE SETTING AND YOU ARE GOOD TO GO!!!*
