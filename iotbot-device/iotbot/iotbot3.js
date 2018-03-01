var awsIot = require('aws-iot-device-sdk');
var EasyGopigo3   = require('node-gopigo3').EasyGopigo3;
var readline = require('readline');

var rl = readline.createInterface({
  input : process.stdin,
  output: process.stdout
});

var robot = new EasyGopigo3();
//Add your certificates and region details in the file system
var device = awsIot.device({
   keyPath: "6ac720db5d-private.pem.key",
  certPath: "6ac720db5d-certificate.pem.crt",
    caPath: "root-CA.crt",
  clientId: "IoTbot",
    region: "us-west-2",
      host: "a3bhx5wqimiehh.iot.us-west-2.amazonaws.com"
});

//Initializing Shadow State
var requestedState = {
    "state": {
          "reported": {
            "stop": "true",
            "forward": "false",
            "left": "false",
            "right": "false",
            "back": "false",
          }
        }
}

//Connecting and subscribing to Shadow Topics
device
  .on('connect', function() {
    console.log('Connected to AWS IoT' );
    console.log(JSON.stringify(device));
    device.subscribe('$aws/things/IoTbot/shadow/#');
    device.subscribe('$aws/things/IoTbot/#');
    device.subscribe('localstatus');
    device.publish('localstatus', 'GoPiGo connected!');
    device.publish('$aws/things/IoTbot/shadow/update', JSON.stringify(requestedState));
    });

//Listening for updates
device
  .on('message', function(topic, payload) {
    console.log('message', topic, payload.toString(),'\n');
    //In case there's an IoT Remote app controlling and it sent a msg to 'localstatus', let it know GoPiGo is alive
    if (topic == "localstatus" && payload.toString() == "IoTbot Remote connected"){
      device.publish('localstatus', 'GoPiGo says hello to IoTbot Remote!');
    }
    if (topic == "$aws/things/IoTbot/shadow/update"){
      requestedState = JSON.parse(payload.toString());
      console.log('Waiting for command from the mothership <Endpoint>.iot.<region>.amazonaws.com\n')
      handleRequest(requestedState);
    }
  });

//Receiving commands
function handleRequest(requestedState){
  console.log ("Passing on Request to IoTbot: " + JSON.stringify(requestedState));
  if(requestedState.state.reported.stop == "true"){
    var res = robot.stop();
    console.log('::IoTbot Stopped::\n');
  };
  if(requestedState.state.reported.forward == "true"){
    var res = robot.forward();
    console.log('::IoTbot Moving forward::' + res+ '\n');
  };
  if(requestedState.state.reported.left == "true"){
    var res = robot.left();
    console.log('::IoTbot Turning left::' + res + '\n');
  };
  if(requestedState.state.reported.right == "true"){
    var res = robot.right();
    console.log('::IoTbot Turning right::' + res + '\n');
  };
  if(requestedState.state.reported.back == "true"){
    var res = robot.backward();
    console.log('::IoTbot Moving backward::' + res + '\n');
  };
}
