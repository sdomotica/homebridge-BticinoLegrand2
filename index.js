/*
return 42; // Return statement not inside a/*
https://github.com/nfarina/homebridge-legacy-plugins/blob/master/platforms/HomeSeer.js used for reference.
*/

'use strict';

var async = require('async');
var request = require("request");
var net = require('net');
var events = require('events');
//var Service, Characteristic;
var Service, Characteristic, types, uuid, hapLegacyTypes;
var inherits = require('util').inherits;

module.exports = function(homebridge) {
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    types = homebridge.hapLegacyTypes;
    uuid = homebridge.hap.uuid;
    fixInheritance(MyHome2Platform.MonthConsumption, Characteristic);
    fixInheritance(MyHome2Platform.YearConsumption, Characteristic);
    fixInheritance(MyHome2Platform.CurrentConsumption, Characteristic);
    fixInheritance(MyHome2Platform.TodayConsumption, Characteristic);
    fixInheritance(MyHome2Platform.MeterDeviceService, Service);
    fixInheritance(MyHome2Platform.Zone1, Characteristic);
    fixInheritance(MyHome2Platform.Zone2, Characteristic);
    fixInheritance(MyHome2Platform.Zone3, Characteristic);
    fixInheritance(MyHome2Platform.Zone4, Characteristic);
    fixInheritance(MyHome2Platform.Zone5, Characteristic);
    fixInheritance(MyHome2Platform.Zone6, Characteristic);
    fixInheritance(MyHome2Platform.Zone7, Characteristic);
    fixInheritance(MyHome2Platform.Zone8, Characteristic); 
    fixInheritance(MyHome2Platform.TermoMode, Characteristic); 
    fixInheritance(MyHome2Platform.TermoNOW, Characteristic); 
    fixInheritance(MyHome2Platform.Forcing, Characteristic);
    fixInheritance(MyHome2Platform.Disabling, Characteristic);
    fixInheritance(MyHome2Platform.Protection, Characteristic);
    fixInheritance(MyHome2Platform.Threshold, Characteristic);
    fixInheritance(MyHome2Platform.F523, Service);
    fixInheritance(MyHome2Platform.F522Forcing, Characteristic);
    fixInheritance(MyHome2Platform.F522Disabling, Characteristic);
    fixInheritance(MyHome2Platform.F522Protection, Characteristic);
    fixInheritance(MyHome2Platform.F522Threshold, Characteristic);
    fixInheritance(MyHome2Platform.F522Now, Characteristic);
    fixInheritance(MyHome2Platform.F522, Service);
    fixInheritance(MyHome2Platform.CurrentTrack, Characteristic);
    fixInheritance(MyHome2Platform.ChangeTrack, Characteristic);
    fixInheritance(MyHome2Platform.Source1, Characteristic);    
    fixInheritance(MyHome2Platform.Source2, Characteristic);    
    fixInheritance(MyHome2Platform.Source3, Characteristic);    
    fixInheritance(MyHome2Platform.Source4, Characteristic);    
    
	homebridge.registerAccessory("homebridge-BticinoLegrand2", "MyHome2", MyHome2Accessory)
    homebridge.registerPlatform("homebridge-BticinoLegrand2", "MyHome2", MyHome2Platform);
}

// TCP connection to Bticino Legrand Module
var SdomoticaSocket = new net.Socket();
var eventEmitter = new events.EventEmitter();
var logga = "0"
// fromEventCheck
// Events from Bticino Legrand to Homebridge should NOT repeat back to Bticino Legrand after updating Homebridge (as Bticino Legrand already knows the status).
// Store the event name/value in a global array, stop the cmd from sending if match.
var eventCheckData = [];
function fromEventCheck(what) {
    var found = eventCheckData.indexOf(what);
    var originalFound = found;
    while (found !== -1) { // Remove all references
        eventCheckData.splice(found, 1);
        found = eventCheckData.indexOf(what);
    }
    if (originalFound==-1) { // No match
        return false;
    } else {
        return true;
    }
}

function espansione(where) {
		var where2 = where.toString();
		var where_long = where2.replace(/#/g, "%23"); 
        return where_long;
  
}

function cancelletto(where) {
		var where2 = where.toString();
		var where_long = where2.replace(/#/g, "%23"); 
        return where_long;
  
}

function httpRequest(url, method, callback) {
    request({
      url: url,
      method: method
    },
    function (error, response, body) {
      callback(error, response, body)
    })
}


function httpRequest2(url, method) {

       try {
    request({
      url: url,
      method: method
		})
	}
		catch (err) {
            console.log(err);
            }

}


var openGetStatus = []; // Sometimes a getStatus does not come back. We need to re-try for the app to be responsive.
function closeGetStatus(what) {
    var found = openGetStatus.indexOf(what);
    openGetStatus.splice(found, 1);

    console.log(openGetStatus);
}

// Resend unclosed GetStatus
function retryGetStatus() {
    async.each(openGetStatus, function (writeString, callback) {
        try {
            //SdomoticaSocket.write(writeString);
            console.log("RETRY: " + writeString);
        } catch (err) {
            console.log(err);
        }
        callback();
    }.bind(this), function (err) {
        //console.log("retryGetStatus complete");
    });
}
//setInterval(function() { retryGetStatus(); }, 2000);

var SOURCE1 = ""
var SOURCE2 = ""
var SOURCE3 = ""
var SOURCE4 = ""

function MyHome2Platform(log, config) {
    this.log = log;
    this.config = config;
    SOURCE1 = config["source1"] || "Source 1";
    SOURCE2 = config["source2"] || "Source 2";
    SOURCE3 = config["source3"] || "Source 3";
    SOURCE4 = config["source4"] || "Source 4";
}

MyHome2Platform.prototype = {
    accessories: function(callback) {
        var foundAccessories = [];

        // Build Device List
        this.log("Starting Bticino Legrand Config");

        SdomoticaSocket.connect(this.config["port"], this.config["host"], function() {
            this.log('Connected to Bticino Legrand Machine');
	       //SdomoticaSocket.write("*99*1##");
            // ERROR CONNECITON
        }.bind(this));

        SdomoticaSocket.on('end', function() {
            this.log('Connection interrotta');
        }.bind(this));
		
        SdomoticaSocket.on('error', function(err) {
            this.log('Connection interrotta per errore '+ err.message);
        }.bind(this));
		
		
		
        SdomoticaSocket.on('close', function() {
            this.log('Connection closed');
            // Handle error properly
            // Reconnect
            try {
              /*  SdomoticaSocket.connect(this.config["port"], this.config["host"], function() {
                    this.log('Re-Connected to Bticino Legrand Machine');
                }.bind(this));
			*/
            } catch (err) {
                this.log(err);
            }


        }.bind(this));

        // All Bticino Legrand replies goes via this connection
        SdomoticaSocket.on('data', function(data) {
            //this.log("Raw Bticino Legrand Data : " + data);
			
				
            // Data from Creston Module. This listener parses the information and updates Homebridge
            // get* - replies from get* requests
            // event* - sent upon any changes on Bticino Legrand side (including in response to set* commands)
            var dataArray = data.toString().split("$"); // Commands terminated with *
            async.each(dataArray, function(response, callback) {
			
                var responseArray = response.toString().split(":");
                // responseArray[0] = (config.type ie lightbulbs) : responseArray[1] = (id) : responseArray[2] = (command ie getPowerState) : responseArray[3] = (value)

                if (responseArray[3]!=""&& responseArray[3]!= undefined) {
					if (responseArray[0] === "Lightbulb") {
						eventEmitter.emit("Lightbulb:" + responseArray[1] + ":" + responseArray[2], responseArray[3]);	
						eventEmitter.emit("Outlets:" + responseArray[1] + ":" + responseArray[2], responseArray[3]);	
						eventEmitter.emit("Switch:" + responseArray[1] + ":" + responseArray[2], responseArray[3]);	
						eventEmitter.emit("Button:" + responseArray[1] + ":" + responseArray[2], responseArray[3]);	
						eventEmitter.emit("Sensor:" + responseArray[1] + ":" + responseArray[2], responseArray[3]);	
					}else {
						eventEmitter.emit(responseArray[0] + ":" + responseArray[1] + ":" + responseArray[2], responseArray[3]);	
					}
                    if (logga == "1"){
						this.log("EMIT: " + responseArray[0] + ":" + responseArray[1] + ":" + responseArray[2] + " = " + responseArray[3]);
					}
				}

                callback();

            }.bind(this), function(err) {
                //console.log("SockedRx Processed");
            });

        }.bind(this));

        // Accessories Configuration
        async.each(this.config.accessories, function(accessory, asynCallback) {

            var accessory = new MyHome2Accessory( this.log, this.config, accessory);
            foundAccessories.push(accessory);

            return asynCallback();  //let async know we are done
        }.bind(this), function(err) {

            if(err) {
                this.log(err);
            } else {
                this.log("Success MyHome Config");
                callback(foundAccessories);
            }
        }.bind(this));

    }
}

function fixInheritance(subclass, superclass) {
    var proto = subclass.prototype;
    inherits(subclass, superclass);
    subclass.prototype.parent = superclass.prototype;
    for (var mn in proto) {
        subclass.prototype[mn] = proto[mn];
    }
}


/* Define Custom Services & Characteristics */
// PowerMeter Characteristics
MyHome2Platform.YearConsumption = function() {
    var charUUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52'; //UUID.generate('eDomoticz:customchar:TotalConsumption');
	//var charUUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52';
    Characteristic.call(this, 'Year', charUUID);
	//Characteristic.call(this, 'Total Consumption', charUUID);
    this.setProps({
        //format: 'string',
        //perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'kWh'		
    });
    this.value = this.getDefaultValue();
};
MyHome2Platform.MonthConsumption = function() {
    var charUUID = uuid.generate('MyHome2:customchar:MonthConsumption');
	//console.log("CARATTERISTICA " + charUUID)
	//var charUUID = 'E863F10C-079E-48FF-8F27-9C2605A29F52';
    Characteristic.call(this, 'Month', charUUID);
	//Characteristic.call(this, 'Total Consumption', charUUID);
    this.setProps({
        //format: 'string',
        //perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'kWh'		
    });
    this.value = this.getDefaultValue();
};
MyHome2Platform.TodayConsumption = function() {
    var charUUID = uuid.generate('MyHome2:customchar:TodayConsumption');
    Characteristic.call(this, 'Today', charUUID);
    this.setProps({
        //format: 'string',
        //perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
		format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
		unit: 'kWh'
    });
    this.value = this.getDefaultValue();
};
MyHome2Platform.CurrentConsumption = function() {
    var charUUID = 'E863F10D-079E-48FF-8F27-9C2605A29F52';
    Characteristic.call(this, 'Consumption', charUUID);
    this.setProps({
        format: Characteristic.Formats.FLOAT,
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY],
        unit: 'W'
    })
    this.value = this.getDefaultValue();
};

// The PowerMeter itself
MyHome2Platform.MeterDeviceService = function(displayName, subtype) {
    var serviceUUID = uuid.generate('MyHome2:powermeter:customservice');
    Service.call(this, displayName, serviceUUID, subtype);
    this.addCharacteristic(new MyHome2Platform.CurrentConsumption);
    this.addOptionalCharacteristic(new MyHome2Platform.MonthConsumption);
    this.addOptionalCharacteristic(new MyHome2Platform.TodayConsumption);
	this.addOptionalCharacteristic(new MyHome2Platform.YearConsumption);
};



//F523
//Disabled:• 1 = Disabled • 0 = Enabled
MyHome2Platform.Disabling = function() {
    var charUUID = uuid.generate('MyHome2:customchar:Disabling');
    Characteristic.call(this, 'Disabled', charUUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ,Characteristic.Perms.NOTIFY]
    })
    this.value = this.getDefaultValue();
};

//Forcing: •1 = Forced •0 = Not Forced
MyHome2Platform.Forcing = function() {
    var charUUID = uuid.generate('MyHome2:customchar:Forcing');
    Characteristic.call(this, ' Forced', charUUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
    })
    this.value = this.getDefaultValue();
};

//Threshold: •1 = Below Threshold •0 = Above Threshold
MyHome2Platform.Threshold = function() {
    var charUUID = uuid.generate('MyHome2:customchar:Threshold');
    Characteristic.call(this, 'Threshold', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    })
    this.value = this.getDefaultValue();
};
	
	
//Protection: •1 = Protection •0 = Not Protection
MyHome2Platform.Protection = function() {
    var charUUID = uuid.generate('MyHome2:customchar:Protection');
    Characteristic.call(this, 'Protection', charUUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ,Characteristic.Perms.NOTIFY]
    })
    this.value = this.getDefaultValue();
};

// The F523 itself
MyHome2Platform.F523 = function(displayName, subtype) {
    var serviceUUID = uuid.generate('MyHome2:powermeter:F523');
    Service.call(this, displayName, serviceUUID, subtype);
    this.addCharacteristic(new MyHome2Platform.Forcing);
    this.addOptionalCharacteristic(new MyHome2Platform.Disabling);
    this.addOptionalCharacteristic(new MyHome2Platform.Protection);
    this.addOptionalCharacteristic(new MyHome2Platform.Threshold);
};



//F522
//Disabled:• 1 = Disabled • 0 = Enabled
MyHome2Platform.F522Disabling = function() {
    var charUUID = uuid.generate('MyHome2:customchar:F522Disabling');
    Characteristic.call(this, 'Disabled', charUUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ,Characteristic.Perms.NOTIFY]
    })
    this.value = this.getDefaultValue();
};

//Forcing: •1 = Forced •0 = Not Forced
MyHome2Platform.F522Forcing = function() {
    var charUUID = uuid.generate('MyHome2:customchar:F522Forcing');
    Characteristic.call(this, ' Forced', charUUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
    })
    this.value = this.getDefaultValue();
};

//Threshold: •1 = Below Threshold •0 = Above Threshold
MyHome2Platform.F522Threshold = function() {
    var charUUID = uuid.generate('MyHome2:customchar:F522Threshold');
    Characteristic.call(this, 'Threshold', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    })
    this.value = this.getDefaultValue();
};
	
//Consumo attuale
MyHome2Platform.F522Now = function() {
    var charUUID = uuid.generate('MyHome2:customchar:F522Now');
    Characteristic.call(this, 'Current', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    })
    this.value = this.getDefaultValue();
};
	
//Protection: •1 = Protection •0 = Not Protection
MyHome2Platform.F522Protection = function() {
    var charUUID = uuid.generate('MyHome2:customchar:F522Protection');
    Characteristic.call(this, 'Protection', charUUID);
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ,Characteristic.Perms.NOTIFY]
    })
    this.value = this.getDefaultValue();
};

// The F522 itself
MyHome2Platform.F522 = function(displayName, subtype) {
    var serviceUUID = uuid.generate('MyHome2:powermeter:F522');
    Service.call(this, displayName, serviceUUID, subtype);
    this.addCharacteristic(new MyHome2Platform.F522Forcing);
    this.addOptionalCharacteristic(new MyHome2Platform.F522Now);
    this.addOptionalCharacteristic(new MyHome2Platform.F522Disabling);
    this.addOptionalCharacteristic(new MyHome2Platform.F522Protection);
    this.addOptionalCharacteristic(new MyHome2Platform.F522Threshold);
};

//Zone antifurto
MyHome2Platform.Zone1 = function() {
    var charUUID = uuid.generate('MyHome:customchar:Zone1');
    Characteristic.call(this, 'Zone 1', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
};
MyHome2Platform.Zone2 = function() {
    var charUUID = uuid.generate('MyHome:customchar:Zone2');
    Characteristic.call(this, 'Zone 2', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
};
MyHome2Platform.Zone3 = function() {
    var charUUID = uuid.generate('MyHome:customchar:Zone3');
    Characteristic.call(this, 'Zone 3', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
};
MyHome2Platform.Zone4 = function() {
    var charUUID = uuid.generate('MyHome:customchar:Zone4');
    Characteristic.call(this, 'Zone 4', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
};
MyHome2Platform.Zone5 = function() {
    var charUUID = uuid.generate('MyHome:customchar:Zone5');
    Characteristic.call(this, 'Zone 5', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
};
MyHome2Platform.Zone6 = function() {
    var charUUID = uuid.generate('MyHome:customchar:Zone6');
    Characteristic.call(this, 'Zone 6', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
};
MyHome2Platform.Zone7 = function() {
    var charUUID = uuid.generate('MyHome:customchar:Zone7');
    Characteristic.call(this, 'Zone 7', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
};
MyHome2Platform.Zone8 = function() {
    var charUUID = uuid.generate('MyHome:customchar:Zone8');
    Characteristic.call(this, 'Zone 8', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
};


MyHome2Platform.TermoMode = function() {
    var charUUID = uuid.generate('MyHome:customchar:TermoMode');
    Characteristic.call(this, 'Mod', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
};

MyHome2Platform.TermoNOW = function() {
    var charUUID = uuid.generate('MyHome:customchar:TermoNOW');
    Characteristic.call(this, 'Now', charUUID);
    this.setProps({
        format: 'string',
        perms: [Characteristic.Perms.READ, Characteristic.Perms.WRITE, Characteristic.Perms.NOTIFY]
    });
    this.value = this.getDefaultValue();
};


//zona audio
MyHome2Platform.CurrentTrack = function() {
	Characteristic.call(this, "Current Station", '00000045-0000-1000-8000-656261617577');
    this.setProps({
      format: Characteristic.Formats.STRING,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY]
    });
	this.value = this.getDefaultValue();
};

MyHome2Platform.ChangeTrack = function() {
	Characteristic.call(this, "Change Station", '00000047-0000-1000-8000-656261617577');
    this.setProps({
      format: Characteristic.Formats.INT,
      minValue: -1,
      maxValue: 1,
      stepValue: 1,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY,
              Characteristic.Perms.WRITE]
    });
	this.value = this.getDefaultValue();
};

MyHome2Platform.Source1 = function() {
	Characteristic.call(this, SOURCE1 , '00000147-0000-1000-8000-656261617577');
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY,
      	      Characteristic.Perms.WRITE]
    });
	this.value = this.getDefaultValue();
};

MyHome2Platform.Source2 = function() {
	Characteristic.call(this, SOURCE2 , '00000247-0000-1000-8000-656261617577');
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY,
      	      Characteristic.Perms.WRITE]
    });
	this.value = this.getDefaultValue();
};

MyHome2Platform.Source3 = function() {
	Characteristic.call(this, SOURCE3 , '00000347-0000-1000-8000-656261617577');
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY,
      	      Characteristic.Perms.WRITE]
    });
	this.value = this.getDefaultValue();
};

MyHome2Platform.Source4 = function() {
	Characteristic.call(this, SOURCE4 , '00000447-0000-1000-8000-656261617577');
    this.setProps({
      format: Characteristic.Formats.BOOL,
      perms: [Characteristic.Perms.READ, Characteristic.Perms.NOTIFY,
      	      Characteristic.Perms.WRITE]
    });
	this.value = this.getDefaultValue();
};




function MyHome2Accessory(log, platformConfig, accessoryConfig) {
    this.log = log;
    this.config = accessoryConfig;
    this.id = accessoryConfig.address;
	this.ref = accessoryConfig.address;
    this.name = accessoryConfig.name
    this.model = "BTMyHome";
    this.access_url = platformConfig["url"];
    this.control_url = platformConfig["url"];
    this.status_url = platformConfig["url"];
    this.radio = platformConfig["radio"] || 1;
    this.frequence = "OFF";
    this.rds = "---"; 
    logga = platformConfig["log"]|| "0";

    this.time = accessoryConfig.time || 0;
    
    if (platformConfig["source1"])
        this.Source1 = platformConfig["source1"];
    if (platformConfig["source2"])
        this.Source2 = platformConfig["source2"];    
     if (platformConfig["source3"])
        this.Source3 = platformConfig["source3"];    
    if (platformConfig["source4"])
        this.Source4 = platformConfig["source4"];    

    if( this.config.audio )
        this.audio_home = this.config.audio;
    
    if( this.config.can_dim )
        this.can_dim = this.config.can_dim;

    if( this.config.uuid_base )
        this.uuid_base = this.config.uuid_base;

    if( this.config.onValue )
        this.onValue = this.config.onValue;

    if( this.config.offValue )
        this.offValue = this.config.offValue;

	
    if( this.config.STAY_ARM )
        this.STAY_ARM = this.config.STAY_ARM;
    if( this.config.AWAY_ARM )
        this.AWAY_ARM = this.config.AWAY_ARM;
    if( this.config.NIGHT_ARM )
        this.NIGHT_ARM = this.config.NIGHT_ARM;
    if( this.config.DISARMED )
        this.DISARMED = this.config.DISARMED;
    if( this.config.ZONA1 )
        this.ZONA1 = this.config.ZONA1;
    if( this.config.ZONA2 )
        this.ZONA2 = this.config.ZONA2;
    if( this.config.ZONA3 )
        this.ZONA3 = this.config.ZONA3;
    if( this.config.ZONA4 )
        this.ZONA4 = this.config.ZONA4;
    if( this.config.ZONA5 )
        this.ZONA5 = this.config.ZONA5;
    if( this.config.ZONA6 )
        this.ZONA6 = this.config.ZONA6;
    if( this.config.ZONA7 )
        this.ZONA7 = this.config.ZONA7;
    if( this.config.ZONA8 )
        this.ZONA8 = this.config.ZONA8;
	
	this.temperatureUnit == "C"
    if( this.config.temperatureUnit )
        this.temperatureUnit = this.config.temperatureUnit;
 
	if( this.config.frame )
        this.frame = this.config.frame;
}


var brightnessTimer;
function setBrightnessTimer(lightAccessory, level) {

				// *#2*<where>*#11#<shutterPriority>*<shutterLevel>##
					var frame = "*#2*" + lightAccessory.ref + "*#11#001*" + level + "##"
					var frame_x_url = frame.replace(/#/g, "%23"); 
					var url = lightAccessory.status_url + "/frame/" + frame_x_url; 

					httpRequest(url, 'GET', function(error, response, body) {
						if (error) {
							lightAccessory.log('Sdomotica Gateway get external function failed: %s', error.message);
							callback( error, 0 );
						}
						else {
							lightAccessory.log("Windows Advance command sent: " + frame)
						}
						})
}

var volumeTimer;
function setvolumeTimer(audioAccessory, ampli, volume) {
		volume =  Math.round(volume/100*31);
        var url = "http://127.0.0.1:3000/volume/" + ampli + "/" + volume

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                audioAccessory.log("setVolume() failed: %s", error.message);
            }
            else if (response.statusCode !== 200) {
                audioAccessory.log("setVolume() request returned http error: %s", response.statusCode);
            }
            else {
                audioAccessory.log("setVolume() successfully set volume to %s", volume);
            }
        });				
}

var StationTimer;
function setStationTimer(audioAccessory, url) {

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                audioAccessory.log("Set Station() failed: %s", error.message);
            }
            else if (response.statusCode !== 200) {
                audioAccessory.log("Set Station() request returned http error: %s", response.statusCode);
            }
            else {
                audioAccessory.log("Set Station() successfully set");
            }
        });	

		setTimeout(	function(){
						audioAccessory.speakerService.setCharacteristic(MyHome2Platform.ChangeTrack, 0);
						}, 100);        
}



MyHome2Accessory.prototype = {

    identify: function(callback) {
        callback();
    },
    //---------------
    // PowerState - Lightbulb, Switch, SingleSpeedFan (Scenes)
    //---------------
    getPowerState: function(callback) { // this.config.type = Lightbulb, Switch, etc
		var url = this.status_url + "/status/1/" + cancelletto(this.ref)

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get power for ' + this.id +': value=' + value );
                }
				if( value == 0 )
                    callback( null, 0 );
                else
                    callback( null, 1 );
            }
        }.bind(this));
 		
 
    },
	
	getSensorState: function(callback) { // this.config.type = Lightbulb, Switch, etc
		var url = this.status_url + "/status/1/" + cancelletto(this.ref)

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get power for ' + this.name +': value=' + value );
				}
				if( value == 0 )
                    callback( null, 1 );
                else
                    callback( null, 0 );
            }
        }.bind(this));
 		
 
    },

	
	
	
    setPowerState: function(value, callback ,context) {
		
		if (typeof context === 'undefined')
			{callback();}
		else{
				//Do NOT send cmd to Bticino Legrand when Homebridge was notified from an Event - Bticino Legrand already knows the state!
				if (fromEventCheck(this.config.type + ":" + this.id + ":eventPowerState:" + value)==false ) {
					
					if (value) {
						if (this.frame){
							httpRequest2(this.control_url + "/frame/" + cancelletto(this.frame) ,'GET'); // (* after value required on set)
						}else{
							httpRequest2(this.control_url + "/own/1/1/" + cancelletto(this.ref) ,'GET'); // (* after value required on set)		
						}
						
						this.log("SdomoticaSocket.write - " + this.config.type + ":" + this.id + ":setPowerState:1*");
					} else {
						httpRequest2(this.control_url + "/own/1/0/" + cancelletto(this.ref) ,'GET'); // (* after value required on set)
						this.log("SdomoticaSocket.write - " + this.config.type + ":" + this.id + ":setPowerState:0*");
					}
				}
				callback();
		}
    },
	getdimValue: function(callback) {

		var url = this.status_url + "/status/1/" + cancelletto(this.ref)

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get level for ' + this.ref +': value=' + value );
				}
				if( value == 0 )
                    callback( null, 0 );
                else
                    callback(null, Math.round(value*10));
            }
        }.bind(this));
    },	
	setdimValue: function(level, callback , context) {
	 if (typeof context === 'undefined'){
		 callback();
		}
			else{  
				var url
				url = this.control_url + "/own/1/" + Math.round(level/10) + "/" + cancelletto(this.ref);
				//this.log(url);
				httpRequest(url, 'GET', function(error, response, body) {
					if (error) {
						this.log('Sdomotica Gateway power function failed: %s', error.message);
						callback(error);
					}
					else {
						//this.log('Sdomotica Gateway power function succeeded!');
						callback();
					}
				}.bind(this));
		}
		
		
    },	
	

	
	
//ROTOLANTI		
	getCurrentPosition: function(callback) {
		var url = this.status_url + "/status/2/" + cancelletto(this.ref);

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get shutter function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway shutter status for ' + this.ref +': value=' + value );
                }
				if( value == "0" )
					this.position = 50
					this.run_tappa = 0
                if( value == "1" ){
					this.position = 100
					this.run_tappa = 1
					setTimeout(
							function(){
								this.WindowsService.getCharacteristic(Characteristic.CurrentPosition)
									.getValue(undefined);
								if (logga == "1"){	
									this.log("Request position for " + this.name + " address:" + this.ref)
								}
								}.bind(this), 1000);
					}
                if( value == "2" ){
					this.position = 0
					this.run_tappa = 1
					setTimeout(
							function(){
								this.WindowsService.getCharacteristic(Characteristic.CurrentPosition)
									.getValue(undefined);
								if (logga == "1"){
									this.log("Request position for " + this.name + " address:" + this.ref)
								}
								}.bind(this), 1000);
					}
				
				this.WindowsService.setCharacteristic(Characteristic.TargetPosition,this.position)
				callback( null, this.position );
	
				
            }
        }.bind(this));

		
	},
	setTargetPosition: function(value , callback , context) {
		//this.log("Setto positione target->" + this.position )
		//this.log("CONTEXT->" + context )
		//
		if (typeof context === 'undefined'){}
		else{
			if (this.run_tappa== 1){
				var frame = "*2*0*" + this.ref + "##"
			}else{
				if (value < 50){
					var frame = "*2*2*" + this.ref + "##"
				}else{
					var frame = "*2*1*" + this.ref + "##"
				}
			}
			
			var frame_x_url = frame.replace(/#/g, "%23"); 
			var url = this.status_url + "/frame/" + frame_x_url; 

			httpRequest(url, 'GET', function(error, response, body) {
				if (error) {
					this.log('Sdomotica Gateway get external function failed: %s', error.message);
					callback( error, 0 );
				}
				else {
					if (logga == "1"){
						this.log("Cen command sent: " + frame)
					}
				}
			}.bind(this));


			setTimeout(
				function(){
					this.WindowsService.getCharacteristic(Characteristic.CurrentPosition)
						.getValue(undefined);
					this.WindowsService.getCharacteristic(Characteristic.PositionState)
						.getValue(undefined);
						}.bind(this), 1000);
						
						
			var tempo = "" + this.time
			var tempon = parseFloat (tempo)
			if (tempon >0){
				setTimeout(
				function(){
					var frame = "*2*0*" + this.ref + "##"
					var frame_x_url = frame.replace(/#/g, "%23"); 
					var url = this.status_url + "/frame/" + frame_x_url; 

					httpRequest(url, 'GET', function(error, response, body) {
						if (error) {
							this.log('Sdomotica Gateway get external function failed: %s', error.message);
							callback( error, 0 );
						}
						else {
							if (logga == "1"){
								this.log("Cen command sent: " + frame)
							}
						}
					});
				
				}.bind(this), this.time*1000);
				
			}


			
		}
		callback(null, value);
		
	},
	getTargetPosition: function(callback) {
		//callback(null, 2);

	},
	getPositionState: function(callback) {
		// 1 in apertura  	own 1 
		// 0 chiudo			own 2
		// 2 arrestato		own	0
		//callback(null, 2);
		
		var url = this.status_url + "/status/2/" + cancelletto(this.ref);

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get shutter function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway shutter status for ' + this.ref +': value=' + value );
                }
				if( value == "0" )
                    callback( null, 2 );
                if( value == "1" ){
                    callback( null, 1 );
						setTimeout(
							function(){
								this.WindowsService.getCharacteristic(Characteristic.PositionState)
									.getValue(undefined);
								if (logga == "1"){
									this.log("Request position for " + this.name + " address:" + this.ref)
								}
								}.bind(this), 1000);
				}
                if( value == "2" ){
                    callback( null, 0 );
						setTimeout(
							function(){
								this.WindowsService.getCharacteristic(Characteristic.PositionState)
									.getValue(undefined);
								if (logga == "1"){
									this.log("Request position for " + this.name + " address:" + this.ref)
								}
								}.bind(this), 1000);
				}

				
            }
        }.bind(this));

		
		
		
		
	},
			
 

//Rotolanti avanzate
	getCurrentPositionADV: function(callback) {
		var url = this.status_url + "/status/2A/" + cancelletto(this.ref);

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get shutter function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var risposta = body.split('-')
				var value = risposta[0];
 				callback( null, parseInt(risposta[1], 10));
	
				
            }
        }.bind(this));

		
	},
	setTargetPositionADV: function(value , callback , context) {
		//this.log("Setto positione target->" + this.position )
		//this.log("CONTEXT->" + context )
		
		if (typeof context === 'undefined'){}
		else{
		  clearTimeout(brightnessTimer);
		  brightnessTimer = setTimeout(setBrightnessTimer, 1000, this, value);

		  
					
		}
		callback(null);
		
	},
	getTargetPositionADV: function(callback) {
		//callback(null, 2);

	},
	getPositionStateADV: function(callback) {
		// 1 in apertura  	own 1 
		// 0 chiudo			own 2
		// 2 arrestato		own	0
		//callback(null, 2);
		
		var url = this.status_url + "/status/2/" + cancelletto(this.ref)

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get shutter function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway shutter status for ' + this.ref +': value=' + value );
                }
				if( value == "0" )
                    callback( null, 2 );
                if( value == "1" ){
                    callback( null, 1 );
				}
                if( value == "2" ){
                    callback( null, 0 );
				}

            }
        }.bind(this));

		
		
		
		
	},
	//INIZIO ENERGIA
    getCPower: function(callback) {
		//'*#18*5' + where +'*113##'
		var url = this.status_url + "/energynow/" + this.ref
		httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get Power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = parseInt(body, 10);
				if (logga == "1"){this.log('Sdomotica Gateway Power now for ' + this.ref +': value=' + value );}
				callback( null, value );
            }
        }.bind(this));
		
    },	
    getDPower: function(callback) {
		var url = this.status_url + "/energyday/" + this.ref
		httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get Power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = parseInt(body, 10);
				if (logga == "1"){this.log('Sdomotica Gateway Power now for ' + this.ref +': value=' + value );}
				callback( null, value );
            }
        }.bind(this));
		
    },			
    getMPower: function(callback) {
		var url = this.status_url + "/energymonth/" + this.ref
		httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get Power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = parseInt(body, 10);
				if (logga == "1"){this.log('Sdomotica Gateway Power now for ' + this.ref +': value=' + value );}
				callback( null, value );
            }
        }.bind(this))
		
    },
    getYPower: function(callback) {
		var url = this.status_url + "/energytotal/" + this.ref
		httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get Power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = parseInt(body, 10);
				if (logga == "1"){this.log('Sdomotica Gateway Power now for ' + this.ref +': value=' + value );}
				callback( null, value );
            }
        }.bind(this))
		
		
    },				
	//FINE ENERGIA
	//SONDA ESTERNA
    getTemperatureExternal: function(callback) {

		var url = this.status_url + "/status/externalprobe/" + this.ref

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get external function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = parseFloat(body);
				if (logga == "1"){
					this.log('Sdomotica Gateway get external temperature: value=' + value );
				}
					if( this.temperatureUnit == "F" ) {
						value = (value-32)*5/9;
					}
				
				callback( null, value );
				

            }
        }.bind(this));
    },	
	//SONDA NON Controllata
    getTemperatureNoControlled: function(callback) {

		var url = this.status_url + "/termo/now/" + this.ref

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get external function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = parseFloat(body);
				if (logga == "1"){
					this.log('Sdomotica Gateway get not controlled temperature: value=' + value );
				}	
					if( this.temperatureUnit == "F" ) {
						value = (value-32)*5/9;
					}
				
				callback( null, value );

            }
        }.bind(this));
    },		
	//CANCELLETTO
	
	
	setLockTargetState_pre:  function(on, callback, context) {
	var frame = this.frame;
	switch( this.time ) {
	//this.log(address)
	/*
	11 ON temporizzato 1 Min
	12 ON temporizzato 2 Min
	13 ON temporizzato 3 Min
	14 ON temporizzato 4 Min
	15 ON temporizzato 5 Min
	16 ON temporizzato 15 Min
	17 ON temporizzato 30 sec
	18 ON temporizzato 0.5 sec
	*/
        default:{
				var frame_temporizzata = "18"
				var timerino = 500
            break;
            }
        }

	//console.log("Value porta -> " + on)
	//console.log("Context -> " + context)

    if ( on === 0 && context !== 'fromSetValue') {
		//invia il comando myhome CAMBIA LA FUNZIONE PER LA CHIAMATA DEL CANCELLETTO
			
            if( frame) {
				//myhome.sendframe(frame, function(value) {})
				if (logga == "1"){
					this.log(frame)
				}
				var frame_x_url = frame.replace(/#/g, "%23"); 
				var url = this.status_url + "/frame/" + frame_x_url; 

				httpRequest(url, 'GET', function(error, response, body) {
					if (error) {
						this.log('Sdomotica Gateway get external function failed: %s', error.message);
						callback( error, 0 );
					}
					else {
						if (logga == "1"){
							this.log("Cen command sent: " + frame)
						}
					}
				}.bind(this));	
				
			} else {
				if (logga == "1"){
					this.log(this.control_url + "/own/1/" + frame_temporizzata + "/" + this.ref);
				}
				var url = this.control_url + "/own/1/" + frame_temporizzata + "/" + this.ref; 

				httpRequest(url, 'GET', function(error, response, body) {
					if (error) {
						this.log('Sdomotica Gateway get external function failed: %s', error.message);
						callback( error, 0 );
					}
					else {
						if (logga == "1"){
							this.log("Cen command sent: " + frame)	
						}
					}
				}.bind(this));	

				
			}
			//
        
		//cambio lo stato per la notifica push
		this.DoorService.setCharacteristic(Characteristic.LockCurrentState , Characteristic.LockCurrentState.UNSECURED);
		this.DoorService.setCharacteristic(Characteristic.LockCurrentState , Characteristic.LockTargetState.UNSECURED);
		
		//gestisce il bottone homekit
		setTimeout(
			function(){
				this.DoorService.getCharacteristic(Characteristic.LockCurrentState)
					.getValue(undefined);
					}.bind(this), 3000);
					
		setTimeout(
			function(){
				this.DoorService.getCharacteristic(Characteristic.LockTargetState)
					.getValue(undefined);
					}.bind(this), 3500);
				
		}
	
			if (callback){
				callback();
				}
	
	},
	
	
	setLockTargetState:  function(state, callback) {
		var frame = this.frame;
		var frame_x_url = frame.replace(/#/g, "%23"); 
		var url = this.status_url + "/frame/" + frame_x_url; 

		var lockitronState = (state == Characteristic.LockTargetState.SECURED) ? "lock" : "unlock";

		if (logga == "1"){
		  this.log("Set state to %s", lockitronState);
		}
		
		httpRequest(url, 'GET', function(err, response, body) {

			if (!err && response.statusCode == 200) {
				if (logga == "1"){
					this.log("State change complete.");
				}
			  // we succeeded, so update the "current" state as well
			  var currentState = (state == Characteristic.LockTargetState.SECURED) ?
				Characteristic.LockCurrentState.SECURED : Characteristic.LockCurrentState.UNSECURED;
			  
				this.DoorService.setCharacteristic(Characteristic.LockCurrentState , Characteristic.LockCurrentState.UNSECURED);
				this.DoorService.setCharacteristic(Characteristic.LockCurrentState , Characteristic.LockTargetState.UNSECURED);
			  
			  callback(null); // success
			}
			else {
			  this.log("Error '%s' setting lock state. Response: %s", err, body);
			  callback(err || new Error("Error setting lock state."));
			}
		  }.bind(this));
	
	},
	
	
    getLockCurrentState: function(callback) {
        callback(null, 1);
    },	
    getLockTargetState: function(callback) {
        callback(null, 1);
    },	

//ANTIFURTO

	getBatteryLevel: function(callback) {
      callback(null, Characteristic.StatusLowBattery.BATTERY_LEVEL_NORMAL);
	},

	getBypassState: function(callback) {
		callback(null, 1);
	},

	setBypassState: function(state, callback) {
		this.log("Bypass set to:" + state)
		callback()
	},

	getZona1: function(callback) {
		var url = this.status_url + "/allarmzone/1" 
		
        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get zona 1 status: value=' + value );
                }
				if( value == "0" )
					callback(null, this.ZONA1 + " - Off")
                else
					callback(null, this.ZONA1 + " - On")
            }
        }.bind(this));

		},
	getZona2: function(callback) {
		var url = this.status_url + "/allarmzone/2" 
		
        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get zona 2 status: value=' + value );
                }
				if( value == "0" )
					callback(null, this.ZONA2 + " - Off")
                else
					callback(null, this.ZONA2 + " - On")
            }
        }.bind(this));

		},
	getZona3: function(callback) {
		var url = this.status_url + "/allarmzone/3" 
		
        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get zona 3 status: value=' + value );
                }
                if( value == "0" )
					callback(null, this.ZONA3 + " - Off")
                else
					callback(null, this.ZONA3 + " - On")
            }
        }.bind(this));

		},
	getZona4: function(callback) {
		var url = this.status_url + "/allarmzone/4" 
		
        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get zona 4 status: value=' + value );
                }
                if( value == "0" )
					callback(null, this.ZONA4 + " - Off")
                else
					callback(null, this.ZONA4 + " - On")
            }
        }.bind(this));

		},
	getZona5: function(callback) {
		var url = this.status_url + "/allarmzone/5" 
		
        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get zona 5 status: value=' + value );
                }
                if( value == "0" )
					callback(null, this.ZONA5 + " - Off")
                else
					callback(null, this.ZONA5 + " - On")
            }
        }.bind(this));

		},
	getZona6: function(callback) {
		var url = this.status_url + "/allarmzone/6" 
		
        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get zona 6 status: value=' + value );
                }
                if( value == "0" )
					callback(null, this.ZONA6 + " - Off")
                else
					callback(null, this.ZONA6 + " - On")
            }
        }.bind(this));

		},
	getZona7: function(callback) {
		var url = this.status_url + "/allarmzone/7" 
		
        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get zona 7 status: value=' + value );
                }
                if( value == "0" )
					callback(null, this.ZONA7 + " - Off")
                else
					callback(null, this.ZONA7 + " - On")
            }
        }.bind(this));

		},
	getZona8: function(callback) {
		var url = this.status_url + "/allarmzone/8" 
		
        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get zona 8 status: value=' + value );
                }
                if( value == "0" )
					callback(null, this.ZONA8 + " - Off")
                else
					callback(null, this.ZONA8 + " - On")
            }
        }.bind(this));

		},

		
	getAlarmState: function(callback) {
		  //      callback(null, Characteristic.SecuritySystemCurrentState.AWAY_ARM);
		//      callback(null, Characteristic.SecuritySystemCurrentState.STAY_ARM);
		//      callback(null, Characteristic.SecuritySystemCurrentState.NIGHT_ARM);
		//      callback(null, Characteristic.SecuritySystemCurrentState.AWAY_ARM);

		//Characteristic.SecuritySystemCurrentState.STAY_ARM = 0;
		//Characteristic.SecuritySystemCurrentState.AWAY_ARM = 1;
		//Characteristic.SecuritySystemCurrentState.NIGHT_ARM = 2;
		//Characteristic.SecuritySystemCurrentState.DISARMED = 3;
		//Characteristic.SecuritySystemCurrentState.ALARM_TRIGGERED = 4;

	
		var url = this.status_url + "/allarm/status/" 

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get external function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
				if (body == "0") {
					var value = 3
				}
				if (body == "1") {
					var value = 1
				}
				
				if (logga == "1"){
					this.log("Valore antifurto richiesto e rilevato " + value)
				}
				callback(null, value * 1);

            }
        }.bind(this));	
			

	},

	
	setAlarmState: function(state, callback) {
		this.log("stato antifurto: "+ state)
		switch (state) {
			case 0: 
				if (this.STAY_ARM) {
					if (logga == "1"){
						this.log("Imposta  antifurto: " + this.STAY_ARM) 
					}
					var frame = this.STAY_ARM
				}
				break;
			case 1: 
				if (this.AWAY_ARM) {
					if (logga == "1"){
						this.log("Imposta antifurto: " + this.AWAY_ARM) 
					}
					var frame = this.AWAY_ARM
				}
				break;
			case 2: 
				if (this.NIGHT_ARM) {
					if (logga == "1"){
						this.log("Imposta antifurto: " + this.NIGHT_ARM) 
					}
					var frame = this.NIGHT_ARM
				}
				break;
			case 3: 
				if (this.DISARMED) {
					if (logga == "1"){
						this.log("Imposta antifurto: " + this.DISARMED) 
					}
					var frame = this.DISARMED
				}
				break;
		}

	
		if (frame) {
			if (logga == "1"){
				this.log("Invio la frame -> " + frame)
			}
			//Invia la frame AUX
				var frame_x_url = frame.replace(/#/g, "%23"); 
				var url = this.status_url + "/frame/" + frame_x_url; 

				httpRequest(url, 'GET', function(error, response, body) {
					if (error) {
						this.log('Sdomotica Gateway set frame failed: %s', error.message);
						callback( error, 0 );
					}
					else {
					if (logga == "1"){
						this.log("Frame command sent: " + frame)
					}
					}
				}.bind(this));	
			
			//Fine invio frame
			
			
			
			
			
			
			
			
			
			
			
		//setta lo stato, da inserire l'invio della richiesta con eventualmente gli aux
			setTimeout(	function(){
					this.AllarmService
						.setCharacteristic(Characteristic.SecuritySystemCurrentState, state);
							}.bind(this),1000);
			
		//verifica lo stato dell'antifurto
		setTimeout(	function(){
					this.AllarmService.getCharacteristic(Characteristic.SecuritySystemCurrentState)
					.getValue(undefined);
					if (logga == "1"){
						this.log("Verifico stato antifurto - SetTimout")
					}
					}.bind(this), 3000);


	
		}//fine IF
		
		callback()
	},	
	
//FINE ANTIFURTO	
	
//TERMOSTATO
	
    getTemperature: function(callback) {
		
		//this.log('--------------------------------Richiesto' );
		//console.log('--------------------------------Richiesto' );
		var url = this.status_url + "/termo/now/" + this.ref

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get external function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = parseFloat(body);
				if (parseInt(value) === value){
					value = value + 0.1
				}
				if (logga == "1"){
					this.log('Sdomotica Gateway get temperature: value=' + value );
				}
					if( this.temperatureUnit == "F" ) {
						value = (value-32)*5/9;
					}
					//value = 15
				this.ThermostatService.updateCharacteristic(Characteristic.CurrentTemperature , value);
				//this.ThermostatService.setCharacteristic(MyHome2Platform.TermoNOW , ""+value + "\xB0" + "C");
				callback( null, value );

            }
        }.bind(this));
		
		

		
		
    },	
    getThermostatTargetTemperature: function(callback) {

		var url = this.status_url + "/termo/setpoint_corrected/" + this.ref

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get external function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = parseFloat(body);
				if (logga == "1"){
					this.log('Sdomotica Gateway get corrected setpoint temperature: value=' + value );
				}
					if( this.temperatureUnit == "F" ) {
						value = (value-32)*5/9;
					}
				
				callback( null, value );

            }
        }.bind(this));
    },	
	
	//DA FINIRE CON LA FRAME DI IMPOSTAZIONE MANUALE DELLA TEMPERATURA
	setThermostatTargetTemperature: function(temperature , callback , context) {
		
	if (typeof context === 'undefined'){
			//this.log("setThermostatTargetTemperature " + temperature + " per " + this.name + " - context -> " + context)
		}else{	
		//this.log("Impostata temperatura a " + temperature + " per " + this.name)
		var setpoint_da_convertire = temperature*10

		if (parseFloat(setpoint_da_convertire) > 99) {
					setpoint_da_convertire = "0" + setpoint_da_convertire
			} else {
					setpoint_da_convertire = "00" + setpoint_da_convertire
		}

		switch( this.config.type ) {
			case "Thermostat":
			{
				//richiesta_http("127.0.0.1","3000","/frame/*#4*#"  + TOPIC[2] + "*#14*" + setpoint +"*3##" )	
				var frame = "*#4*#" + this.ref + "*#14*" + setpoint_da_convertire +"*3##"
				break;
			}
			case "SAThermoHC":
			case "SAThermoH":
			case "SAThermoC":
			{
				//richiesta_http("127.0.0.1","3000","/frame/*#4*"  + TOPIC[2] + "*#14*" + setpoint +"*3##" )
				var frame = "*#4*" + this.ref + "*#14*" + setpoint_da_convertire +"*3##"
				break;;
			}
		
			case "4ZThermo":
			{
				//richiesta_http("127.0.0.1","3000","/frame/*#4*"  + TOPIC[2] + "*#14*" + setpoint +"*3##" )
				var frame = "*#4*#0#" + this.ref + "*#14*" + setpoint_da_convertire +"*3##"
				break;;
			}		
		}
		
			if (logga == "1"){
				this.log(frame)
			}
			var frame_x_url = frame.replace(/#/g, "%23"); 
			var url = this.status_url + "/frame/" + frame_x_url; 
				
		httpRequest(url, 'GET', function(error, response, body) {
					if (error) {
						this.log('Sdomotica Gateway set setpoint function failed: %s', error.message);
						callback( error, 0 );
					}
					else {
					if (logga == "1"){
						this.log("Impostata temperatura a " + setpoint_da_convertire + " per " + this.name)
					}
					}
			}.bind(this));	

		}
		
		callback();
	
	},			


	getThermostatCurrentHeatingCoolingState: function(callback) {
	/*
	Characteristic.CurrentHeatingCoolingState.OFF = 0;
	Characteristic.CurrentHeatingCoolingState.HEAT = 1;
	Characteristic.CurrentHeatingCoolingState.COOL = 2;

	0 ? Conditioning
	1 ? Heating
	102 ? Antifreeze
	202 ? Thermal Protection
	303 ? Generic OFF

	*/
		var mode = 0

		var url = this.status_url + "/termo/status/" + this.ref

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get external function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get thermostat status for ' + this.ref +' : value=' + value );
				}
				switch (value) {
					case "1":
							mode = Characteristic.CurrentHeatingCoolingState.HEAT
						break;
					case "303":
							mode = Characteristic.CurrentHeatingCoolingState.OFF
						break;
					default:
							mode = Characteristic.CurrentHeatingCoolingState.COOL
						break;
					}
				callback( null, mode );				
				
            }
        }.bind(this));
		
	},

	setThermostatCurrentHeatingCoolingState: function(state, callback , context) {
		this.log("-1----------setThermostatCurrentHeatingCoolingState" + " per " + this.name + " - context -> " + context)
		callback();
	},

	setThermostatTargetHeatingCoolingState: function(state, callback , context) {
		if (typeof context === 'undefined'){
		}else{
			if (logga == "1"){
				this.log("Impostata programma a target -> " + state + " per " + this.name)
			}
			//0 spento
			//1 riscaldamento
			//2 raffrescamento
			//3 Auto
			//console.log("Impostata programma a target -> " + state + " per " + this.name + " - SANDRO - " + this.config.type)
		switch( this.config.type ) {
			case "Thermostat":
			{
				if (state == 1 || state == 2 || state == 3 ) {
					var frame = "*4*311*#" +this.ref +"##"  
				}
				else {
					var frame = "*4*303*#" +this.ref +"##"  
				}
				break;
			}
			case "SAThermoHC":
			{
				switch(state) {
					case 0: //0 spento
					{
						var frame = "*4*303*" +this.ref +"##"  
						break;
					}
					case 1: //1 riscaldamento
					{
						var frame = "*#4*" + this.ref + "*#14*0210*1##"
						break;
					}
					
					case 2: //2 raffrescamento
					{
						var frame = "*#4*" + this.ref + "*#14*0210*2##"
						break;
					}
					case 3: //3 Auto
					{
						var frame = "*#4*" + this.ref + "*#14*0210*3##"
						break;
					}
					
				}
				break;
			}
			case "SAThermoH":
			{
				switch(state) {
					case 0: //0 spento
					{
						var frame = "*4*303*" +this.ref +"##"  
						break;
					}
					case 1: //1 riscaldamento
					case 2: //2 raffrescamento
					{
						var frame = "*#4*" + this.ref + "*#14*0210*1##"
						break;
					}
					case 3: //3 Auto
					{
						var frame = "*#4*" + this.ref + "*#14*0210*3##"
						break;
					}
					
				}
				break;
			}
			case "SAThermoC":
			{
				switch(state) {
					case 0: //0 spento
					{
						var frame = "*4*303*" +this.ref +"##"  
						break;
					}
					case 1: //1 riscaldamento
					case 2: //2 raffrescamento
					{
						var frame = "*#4*" + this.ref + "*#14*0210*2##"
						break;
					}
					case 3: //3 Auto
					{
						var frame = "*#4*" + this.ref + "*#14*0210*3##"
						break;
					}
					
				}
				break;
			}
		
			case "4ZThermo":
			{
				switch(state) {
					case 0: //0 spento
					{
						var frame = "*4*303*#0#" +this.ref +"##"  
						break;
					}
					case 1: //1 riscaldamento
					case 3: //3 Auto
					{
						var frame = "*4*1101*#0#" +this.ref +"##"  
						break;
					}
					case 2: //2 raffrescamento
					{
						var frame = "*4*1102*#0#" +this.ref +"##"  
						break;
					}
				}

				break;;
			}
		}
				
			if (logga == "1"){
				this.log(frame)
			}
			//console.log(frame)
			var frame_x_url = frame.replace(/#/g, "%23"); 
			var url = this.status_url + "/frame/" + frame_x_url; 

			httpRequest(url, 'GET', function(error, response, body) {
				if (error) {
					this.log('Sdomotica Gateway set program failed: %s', error.message);
					callback( error, 0 );
				}
				else {
					if (logga == "1"){
						this.log("Frame sent: " + frame)
					}
				}
			}.bind(this));	

			//verifica lo stato della termoregolazion
			//ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
			//this.ThermostatService.setCharacteristic(MyHome2Platform.TermoMode, "Test");

			setTimeout(	function(){
						this.ThermostatService.getCharacteristic(Characteristic.TargetTemperature)
						.getValue(undefined);
						this.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
						.getValue(undefined);
						
						if (logga == "1"){
							this.log("Verifico stato termoregolazione da impostazione manuale - SetTimeout")
						}
						}.bind(this), 2000);

		
		
		//this.log("-2-----------setThermostatTargetHeatingCoolingState" + " per " + this.name + " - context -> " + context)
		}
		callback();
	},
	
	getThermostatTargetHeatingCoolingState: function(callback) {
	/*
	0 ? Conditioning
	1 ? Heating
	102 ? Antifreeze
	202 ? Thermal Protection
	303 ? Generic OFF

	Characteristic.TargetHeatingCoolingState.OFF = 0;
	Characteristic.TargetHeatingCoolingState.HEAT = 1;
	Characteristic.TargetHeatingCoolingState.COOL = 2;
	Characteristic.TargetHeatingCoolingState.AUTO = 3;


	*/
		var mode = 0

		
		var url = this.status_url + "/termo/status/" + this.ref

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get external function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get thermostat status for ' + this.ref +' : value=' + value );
				}
				switch (value) {
					case "1":
							mode = Characteristic.CurrentHeatingCoolingState.HEAT
						break;
					case "303":
							mode = Characteristic.CurrentHeatingCoolingState.OFF
						break;
					default:
							mode = Characteristic.CurrentHeatingCoolingState.COOL
						break;
					}
				callback( null, mode );				
				
            }
        }.bind(this));
		
	},

	getThermostatTemperatureDisplayUnits: function(callback) {
			  if( this.temperatureUnit == "F" )
				callback( null, 1 );
			else
				callback( null, 0 );  
	},

	getTermoMode: function(callback) {
	/*
		0 ? Conditioning
		1 ? Heating
		110 ? Manual Heating
		210 ? Manual Conditioning
		111 ? Automatic Heating
		211 ? Automatic Conditioning
		103 ? Off Heating
		203 ? Off Conditioning
		102 ? Antifreeze
		202 ? Thermal Protection

	*/
		var mode = "N/D"
		if (logga == "1"){
			this.log("Richiedo modalità")
		}
		
		var url = this.status_url + "/termo/statuscentrale/" + this.ref

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get external function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway getTermoMode for ' + this.ref +' : value=' + value );
				}
				switch (value) {
					case "0":
							mode = "Conditioning"
						break;
					case "1":
							mode = "Heating"
						break;
					case "110":
							mode = "Manual Heating" 
						break;
					case "210":
							mode = "Manual Conditioning"
						break;
					case "111":
							mode = "Automatic Heating"
						break;
					case "211":
							mode = "Automatic Conditioning"
						break;
					case "103":
							mode = "Off Heating"
						break;
					case "203":
							mode = "Off Conditioning"
						break;
					case "102":
							mode = "Antifreeze"
						break;
					case "202":
							mode = "Thermal Protection"
						break;

					default:
							mode = "N/D"
						break;
					}
				if (logga == "1"){
					this.log('Sdomotica Gateway thermostat mode for ' + this.ref +' : ' + mode );
				}
				callback( null, mode );				
				
            }
        }.bind(this));
		
	},
		
	//PULSANTE
	getButtonState:  function(callback) {
		callback( null, 1 );
	},
	
	setButtonState:  function(value, callback, context) {
				
		if (typeof context === 'undefined')
			{callback();}
		else{
				//Do NOT send cmd to Bticino Legrand when Homebridge was notified from an Event - Bticino Legrand already knows the state!
				if (fromEventCheck(this.config.type + ":" + this.id + ":eventPowerState:" + value)==false ) {
					
					if (value) {
						if (this.frame){
							httpRequest2(this.control_url + "/frame/" + cancelletto(this.frame) ,'GET'); // (* after value required on set)
						}else{
							httpRequest2(this.control_url + "/own/1/18/" + espansione(this.ref) ,'GET'); // (* after value required on set)		
						}
						if (logga == "1"){
							this.log("SdomoticaSocket.write - " + this.config.type + ":" + this.id + ":setPowerState:1*");
						}
					} else {
						httpRequest2(this.control_url + "/own/1/0/" + espansione(this.ref) ,'GET'); // (* after value required on set)
						if (logga == "1"){
							this.log("SdomoticaSocket.write - " + this.config.type + ":" + this.id + ":setPowerState:0*");
						}
					}
				}
				callback();
			}
		
	},


	//CEN
	getCenState:  function(callback) {
		callback( null, 0 );
	},
	
	setCenState:  function(on, callback, context) {
	var frame = this.frame;

	
    if (frame) {

		var frame_x_url = frame.replace(/#/g, "%23"); 
		var url = this.status_url + "/frame/" + frame_x_url; 

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get external function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
				if (logga == "1"){
					this.log("Cen command sent: " + frame)
				}
            }
        }.bind(this));	

		
		setTimeout(
			function(){
				this.CenService.getCharacteristic(Characteristic.On)
					.getValue(undefined);
					}.bind(this), 1000);
				
		}
	
	if (callback){
				callback();
		}
	
	},

 			
// F523
	getForcing: function(callback) {
		
		//righe codice da sostiture con quelle dello status
		var url = this.status_url + "/energyF522/" + this.ref

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
            }
            else {
				if (logga == "1"){
					this.log("Actuator for " + this.name + " value: " + body)
				}
				this.actuator_status = body.split('*')
				//<disabled>* <forcing>* <threshold>*<protection>
				
				this.F523Service.setCharacteristic(MyHome2Platform.Disabling, parseInt(this.actuator_status[0]));
				//this.F523Service.setCharacteristic(MyHome2Platform.Forcing, parseInt(this.actuator_status[1]));
				
				if (this.actuator_status[2] == '0') {
					this.F523Service.setCharacteristic(MyHome2Platform.Threshold, "Above");
					}
				else {
					this.F523Service.setCharacteristic(MyHome2Platform.Threshold, "Below");
				}
				
				this.F523Service.setCharacteristic(MyHome2Platform.Protection, parseInt(this.actuator_status[3]));
				
				callback(null, parseFloat(this.actuator_status[1]));
				//callback(null, 0);
			}
        }.bind(this));

		//Forcing: •1 = Forced •0 = Not Forced
	},
	setForcing: function(on, callback) {
		//Forcing: •1 = Forced •0 = Not Forced
		if (logga == "1"){
			this.log("Manual Forced for " + this.name + " address: " + this.ref + " to " + on )
		}
        if (on) {
            var frame = "*18*73*7" + this.ref + "#0##"; //forza
        }
        else {
            var frame = "*18*74*7" + this.ref + "#0##"; //rilascia
        }


		var frame_x_url = frame.replace(/#/g, "%23"); 
		var url = this.status_url + "/frame/" + frame_x_url; 

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get external function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
				if (logga == "1"){
					this.log("Frame sent: " + frame)
				}
            }
        }.bind(this));	

		setTimeout(
			function(){
				this.F523Service.getCharacteristic(MyHome2Platform.Forcing)
					.getValue(undefined);
					}.bind(this), 1500);


		callback();
	},
	/*		
	getProtection: function(callback) {
		//Protection: •1 = Protection •0 = Not Protection
		callback(null, 1);
		//callback();
	},
			
	getDisabled: function(callback) {
		//Disabled:• 1 = Disabled • 0 = Enabled
		callback(null, 1);
		//callback();
	},

	getThreshold: function(callback) {
		//Threshold: •1 = Below Threshold •0 = Above Threshold
		//callback(null, "Below");
		//callback(null, this.pippo);
		callback(null, "")
	},  */
// F522
	getF522Forcing: function(callback) {
		//Forcing: •1 = Forced •0 = Not Forced
		var url = this.status_url + "/energyF522/" + this.ref

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
            }
            else {
				if (logga == "1"){
					this.log("Actuator for " + this.name + " value: " + body)
				}
				this.actuator_status = body.split('*')
				//<disabled>* <forcing>* <threshold>*<protection>
				this.F522Service.setCharacteristic(MyHome2Platform.F522Disabling, parseInt(this.actuator_status[0]));
				//this.F522Service.setCharacteristic(MyHome2Platform.F522Forcing, parseInt(this.actuator_status[1]));
				
				if (this.actuator_status[2] == '0') {
					this.F522Service.setCharacteristic(MyHome2Platform.F522Threshold, "Above");
					}
				else {
					this.F522Service.setCharacteristic(MyHome2Platform.F522Threshold, "Below");
				}
				
				this.F522Service.setCharacteristic(MyHome2Platform.F522Protection, parseInt(this.actuator_status[3]));
				callback(null, parseFloat(this.actuator_status[1]));

            }
        }.bind(this));
	},
	setF522Forcing: function(on, callback) {
		//Forcing: •1 = Forced •0 = Not Forced
		if (logga == "1"){
			this.log("Manual Forced for " + this.name + " address: " + this.ref + " to " + on )
		}
        if (on) {
            var frame = "*18*73*7" + this.ref + "#0##"; //forza
        }
        else {
            var frame = "*18*74*7" + this.ref + "#0##"; //rilascia
        }


		var frame_x_url = frame.replace(/#/g, "%23"); 
		var url = this.status_url + "/frame/" + frame_x_url; 

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get external function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
				if (logga == "1"){
					this.log("Frame sent: " + frame)
				}
            }
        }.bind(this));	

		setTimeout(
			function(){
				this.F522Service.getCharacteristic(MyHome2Platform.F522Forcing)
					.getValue(undefined);
					}.bind(this), 1500);

		callback();
	},
	/*			
	getF522Protection: function(callback) {
		//Protection: •1 = Protection •0 = Not Protection
		//callback(null, 0);
		callback();
	},
			
	getF522Disabled: function(callback) {
		//Disabled:• 1 = Disabled • 0 = Enabled
		//callback(null, 0);
		callback();
	},

	getF522Threshold: function(callback) {
		//Threshold: •1 = Below Threshold •0 = Above Threshold
		//callback(null, "Below");
		//callback(null, this.pippo);
		callback();
	}, */
	getF522Now: function(callback) {
		//righe codice da sostiture con quelle dello status

		/*
		var frame = '*#18*7' + this.ref +'#0*113##' 
		var frame_x_url = frame.replace(/#/g, "%23"); 
		var url = this.status_url + "/frame/" + frame_x_url; 
		//2016-10-31T11:11:44.863Z - MON <= *#18*72#0*113*13##
		//Frame da elaborare *#18*72#0*113*13##
		//2016-10-31T11:12:14.952Z - MON <= *#18*72#0*113*13##
		*/
		
		
		var url = this.status_url + "/energynowF522/" + this.ref

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get power function failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get power for ' + this.name + ': value=' + value );
                }
				if( value == "0" )
                    callback( null, "0 W" );
                else
                    callback( null, value + " W" );
					
            }
        }.bind(this));
	},

//funzioni diffusione sonora
   getMuteState: function (callback) {
        var URL = this.status_url + "/statusaudio/" + this.ref
        httpRequest(URL, 'GET', function(error, response, body) {
            if (error) {
                this.log("getMuteState() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("getMuteState() request returned http error: %s", response.statusCode);
                callback(new Error("getMuteState() returned http error " + response.statusCode));
            }
            else {
                
                var STATUS_AUDIO = JSON.parse(body)
                             
                var muted = 1 - STATUS_AUDIO['status'];
                this.log("Speaker is currently %s", muted? "MUTED": "NOT MUTED");
                var radio_info = STATUS_AUDIO['frequenza'] + "-" + STATUS_AUDIO['rds']
                this.speakerService.setCharacteristic(MyHome2Platform.ChangeTrack, 0);
                this.speakerService.setCharacteristic(MyHome2Platform.CurrentTrack, radio_info);
                
                if(this.Source1) {this.speakerService.setCharacteristic(MyHome2Platform.Source1, 0)}
                if(this.Source2) {this.speakerService.setCharacteristic(MyHome2Platform.Source2, 0)}
                if(this.Source3) {this.speakerService.setCharacteristic(MyHome2Platform.Source3, 0)}
                if(this.Source4) {this.speakerService.setCharacteristic(MyHome2Platform.Source4, 0)}
                
                if (STATUS_AUDIO['sorgente'] == 1 && this.Source1){
                    this.speakerService.setCharacteristic(MyHome2Platform.Source1, 1)
                }
                
                if (STATUS_AUDIO['sorgente'] == 2 && this.Source2){
                    this.speakerService.setCharacteristic(MyHome2Platform.Source2, 1)
                }                
 
                if (STATUS_AUDIO['sorgente'] == 3 && this.Source3){
                    this.speakerService.setCharacteristic(MyHome2Platform.Source3, 1)
                } 
                
                if (STATUS_AUDIO['sorgente'] == 4 && this.Source4){
                    this.speakerService.setCharacteristic(MyHome2Platform.Source4, 1)
                }                 
                
                callback(null, muted);
            }
        }.bind(this));
    },

 
    setMuteState: function (muted, callback) {
        var URL = this.status_url + "/audio/" + this.ref + "/1"
        var URL2 = this.status_url + "/audio/" + this.ref + "/0"
        
        var url = muted? URL2: URL;
        //this.log(url)
        
        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log("setMuteState() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("setMuteState() request returned http error: %s", response.statusCode);
                callback(new Error("setMuteState() returned http error " + response.statusCode));
            }
            else {
                this.log("setMuteState() successfully set mute state to %s", muted? "ON": "OFF");

                callback(undefined, body);
            }
        }.bind(this));
    },

   getMuteState2: function (callback) {
        var URL = this.status_url + "/statusaudio/" + this.ref
        httpRequest(URL, 'GET', function(error, response, body) {
            if (error) {
                this.log("getMuteState() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("getMuteState() request returned http error: %s", response.statusCode);
                callback(new Error("getMuteState() returned http error " + response.statusCode));
            }
            else {
                
                var STATUS_AUDIO = JSON.parse(body)
                             
                var muted = STATUS_AUDIO['status'];
                this.log("Speaker is currently %s", muted? "MUTED": "NOT MUTED");
                var radio_info = STATUS_AUDIO['frequenza'] + "-" + STATUS_AUDIO['rds']
                this.speakerService.setCharacteristic(MyHome2Platform.ChangeTrack, 0);
                this.speakerService.setCharacteristic(MyHome2Platform.CurrentTrack, radio_info);
                
                if(this.Source1) {this.speakerService.setCharacteristic(MyHome2Platform.Source1, 0)}
                if(this.Source2) {this.speakerService.setCharacteristic(MyHome2Platform.Source2, 0)}
                if(this.Source3) {this.speakerService.setCharacteristic(MyHome2Platform.Source3, 0)}
                if(this.Source4) {this.speakerService.setCharacteristic(MyHome2Platform.Source4, 0)}
                
                if (STATUS_AUDIO['sorgente'] == 1 && this.Source1){
                    this.speakerService.setCharacteristic(MyHome2Platform.Source1, 1)
                }
                
                if (STATUS_AUDIO['sorgente'] == 2 && this.Source2){
                    this.speakerService.setCharacteristic(MyHome2Platform.Source2, 1)
                }                
 
                if (STATUS_AUDIO['sorgente'] == 3 && this.Source3){
                    this.speakerService.setCharacteristic(MyHome2Platform.Source3, 1)
                } 
                
                if (STATUS_AUDIO['sorgente'] == 4 && this.Source4){
                    this.speakerService.setCharacteristic(MyHome2Platform.Source4, 1)
                }                 
                
                callback(null, muted);
            }
        }.bind(this));
    },

 
    setMuteState2: function (muted, callback) {
        var URL = this.status_url + "/audio/" + this.ref + "/1"
        var URL2 = this.status_url + "/audio/" + this.ref + "/0"
        
        var url = muted? URL: URL2;
        //this.log(url)
        
        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log("setMuteState() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("setMuteState() request returned http error: %s", response.statusCode);
                callback(new Error("setMuteState() returned http error " + response.statusCode));
            }
            else {
                this.log("setMuteState() successfully set mute state to %s", muted? "ON": "OFF");

                callback(undefined, body);
            }
        }.bind(this));
    },    
    
    getVolume: function (callback) {
        this.log("GetVolume: "+ this.ref)
        var URL = this.status_url + "/status/volume/" + this.ref
        
        httpRequest(URL, 'GET', function(error, response, body) {
            if (error) {
                this.log("getVolume() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("getVolume() request returned http error: %s", response.statusCode);
                callback(new Error("getVolume() returned http error " + response.statusCode));
            }
            else {
                var volume = parseInt(body);
                var volume = Math.round(volume/31*100);

                this.log("Speaker's volume is at  %s %", volume);

                callback(null, volume);
            }
        }.bind(this));
    },

    setVolume: function(volume , callback , context) {
		if (typeof context === 'undefined'){}
		else{
		  clearTimeout(volumeTimer); 
          var ampli  = this.ref
		  volumeTimer = setTimeout(setvolumeTimer, 1000, this, ampli, volume);
		}
		callback(null);
	},

    getCurrentTrack: function (callback) {
        this.log("getCurrentTrack: "+ this.ref)

        var URL = this.status_url + "/statusaudio/" + this.ref
        httpRequest(URL, 'GET', function(error, response, body) {
            if (error) {
                this.log("getCurrentTrack() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("getCurrentTrack() request returned http error: %s", response.statusCode);
                callback(new Error("getCurrentTrack() returned http error " + response.statusCode));
            }
            else {
                
                var STATUS_AUDIO = JSON.parse(body)
                var radio_info = STATUS_AUDIO['frequenza'] + "-" + STATUS_AUDIO['rds']
                //this.speakerService.setCharacteristic(MyHome2Platform.ChangeTrack, 0);
                //this.speakerService.setCharacteristic(MyHome2Platform.CurrentTrack, radio_info);
                
                callback(null, radio_info);
            }
        }.bind(this));
    },

    
    getTrack: function (callback) {
        this.log("getTrack: "+ this.ref)       
        callback(null, 0)
    },
    
    
    setTrack: function(track , callback , context) {
        if (typeof context === 'undefined'){}
		else{
           if (track == 1){
               var URL = this.status_url + "/station/" + this.radio + "/up";
           } else {
               var URL = this.status_url + "/station/" + this.radio + "/down";
           }            

		  clearTimeout(StationTimer); 
		  StationTimer = setTimeout(setStationTimer, 1000, this, URL);
		}
		callback(null);

	},
    
    setSource1: function (source , callback , context) {
        if (typeof context === 'undefined'){
            callback(null);
        }
		else{
            var url = this.status_url + "/source/" + this.ref + "/1"
            httpRequest(url, 'GET', function(error, response, body) {
                if (error) {
                    this.log("setSource1() failed: %s", error.message);
                    callback(error);
                }
                else if (response.statusCode !== 200) {
                    this.log("setSource1() request returned http error: %s", response.statusCode);
                    callback(new Error("setSource1() returned http error " + response.statusCode));
                }
                else {
                    this.log("setSource1() successfully set");
                    callback(null);
                }
            }.bind(this));    
                

		}

        
    },
       
   
    setSource2: function (source , callback , context) {
        if (typeof context === 'undefined'){
            callback(null);
        }
		else{
           var url = this.status_url + "/source/" + this.ref + "/2"
            httpRequest(url, 'GET', function(error, response, body) {
                if (error) {
                    this.log("setSource1() failed: %s", error.message);
                    callback(error);
                }
                else if (response.statusCode !== 200) {
                    this.log("setSource1() request returned http error: %s", response.statusCode);
                    callback(new Error("setSource1() returned http error " + response.statusCode));
                }
                else {
                    this.log("setSource2() successfully set");
                    callback(null);
                }
            }.bind(this));              
		}
       
    },

    
    setSource3: function (source , callback , context) {
        if (typeof context === 'undefined'){
            callback(null);
        }
		else{
           var url = this.status_url + "/source/" + this.ref + "/3"
            httpRequest(url, 'GET', function(error, response, body) {
                if (error) {
                    this.log("setSource1() failed: %s", error.message);
                    callback(error);
                }
                else if (response.statusCode !== 200) {
                    this.log("setSource1() request returned http error: %s", response.statusCode);
                    callback(new Error("setSource1() returned http error " + response.statusCode));
                }
                else {
                    this.log("setSource3() successfully set");
                    callback(null);
                }
            }.bind(this));              
            
		}
       
    },
       

    
    setSource4: function (source , callback , context) {
        if (typeof context === 'undefined'){
            callback(null);
        }
		else{
           var url = this.status_url + "/source/" + this.ref + "/4"
            httpRequest(url, 'GET', function(error, response, body) {
                if (error) {
                    this.log("setSource1() failed: %s", error.message);
                    callback(error);
                }
                else if (response.statusCode !== 200) {
                    this.log("setSource1() request returned http error: %s", response.statusCode);
                    callback(new Error("setSource1() returned http error " + response.statusCode));
                }
                else {
                    this.log("setSource4() successfully set");
                    callback(null);
                }
            }.bind(this));              
		}
        
    },
       
//Irrigatori ###########################################

    getValveType: function (callback) {
        this.log("getValveType: "+ this.ref)       
        callback(null, 1)
    },
    
   setDuration: function (tempo , callback , context ) {
        if (typeof context === 'undefined'){
            callback(null);
        }
		else{
            this.log("Set Timer for : "+ this.ref + "for " + tempo + " seconds" ) 
            var URL = this.status_url + "/settimer/"+ cancelletto(this.ref) + "/" + tempo 
            
            httpRequest(URL, 'GET', function(error, response, body) {
                if (error) {
                    this.log("setDuration() failed: %s", error.message);
                    callback(error);
                }
                else if (response.statusCode !== 200) {
                    this.log("setDuration() request returned http error: %s", response.statusCode);
                    callback(new Error("setDuration() returned http error " + response.statusCode));
                }
                else {
                    var timer = parseFloat(body);
                    callback(null, timer);
                }
            }.bind(this));
        }
    },

   getDuration: function (callback) {
        this.log("Get Timer for : "+ this.ref)
        var URL = this.status_url + "/gettimer/"+ cancelletto(this.ref)
        
        httpRequest(URL, 'GET', function(error, response, body) {
            if (error) {
                this.log("getDuration() failed: %s", error.message);
                callback(error);
            }
            else if (response.statusCode !== 200) {
                this.log("getDuration() request returned http error: %s", response.statusCode);
                callback(new Error("getDuration() returned http error " + response.statusCode));
            }
            else {
                var timer = parseFloat(body);
                callback(null, timer);
            }
        }.bind(this));
    },

//Sensore 3477 ###########################################

	getSensorState3477: function(callback) { // this.config.type = Lightbulb, Switch, etc
		var url = this.status_url + "/status/sensor/" + cancelletto(this.ref)

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get sensor 3477 state failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get sensor 3477 state for ' + this.name +': value=' + value );
				}
				if( value == 0 )
                    callback( null, 0 );
                else
                    callback( null, 1 );
            }
        }.bind(this));
    },

	getSensorState3477inv: function(callback) { // this.config.type = Lightbulb, Switch, etc
		var url = this.status_url + "/status/sensor/" + cancelletto(this.ref)

        httpRequest(url, 'GET', function(error, response, body) {
            if (error) {
                this.log('Sdomotica Gateway get sensor 3477 state failed: %s', error.message);
                callback( error, 0 );
            }
            else {
                var value = body;
				if (logga == "1"){
					this.log('Sdomotica Gateway get sensor 3477 state for ' + this.name +': value=' + value );
				}
				if( value == 0 )
                    callback( null, 1 );
                else
                    callback( null, 0 );
            }
        }.bind(this));
    },




 //---------------
    // Characteristic Config
    //---------------
    getServices: function() {
        var services = []

        var informationService = new Service.AccessoryInformation();
        informationService
            .setCharacteristic(Characteristic.Manufacturer, "BT MyHome")
            .setCharacteristic(Characteristic.Model, this.model )
            .setCharacteristic(Characteristic.SerialNumber, "BT " + this.config.type + " ID " + this.id);
        services.push( informationService );

        switch( this.config.type ) {
            case "Lightbulb": {
                var lightbulbService = new Service.Lightbulb(this.name);
                var PowerState = lightbulbService
                    .getCharacteristic(Characteristic.On)
                    .on('set', this.setPowerState.bind(this))
                    .on('get', this.getPowerState.bind(this));


				if(this.can_dim == true ) {
					lightbulbService.addCharacteristic(Characteristic.Brightness)
						.on('set', this.setdimValue.bind(this))
						.on('get', this.getdimValue.bind(this));
				
					// Register a listener
						eventEmitter.on(this.config.type + ":" + this.id + ":eventLevelState", function(value) {
							value = parseInt(value)*10
							eventCheckData.push(this.config.type + ":" + this.id + ":eventLevelState:" + value);
							lightbulbService.setCharacteristic(Characteristic.Brightness, value);
						}.bind(this));
				}
		
				
                // Register a listener
                eventEmitter.on(this.config.type + ":" + this.id + ":eventPowerState", function(value) {
					value = parseInt(value)
					if (value > 0){value = 1}
                    eventCheckData.push(this.config.type + ":" + this.id + ":eventPowerState:" + value);
                    PowerState.setValue(value);
                }.bind(this));
				
				
                services.push( lightbulbService );
                break;
            }

			case "Sensor": {
                var contactService = new Service.ContactSensor(this.name);
                var ContactState = contactService
                    .getCharacteristic(Characteristic.ContactSensorState)
                    .on('get', this.getSensorState.bind(this));
                // Register a listener
                eventEmitter.on(this.config.type + ":" + this.id + ":eventPowerState", function(value) {
					value = parseInt(value)
					if (value > 0){value = 1}
					value = 1 - value
                    eventCheckData.push(this.config.type + ":" + this.id + ":eventPowerState:" + value);
                    ContactState.setValue(value);
                }.bind(this));
                services.push( contactService );
                break;
            }
			
			case "Sensor3477": {
                var contactService3477 = new Service.ContactSensor(this.name);
                contactService3477
                    .getCharacteristic(Characteristic.ContactSensorState)
                    .on('get', this.getSensorState3477.bind(this));

                // Register a listener
                eventEmitter.on("Sensor:" + this.id + ":staus", function(value) {
					value = parseInt(value)
					contactService3477.updateCharacteristic(Characteristic.ContactSensorState, value);
                }.bind(this)); 
				
				
				this.contactService3477 = contactService3477  
                services.push( contactService3477 );
                break;
            }
			
			
			case "Sensor3477inv": {
                var contactService3477inv = new Service.ContactSensor(this.name);
                contactService3477inv
                    .getCharacteristic(Characteristic.ContactSensorState)
                    .on('get', this.getSensorState3477inv.bind(this));

                // Register a listener
                eventEmitter.on("Sensorreverse:" + this.id + ":staus", function(value) {
					value = parseInt(value)
                    contactService3477inv.setCharacteristic(Characteristic.ContactSensorState, value);
                }.bind(this)); 
			
				
				this.contactService3477inv = contactService3477inv  
                services.push( contactService3477inv );
                break;
            }
						

			
			case "Windows": {
                var WindowsService = new Service.WindowCovering(this.name);
                var CurrentPosition = WindowsService
                    .getCharacteristic(Characteristic.CurrentPosition)
                    .on('get', this.getCurrentPosition.bind(this));
                var TargetPosition = WindowsService
                    .getCharacteristic(Characteristic.TargetPosition)
                    .on('set', this.setTargetPosition.bind(this));
                var PositionState = WindowsService
                    .getCharacteristic(Characteristic.PositionState)
                    .on('get', this.getPositionState.bind(this));


                // Register a listener for event changes
                eventEmitter.on(this.config.type + ":" + this.id + ":eventState", function(value) {
					var position;
					var target;
               if( value == "0" ){
					position = 50
					target = 2
					}
                if( value == "1" ){
					position = 100
					target = 1
					}
                if( value == "2" ){
					position = 0
					target = 0
					}
					//console.log(this.id + "-" + position )
                    //eventCheckData.push(this.config.type + ":" + this.id + ":eventState:" + position);
					this.WindowsService.getCharacteristic(Characteristic.CurrentPosition).getValue(undefined);
					//this.WindowsService.getCharacteristic(Characteristic.TargetPosition).getValue(undefined);
					this.WindowsService.getCharacteristic(Characteristic.PositionState).getValue(undefined)
					
					this.WindowsService.setCharacteristic(Characteristic.TargetPosition, position);
					//CurrentPosition.setValue(position);
                    //TargetPosition.setValue(position);
					//PositionState.setValue(target)
                }.bind(this));
				
				this.WindowsService = WindowsService

                services.push( WindowsService );


			break;
            }
	
			
			case "WindowsAdvance": {
                var WindowsService = new Service.WindowCovering(this.name);
                var CurrentPosition = WindowsService
                    .getCharacteristic(Characteristic.CurrentPosition)
                    .on('get', this.getCurrentPositionADV.bind(this));
                var TargetPosition = WindowsService
                    .getCharacteristic(Characteristic.TargetPosition)
                    .on('set', this.setTargetPositionADV.bind(this));
                var PositionState = WindowsService
                    .getCharacteristic(Characteristic.PositionState)
                    .on('get', this.getPositionStateADV.bind(this));

                
				// Register a listener for event changes
                eventEmitter.on(this.config.type + ":" + this.id + ":eventPosition", function(value) {
					var position = parseInt(value,10);
                    //eventCheckData.push(this.config.type + ":" + this.id + ":eventState:" + position);
					this.WindowsService.setCharacteristic(Characteristic.CurrentPosition, position);
					this.WindowsService.setCharacteristic(Characteristic.TargetPosition, position);
					
                }.bind(this));
				
				
				
                // Register a listener for event changes
                eventEmitter.on(this.config.type + ":" + this.id + ":eventState", function(value) {
					//eventCheckData.push(this.config.type + ":" + this.id + ":eventState:" + position);
					this.WindowsService.getCharacteristic(Characteristic.PositionState).getValue(undefined)
                }.bind(this));				
				this.WindowsService = WindowsService

                services.push( WindowsService );


			break;
            }			
			
			
		
			case "Energy": {			
			
			var MeterDeviceService = new MyHome2Platform.MeterDeviceService(this.name);

            MeterDeviceService
				.getCharacteristic(MyHome2Platform.CurrentConsumption)
				.on('get', this.getCPower.bind(this));
				
			MeterDeviceService.addCharacteristic(MyHome2Platform.MonthConsumption)
				.on('get', this.getMPower.bind(this));

			MeterDeviceService.addCharacteristic(MyHome2Platform.YearConsumption)
				.on('get', this.getYPower.bind(this));
				
			MeterDeviceService.addCharacteristic(MyHome2Platform.TodayConsumption)
				.on('get', this.getDPower.bind(this));

				// Register a listener for event changes
                eventEmitter.on(this.config.type + ":" + this.id + ":eventPowerNow", function(value) {
					//this.MeterDeviceService.getCharacteristic(MyHome2Platform.CurrentConsumption).setValue(parseFloat(value))
					//lightbulbService.setCharacteristic(Characteristic.Brightness, value);
					//this.log("ENERGY ARRIVATA: " + value)
					this.MeterDeviceService.setCharacteristic(MyHome2Platform.CurrentConsumption, parseFloat(value));
                }.bind(this));	
				
				// Register a listener for event changes
                eventEmitter.on(this.config.type + ":" + this.id + ":eventPowerMonth", function(value) {
					//console.log("Conusmo per " + this.name + " -> " + value)
					this.MeterDeviceService.getCharacteristic(MyHome2Platform.MonthConsumption).setValue(parseFloat(value))
                }.bind(this));	
				
				// Register a listener for event changes
                eventEmitter.on(this.config.type + ":" + this.id + ":eventPowerToday", function(value) {
					
					this.MeterDeviceService.getCharacteristic(MyHome2Platform.TodayConsumption).setValue(parseFloat(value))
                }.bind(this));	
				
				// Register a listener for event changes
                eventEmitter.on(this.config.type + ":" + this.id + ":eventPowerTotal", function(value) {
					
					this.MeterDeviceService.getCharacteristic(MyHome2Platform.YearConsumption).setValue(parseFloat(value))
                }.bind(this));	
				
			this.MeterDeviceService = MeterDeviceService

            services.push(MeterDeviceService);
            break;
            }			
			
			
			case "Outlets": {
            var OutletsService = new Service.Outlet(this.name);
            var PowerState = OutletsService
                .getCharacteristic(Characteristic.On)
                .on('set', this.setPowerState.bind(this))
                .on('get', this.getPowerState.bind(this));
				
                // Register a listener
                eventEmitter.on(this.config.type + ":" + this.id + ":eventPowerState", function(value) {
					value = parseInt(value)
					if (value > 0){value = 1}
                    eventCheckData.push(this.config.type + ":" + this.id + ":eventPowerState:" + value);
                    PowerState.setValue(value);
                }.bind(this));
				
				
				
            services.push( OutletsService );
            break;
            }

			case "TemperatureSensors": {
            var TemperatureSensorService = new Service.TemperatureSensor(this.name);
            TemperatureSensorService
                .getCharacteristic(Characteristic.CurrentTemperature)
				.setProps({
                    minValue: -100,
                    maxValue: 100
                })
                .on('get', this.getTemperatureExternal.bind(this));
            services.push( TemperatureSensorService );
            break;
            }

			case "TemperatureSensorsInternal": {
            var TemperatureSensor = new Service.TemperatureSensor(this.name);
            TemperatureSensor
                .getCharacteristic(Characteristic.CurrentTemperature)
                .on('get', this.getTemperatureNoControlled.bind(this));
            services.push( TemperatureSensor );
            break;
            }
			

			case "Door": {
            var DoorService = new Service.LockMechanism(this.name);
            DoorService
                .getCharacteristic(Characteristic.LockCurrentState)
                .on('get', this.getLockCurrentState.bind(this));
				
            DoorService
				.getCharacteristic(Characteristic.LockTargetState)
				.on('get', this.getLockTargetState.bind(this))
				.on('set', this.setLockTargetState.bind(this));
				
            this.DoorService = DoorService
			services.push( DoorService );
            break;
            }
			
			
			case "SecuritySystem": {
				var AllarmService = new Service.SecuritySystem(this.name);
				AllarmService
					.addCharacteristic(Characteristic.StatusLowBattery)
					.on('get', this.getBatteryLevel.bind(this));
				AllarmService
					.getCharacteristic(Characteristic.SecuritySystemCurrentState)
					.on('get', this.getAlarmState.bind(this));	
				AllarmService
					.getCharacteristic(Characteristic.SecuritySystemTargetState)
					.on('get', this.getAlarmState.bind(this))
					.on('set', this.setAlarmState.bind(this));
				
				if(this.ZONA1) {
					AllarmService.addCharacteristic(MyHome2Platform.Zone1)
					.on('get', this.getZona1.bind(this));
					}
				if(this.ZONA2) {
					AllarmService.addCharacteristic(MyHome2Platform.Zone2)
					.on('get', this.getZona2.bind(this));
					}
				if(this.ZONA3) {
					AllarmService.addCharacteristic(MyHome2Platform.Zone3)
					.on('get', this.getZona3.bind(this));
					}
				if(this.ZONA4) {
					AllarmService.addCharacteristic(MyHome2Platform.Zone4)
					.on('get', this.getZona4.bind(this));
					}
				if(this.ZONA5) {
					AllarmService.addCharacteristic(MyHome2Platform.Zone5)
					.on('get', this.getZona5.bind(this));
					}
				if(this.ZONA6) {
					AllarmService.addCharacteristic(MyHome2Platform.Zone6)
					.on('get', this.getZona6.bind(this));
					}
				if(this.ZONA7) {
					AllarmService.addCharacteristic(MyHome2Platform.Zone7)
					.on('get', this.getZona7.bind(this));
					}
				if(this.ZONA8) {
					AllarmService.addCharacteristic(MyHome2Platform.Zone8)
					.on('get', this.getZona8.bind(this));
					}

				// Register a listener for event changes
                eventEmitter.on(this.config.type + ":" + "1" + ":eventAllarm", function(value) {
					value = parseInt(value)
					this.AllarmService.getCharacteristic(Characteristic.SecuritySystemCurrentState).setValue(value)
					//this.AllarmService.getCharacteristic(Characteristic.SecuritySystemTargetState).setValue(value)
					
                }.bind(this));	
	

				if(this.ZONA1) {
					// Register a listener for event changes
					eventEmitter.on(this.config.type + ":" + "1" + ":eventZone", function(value) {
						this.AllarmService.getCharacteristic(MyHome2Platform.Zone1).setValue(this.ZONA1 + " - " + value)
					}.bind(this));						
				}
				
				if(this.ZONA2) {
					// Register a listener for event changes
					eventEmitter.on(this.config.type + ":" + "2" + ":eventZone", function(value) {
						this.AllarmService.getCharacteristic(MyHome2Platform.Zone2).setValue(this.ZONA2 + " - " + value)
					}.bind(this));						
				}
								
				if(this.ZONA3) {
					// Register a listener for event changes
					eventEmitter.on(this.config.type + ":" + "3" + ":eventZone", function(value) {
						this.AllarmService.getCharacteristic(MyHome2Platform.Zone3).setValue(this.ZONA3 + " - " + value)
					}.bind(this));						
				}
				
				if(this.ZONA4) {
					// Register a listener for event changes
					eventEmitter.on(this.config.type + ":" + "4" + ":eventZone", function(value) {
						this.AllarmService.getCharacteristic(MyHome2Platform.Zone4).setValue(this.ZONA4 + " - " + value)
					}.bind(this));						
				}	

				if(this.ZONA5) {
					// Register a listener for event changes
					eventEmitter.on(this.config.type + ":" + "5" + ":eventZone", function(value) {
						this.AllarmService.getCharacteristic(MyHome2Platform.Zone5).setValue(this.ZONA5 + " - " + value)
					}.bind(this));						
				}	

				if(this.ZONA6) {
					// Register a listener for event changes
					eventEmitter.on(this.config.type + ":" + "6" + ":eventZone", function(value) {
						this.AllarmService.getCharacteristic(MyHome2Platform.Zone6).setValue(this.ZONA6 + " - " + value)
					}.bind(this));						
				}	

				if(this.ZONA7) {
					// Register a listener for event changes
					eventEmitter.on(this.config.type + ":" + "7" + ":eventZone", function(value) {
						this.AllarmService.getCharacteristic(MyHome2Platform.Zone7).setValue(this.ZONA7 + " - " + value)
					}.bind(this));						
				}	

				if(this.ZONA8) {
					// Register a listener for event changes
					eventEmitter.on(this.config.type + ":" + "8" + ":eventZone", function(value) {
						this.AllarmService.getCharacteristic(MyHome2Platform.Zone8).setValue(this.ZONA8 + " - " + value)
					}.bind(this));						
				}	






				
	/*			AllarmService	//ZoneStatus
					.addCharacteristic(Bypass)
					.on('get', this.getBypassState.bind(this))
					.on('set', this.setBypassState.bind(this));
	*/				
					
				this.AllarmService = AllarmService
				services.push( AllarmService );
				break;
            }			
			
			

		case "Thermostat":
		case "SAThermoHC":
		case "SAThermoH":
		case "SAThermoC":
		case "4ZThermo":
		{
            var ThermostatService = new Service.Thermostat(this.name);
			
			ThermostatService.getCharacteristic(Characteristic.CurrentTemperature)
			.setProps({minValue: -50, minStep: 0.1, maxValue: 50})
			.on('get', this.getTemperature.bind(this));
	
			ThermostatService.getCharacteristic(Characteristic.TargetTemperature)
				.setProps({minValue: 0})
				.on('get', this.getThermostatTargetTemperature.bind(this))
				.on('set', this.setThermostatTargetTemperature.bind(this));
		
			ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState)
				.on('get', this.getThermostatCurrentHeatingCoolingState.bind(this))
				.on('set', this.setThermostatCurrentHeatingCoolingState.bind(this));

			ThermostatService.getCharacteristic(Characteristic.TargetHeatingCoolingState)
				.on('get', this.getThermostatTargetHeatingCoolingState.bind(this))
				.on('set', this.setThermostatTargetHeatingCoolingState.bind(this));
				
			ThermostatService.getCharacteristic(Characteristic.TemperatureDisplayUnits)
				.on('get', this.getThermostatTemperatureDisplayUnits.bind(this));

			// Register a listener for event changes
                eventEmitter.on("Thermostat:" + this.id + ":termo_now", function(value) {
					var position = parseFloat(value);
					this.ThermostatService.updateCharacteristic(Characteristic.CurrentTemperature , position);
                }.bind(this));

                eventEmitter.on("Thermostat:" +  this.id + ":termo_setpoint_corrected", function(value) {
					var position = parseFloat(value);
					this.ThermostatService.updateCharacteristic(Characteristic.TargetTemperature, position);
                }.bind(this));

                eventEmitter.on("Thermostat:" + this.id + ":termo_status", function(value) {
					var position = parseFloat(value);
					this.ThermostatService.updateCharacteristic(Characteristic.CurrentHeatingCoolingState, position);
					this.ThermostatService.updateCharacteristic(Characteristic.TargetHeatingCoolingState, position);
					//this.ThermostatService.getCharacteristic(Characteristic.CurrentHeatingCoolingState).getValue(undefined)
                }.bind(this));	
				

            this.ThermostatService = ThermostatService
			services.push( ThermostatService );
            break;
            }
			
		case "Button": {
            var ButtonService = new Service.Switch(this.name);
            var PowerState = ButtonService
                .getCharacteristic(Characteristic.On)
                .on('set', this.setButtonState.bind(this))
                .on('get', this.getPowerState.bind(this));
				
                // Register a listener
                eventEmitter.on(this.config.type + ":" + this.id + ":eventPowerState", function(value) {
					value = parseInt(value)
					if (value > 0){value = 1}
                    eventCheckData.push(this.config.type + ":" + this.id + ":eventPowerState:" + value);
                    PowerState.setValue(value);
                }.bind(this));
				
				
				
            services.push( ButtonService );
            break;
            }			
			
		case "Cen": {
            var CenService = new Service.Switch(this.name);
            CenService
                .getCharacteristic(Characteristic.On)
                .on('set', this.setCenState.bind(this))
                .on('get', this.getCenState.bind(this));
			this.CenService = CenService
			services.push( CenService );
            break;
            }

		case "Switch": {
            var SwitchService = new Service.Switch(this.name);
            var PowerState = SwitchService
                .getCharacteristic(Characteristic.On)
                .on('set', this.setPowerState.bind(this))
                .on('get', this.getPowerState.bind(this));
				
                // Register a listener
                eventEmitter.on(this.config.type + ":" + this.id + ":eventPowerState", function(value) {
					value = parseInt(value)
					if (value > 0){value = 1}
                    eventCheckData.push(this.config.type + ":" + this.id + ":eventPowerState:" + value);
                    PowerState.setValue(value);
                }.bind(this));
				
				
				
            services.push( SwitchService );
            break;
            }
			
        case "F523": {
            var F523Service = new MyHome2Platform.F523(this.name);
			F523Service.getCharacteristic(MyHome2Platform.Forcing)
				.on('set', this.setForcing.bind(this))
				.on('get', this.getForcing.bind(this));
			
			F523Service.addCharacteristic(MyHome2Platform.Disabling);
				//.on('get', this.getDisabled.bind(this));

			F523Service.addCharacteristic(MyHome2Platform.Protection);
				//.on('get', this.getProtection.bind(this));

			F523Service.addCharacteristic(MyHome2Platform.Threshold);
				//.on('get', this.getThreshold.bind(this));

			this.F523Service = F523Service
			services.push(F523Service);
            break;
            }
			
        case "F522": {
            var F522Service = new MyHome2Platform.F522(this.name);
			F522Service.getCharacteristic(MyHome2Platform.F522Forcing)
				.on('set', this.setF522Forcing.bind(this))
				.on('get', this.getF522Forcing.bind(this));
			
			F522Service.addCharacteristic(MyHome2Platform.F522Disabling);
				//.on('get', this.getF522Disabled.bind(this));

			F522Service.addCharacteristic(MyHome2Platform.F522Protection);
				//.on('get', this.getF522Protection.bind(this));

			F522Service.addCharacteristic(MyHome2Platform.F522Threshold);
				//.on('get', this.getF522Threshold.bind(this));

			F522Service.addCharacteristic(MyHome2Platform.F522Now)
				.on('get', this.getF522Now.bind(this));

				
			// Register a listener for event changes
                eventEmitter.on(this.config.type + ":" + this.id + ":eventPowerNow", function(value) {
					this.F522Service.getCharacteristic(MyHome2Platform.F522Now).setValue(value)
                }.bind(this));	
	
				
				
				
				
			this.F522Service = F522Service
			services.push(F522Service);
            break;
            }


		case "Audio": {

            var speakerService = new Service.Speaker(this.name);
            speakerService.getCharacteristic(Characteristic.Mute)
                .on("get", this.getMuteState.bind(this))
                .on("set", this.setMuteState.bind(this));

            speakerService
                .addCharacteristic(new Characteristic.Volume())
                .on("get", this.getVolume.bind(this))
                .on("set", this.setVolume.bind(this));

 
            /*
            if(this.audio_home){
            speakerService.addCharacteristic(new Characteristic.On())
                .on("get", this.getMuteState2.bind(this))
                .on("set", this.setMuteState2.bind(this));
                
            speakerService.addCharacteristic(new Characteristic.Brightness())
                .on("get", this.getVolume.bind(this))
                .on("set", this.setVolume.bind(this)); 
                
            } 
            */
            
            speakerService.addCharacteristic(MyHome2Platform.CurrentTrack)
                .on('get', this.getCurrentTrack.bind(this));
                
            speakerService.addCharacteristic(MyHome2Platform.ChangeTrack)
                .on('get', callback => callback(null, false))
                .on('set', this.setTrack.bind(this));              
            
                
            if(this.Source1) {    
                speakerService.addCharacteristic(MyHome2Platform.Source1)
                    .on('set', this.setSource1.bind(this)); 
            }

            if(this.Source2) {   
                speakerService.addCharacteristic(MyHome2Platform.Source2)
                .on('set', this.setSource2.bind(this)); 
            }
            
            if(this.Source3) {              
            speakerService.addCharacteristic(MyHome2Platform.Source3)
                .on('set', this.setSource3.bind(this)); 
            }

            if(this.Source4) {                   
            speakerService.addCharacteristic(MyHome2Platform.Source4)
                .on('set', this.setSource4.bind(this)); 
            }
            
            //Register a listener for event changes
                eventEmitter.on("Radio:0:Frequence", function(value) {
                    this.speakerService.updateCharacteristic(MyHome2Platform.CurrentTrack, value);
                }.bind(this));	            
 
                eventEmitter.on(this.config.type + ":" + this.id + ":eventStatus", function(value) {
                    value = 1 - parseInt(value)
                    this.speakerService.updateCharacteristic(Characteristic.Mute, value);
                }.bind(this)); 
            
                 eventEmitter.on(this.config.type + ":" + this.id + ":eventVolume", function(value) {
                    value = parseInt(value)
                    this.speakerService.updateCharacteristic(Characteristic.Volume, value);
                }.bind(this));     


                eventEmitter.on(this.config.type + ":" + this.id + ":eventSource", function(value) {
                    if(this.Source1) {this.speakerService.updateCharacteristic(MyHome2Platform.Source1, 0)}
                    if(this.Source2) {this.speakerService.updateCharacteristic(MyHome2Platform.Source2, 0)}
                    if(this.Source3) {this.speakerService.updateCharacteristic(MyHome2Platform.Source3, 0)}
                    if(this.Source4) {this.speakerService.updateCharacteristic(MyHome2Platform.Source4, 0)}
                    
                    if (value == "1" && this.Source1){
                        this.speakerService.updateCharacteristic(MyHome2Platform.Source1, 1)
                    }
                    
                    if (value == "2" && this.Source2){
                        this.speakerService.updateCharacteristic(MyHome2Platform.Source2, 1)
                    }                
     
                    if (value == "3" && this.Source3){
                        this.speakerService.updateCharacteristic(MyHome2Platform.Source3, 1)
                    } 
                    
                    if (value == "4" && this.Source4){
                        this.speakerService.updateCharacteristic(MyHome2Platform.Source4, 1)
                    }    
                }.bind(this));     



                
            
            
            this.speakerService = speakerService            
            services.push( speakerService );
            break;
            }
			
			case "Sprinkler": {
                
                var sprinkler = new Service.Valve(this.name);
                 sprinkler
                    .getCharacteristic(Characteristic.ValveType)
                    .on('get', this.getValveType.bind(this)); 
                    
                sprinkler
                    .getCharacteristic(Characteristic.Active)
                    .on('set', this.setPowerState.bind(this))
                    .on('get', this.getPowerState.bind(this));
                    
                sprinkler
                    .getCharacteristic(Characteristic.InUse)
                    .on('set', this.setPowerState.bind(this))
                    .on('get', this.getPowerState.bind(this)); 

                sprinkler.addCharacteristic(Characteristic.SetDuration)
                    .on('get', callback => callback(null, false))
                    .on('set', this.setDuration.bind(this));              
                
                 sprinkler.addCharacteristic(Characteristic.RemainingDuration)
                    .on('get', this.getDuration.bind(this));                  
                


                // Register a listener
                eventEmitter.on("Lightbulb:" + this.id + ":eventPowerState", function(value) {
					value = parseInt(value)
                    this.sprinkler.updateCharacteristic(Characteristic.Active, value);
                    this.sprinkler.updateCharacteristic(Characteristic.InUse, value);
                }.bind(this));
                
                eventEmitter.on("Timer:" + this.id + ":eventTimer", function(value) {
					value = parseInt(value)
                    this.sprinkler.updateCharacteristic(Characteristic.RemainingDuration, value);
                }.bind(this));               
                
                
				
				
			this.sprinkler = sprinkler  
            services.push( sprinkler );
            break;
            }			
			
			
			

        }// fine tipi

        return services;
    }
}