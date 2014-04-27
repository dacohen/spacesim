var ge;
var rocket = {
	altitude: 0,
	heading: 90,
	tilt: 0,
	roll: 0,
	latitude: 28.608397,
	longitude: -80.604345,
	mass: 2800000,
	maxThrust: 34020000,
	thrust: 9.8 * 2800000,
	Cd: 0.5,
	velocity : {
		x: 0,
		y: 0,
		z: 0
	},
	model: 0
};

var viewport = {
	tilt: 90,
	deltaT: (1 / 30.0),
	R: 6371000.0
};

google.load("earth", "1", {"other_params":"sensor=false"});

function init() {
	google.earth.createInstance("viewport", initCB, failureCB);
}

function toRadians(angle) {
	return angle * (Math.PI / 180);
}

function toDegrees(angle) {
	return angle * (180 / Math.PI);
}


function tickAnimation() {
	var g = (6.67 * Math.pow(10, -11) * 5.97 * Math.pow(10, 24)) / Math.pow(rocket.altitude + viewport.R, 2);
	var Vhoriz = Math.sqrt(Math.pow(rocket.velocity.x, 2) + Math.pow(rocket.velocity.y, 2));
	
	var rho = 1.225 * Math.pow(1 - ((0.065 * rocket.altitude) / 288.15), (9.81 * 0.0289644) / (8.314 * 0.065));
	var verticalDragForce = 0.5 * rho 
		* Math.pow(rocket.velocity.z, 2)
		* 0.5 * Math.PI * Math.pow(10.1, 2);
	
	var verticalForce = rocket.thrust * Math.cos(toRadians(rocket.tilt)) 
		- rocket.mass * g + ((rocket.mass * Math.pow(Vhoriz, 2)) / (rocket.altitude + viewport.R));
	var horizontalForce = rocket.thrust * Math.sin(toRadians(rocket.tilt));
	var oneLat = 110000.0;
	var oneLon = viewport.R * Math.cos(toRadians(rocket.latitude));

	rocket.velocity.z += (verticalForce / rocket.mass);
	rocket.velocity.y += ((horizontalForce * Math.cos(toRadians(rocket.heading))) / rocket.mass);
	rocket.velocity.x += ((horizontalForce * Math.sin(toRadians(rocket.heading))) / rocket.mass);
	
	rocket.altitude += rocket.velocity.z * viewport.deltaT;
	rocket.latitude += toDegrees(rocket.velocity.y / oneLat) * viewport.deltaT;
	rocket.longitude += toDegrees(rocket.velocity.x / oneLon) * viewport.deltaT;
	
	console.info("Altitude: " + rocket.altitude / 1000);
	console.info("Velocity: " + Vhoriz);
	console.info("Orbital Speed: " + Math.sqrt(6.67 * Math.pow(10, -11) * 5.97 * Math.pow(10, 24) / (rocket.altitude + viewport.R)));
	
	drawVehicle();
}

function initCB(instance) {
	ge = instance;
	ge.getWindow().setVisibility(true);
	ge.getOptions().setFlyToSpeed(ge.SPEED_TELEPORT);
	ge.getOptions().setMouseNavigationEnabled(false);
	
	
	google.earth.addEventListener(ge, 'frameend', tickAnimation);
		
	var mouseDown = false;
	var startX = 0;
	var startY = 0;
	window.addEventListener("mousedown", function(event) {
	    mouseDown = true;
		startX = event.pageX;
		startY = event.pageY;
	}, false);
	window.addEventListener("mousemove", function(event) {
		if (mouseDown) {
			var deltaX = event.pageX - startX;
			var deltaY = event.pageY - startY;
			if (Math.abs(deltaY) > Math.abs(deltaX)) {
				if (deltaY > 0) {
					viewport.tilt += 2;
				} else {
					viewport.tilt -= 2;
				}
			}
		}
	}, false);
	window.addEventListener("mouseup", function(event){
		mouseDown = false;
	}, false);
	
	window.addEventListener("keydown", function(event) {
		var code = event.keyCode ? event.keyCode : event.which;
		if (code == 38) {
			rocket.tilt -= 1;
		} else if (code == 40) {
			rocket.tilt += 1;
		} else if (code == 37) {
			rocket.heading -= 1;
		} else if (code == 39) {
			rocket.heading += 1;
		} else if (code == 32) {
			if (rocket.thrust < rocket.maxThrust) {
				alert("Ignition!");
				rocket.thrust = rocket.maxThrust;
			} else {
				rocket.thrust = 0;
			}
		}
	}, false);
	
	placeVehicle();
	tickAnimation();
	
}

function drawVehicle() {

	// get center look at location
	var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
	
	// Placemark/Model/Location
	var loc = ge.createLocation('');
	loc.setLatitude(rocket.latitude);
	loc.setLongitude(rocket.longitude);
	loc.setAltitude(rocket.altitude);
	rocket.model.setAltitudeMode(ge.ALTITUDE_RELATIVE_TO_GROUND);
	rocket.model.setLocation(loc);
	rocket.model.getOrientation().setTilt(rocket.tilt);
	rocket.model.getOrientation().setRoll(rocket.roll);
	rocket.model.getOrientation().setHeading(rocket.heading);

	if (viewport.tilt > 90) {
		viewport.tilt = 90;
	}
	
	if (viewport.tilt < 0) {
		viewport.tilt = 0;
	}

	// zoom into the model
	lookAt.setRange(500);
	lookAt.setTilt(viewport.tilt);
	lookAt.setLatitude(loc.getLatitude());
	lookAt.setLongitude(loc.getLongitude());
	lookAt.setAltitude(rocket.altitude + 30);
	ge.getView().setAbstractView(lookAt);
	
	var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);
	
	
}

function placeVehicle() {
	// Placemark
	var placemark = ge.createPlacemark('');
	placemark.setName('model');

	// Placemark/Model (geometry)
	rocket.model = ge.createModel('');
	placemark.setGeometry(rocket.model);

	// Placemark/Model/Link
	var link = ge.createLink('');
	link.setHref('http://localhost:3000/models/SaturnV.dae');
	rocket.model.setLink(link);

	// get center look at location
	var lookAt = ge.getView().copyAsLookAt(ge.ALTITUDE_RELATIVE_TO_GROUND);
	//var camera = ge.getView().copyAsCamera(ge.ALTITUDE_RELATIVE_TO_GROUND);

	// Placemark/Model/Location
	var loc = ge.createLocation('');
	loc.setLatitude(rocket.latitude);
	loc.setLongitude(rocket.longitude);
	loc.setAltitude(rocket.altitude);
	rocket.model.setAltitudeMode(ge.ALTITUDE_RELATIVE_TO_GROUND);
	rocket.model.setLocation(loc);

	// add the model placemark to Earth
	ge.getFeatures().appendChild(placemark);

	// zoom into the model
	lookAt.setRange(200);
	lookAt.setTilt(90);
	lookAt.setLatitude(loc.getLatitude());
	lookAt.setLongitude(loc.getLongitude());
	lookAt.setAltitude(loc.getAltitude() + 30);
	ge.getView().setAbstractView(lookAt);
}


function failureCB(errorCode) {
	alert(errorCode);
}

google.setOnLoadCallback(init);
