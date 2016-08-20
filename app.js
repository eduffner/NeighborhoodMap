var places = [];
var generateNonce = function(length) {
	    var text = "";
	    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	    for(var i = 0; i < length; i++) {
	        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}
	var YELP_CONSUMER_KEY = '1HP-WDHGUoW_QTe1rH2iVA';
	var YELP_TOKEN = 'FCh6y8zzf_LV-_fyCL2WGjVkL7fTVXwE';	
	var YELP_CONSUMER_SECRET = 'PqeCZh5pA2GLbO8q-wXx2EIM8LA';
	var YELP_TOKEN_SECRET = 'ULjel3EA4z_tYxfjHmjdudjp91A';


	var yelpBaseURL = 'http://api.yelp.com/v2/search';

	var parameters = {
		callback: 'cb',
		limit: '15',
		location: '60657',
		oauth_consumer_key: YELP_CONSUMER_KEY,
		oauth_nonce: generateNonce(),
		oauth_signature_method: 'HMAC-SHA1',
		oauth_timestamp: Math.floor(Date.now()/1000),
		oauth_token: YELP_TOKEN,
		oauth_version : '1.0',
		term: 'bars',
    };

    var encodedSignature = oauthSignature.generate('GET',yelpBaseURL, parameters, YELP_CONSUMER_SECRET, YELP_TOKEN_SECRET);
    parameters.oauth_signature = encodedSignature;

	var settings = {
		url: yelpBaseURL,
		data: parameters,
		cache: true,
		dataType: 'jsonp',
		success: function(results) {
			console.log(results);
			for (i=0;i<results['businesses'].length;i++){
				business = results['businesses'][i];
				places.push(business);
			}
			ko.applyBindings( new ViewModel() );	
		},
		fail: function() {
			// Do stuff on fail
			console.log('AJAX request has failed :(');
		}
	};

	$.ajax(settings);


var Place = function(map, data) {
	var self = this;

	this.name = data['name'];

	var addr = data['location']['display_address'];
	this.addr = addr[0];
	this.city = addr[2];

	if (typeof this.city == 'undefined'){
		this.city = "Chicago, IL";
	}


	var lat = data['location']['coordinate']['latitude'];
	var lng = data['location']['coordinate']['longitude'];

	this.coords = new google.maps.LatLng(lat, lng);

	this.marker = new google.maps.Marker({
		position: this.coords,
		title: this.name,
		animation: null,
		map: map,
	});
	this.marker.addListener('click', function() {
          		infowindow.open(map, self.marker);
          	});

	var stars;
	var numStars = data['rating_img_url'];
	
	var contentString = '<div id="content">' +
		'<h1 id="heading">'+this.name+'</h1>'+
        '<div id="bodyContent">'+
        '<p>'+this.addr+'</p>'+
        '<p>'+this.city+'</p>'+
        '<p><img src="'+numStars+'">'+
        '<a href src="'+data['url']+'"</a>'+data['review_count']+'</a> reviews</p>' +
        '<p><img src="images/yelp-logo-small.png" style="width:40px;"></p>' +
        '</div>'+
        '</div>';

	var infowindow = new google.maps.InfoWindow({
          content: contentString
    });


  	this.isVisible = ko.observable(false);

	this.isVisible.subscribe(function(currentState) {
		if (!currentState) {
			self.marker.setMap(null);
		}
		else {
			if(self.marker)
				self.marker.setMap(map);
		}
	});

	this.isVisible(true);
	
};

var ViewModel = function() {
	var self = this;

	self.placeList = ko.observableArray([]);

	toggleBounce = function(marker){
		if (marker.animation == null){
			marker.setAnimation(google.maps.Animation.BOUNCE);
			setTimeout(function(){
				marker.setAnimation(null);

			}, 5000);
		}
		else {
			marker.setAnimation(null);
		}
	};

	var mapDiv = document.getElementById('map');
	var map = new google.maps.Map(mapDiv, {
		center: {lat: 41.94303, lng: -87.64657},
		zoom: 13,
		scrollwheel: false,
        mapTypeControl: false,
        streetViewControl: false,
        scaleControl: false,
        rotateControl: false,
        zoomControl: false,
	});

	places.forEach(function(placeItem){
		self.placeList.push( new Place(map, placeItem) );
	});
	

	self.placeSearch = ko.observable('');

	this.filteredPlaces = ko.computed(function() {
		var filter = self.placeSearch().toLowerCase();
	    if (!filter) {
	        return ko.utils.arrayFilter(self.placeList(), function(item) {
	        	item.isVisible(true);
	        	return true;
	        });
	    } else {
	        return ko.utils.arrayFilter(self.placeList(), function(item) {
	        	var doesMatch = item.name.toLowerCase().indexOf(filter) !== -1;
	        	item.isVisible(doesMatch);
        		return doesMatch;    
	        });
	    }

	});

};

