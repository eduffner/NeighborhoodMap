var map, infoWindow;
var generateNonce = function(length) {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

var YELP_CONSUMER_KEY = "1HP-WDHGUoW_QTe1rH2iVA";
var YELP_TOKEN = "FCh6y8zzf_LV-_fyCL2WGjVkL7fTVXwE";
var YELP_CONSUMER_SECRET = "PqeCZh5pA2GLbO8q-wXx2EIM8LA";
var YELP_TOKEN_SECRET = "ULjel3EA4z_tYxfjHmjdudjp91A";


var yelpBaseURL = "https://api.yelp.com/v2/search";

var parameters = {
    callback: 'cb',
    limit: '15',
    location: '60657',
    oauth_consumer_key: YELP_CONSUMER_KEY,
    oauth_nonce: generateNonce(),
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: Math.floor(Date.now()/1000),
    oauth_token: YELP_TOKEN,
    oauth_version: '1.0',
    term: 'bars'
};

var encodedSignature = oauthSignature.generate('GET',yelpBaseURL, parameters, YELP_CONSUMER_SECRET, YELP_TOKEN_SECRET);
parameters.oauth_signature = encodedSignature;

var places = new Array(15);
var settings = {
    url: yelpBaseURL,
    data: parameters,
    cache: true,
    dataType: 'jsonp',
    success: function(results) {
        console.log(results);
        results['businesses'].forEach(function(place) {
            places.push( new Place(place) );
        });
        ko.applyBindings(new ViewModel());
    },
    timeout: 3000
};

$.ajax(settings).fail(function(err){
    console.log(err);
    if(!alert("Accessing the Yelp API failed. Please refresh the page and try again.")){
        window.location.reload();
    }
});

var Place = function(data) {
    var self = this;

    this.name = data.name;

    var addr = data.location.display_address;
    this.addr = addr[0];
    this.city = addr[2];

    if (typeof this.city == 'undefined'){
        this.city = "Chicago, IL";
    }


    var lat = data.location.coordinate.latitude;
    var lng = data.location.coordinate.longitude;

    this.coords = new google.maps.LatLng(lat, lng);

    this.marker = new google.maps.Marker({
        position: this.coords,
        title: this.name,
        animation: null,
        map: map
    });

    Place.prototype.toggleBounce = function() {        
        var marker = this.marker;
        if (marker.animation === null){
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(function(){
                marker.setAnimation(null);
            }, 5000);
        }
        else {
            marker.setAnimation(null);
        }
    };

    var stars;
    var numStars = data.rating;
    var ratingUrl = data.rating_img_url;

    this.contentString = '<div id="content">' +
        '<h1 id="heading">'+this.name+'</h1>'+
        '<div id="bodyContent">'+
        '<p>'+this.addr+'</p>'+
        '<p>'+this.city+'</p>'+
        '<p> <img src="'+ratingUrl+'">'+numStars+'/5 from '+
        '<p><a href="'+data.url+'" target="_blank">'+data.review_count+'</a> reviews</p>' +
        '<p><img src="images/yelp-logo-small.png" style="width:40px;"></p>' +
        '</div>'+
        '</div>';

    Place.prototype.showInfo = function(info) {
        // toggle the bounce
        this.toggleBounce();
        // open the info window 
        infoWindow.setContent(this.contentString);
        infoWindow.open(map, this.marker);
    }

    this.marker.addListener('click', function() {
        self.showInfo(this.contentString);
    });

    this.isVisible = ko.observable(false);

    this.isVisible.subscribe(function(currentState) {
        if (!currentState) {
            self.marker.setMap(null);
        }
        else {
            if(self.marker){
                self.marker.setMap(map);
            }
        }
    });

    this.isVisible(true);
};

var ViewModel = function() {
    var self = this;

    self.placeList = ko.observableArray([]);

    places.forEach(function(place){
        self.placeList.push(place);
    });

    console.log(placeList);

    self.placeSearch = ko.observable('');

    this.filteredPlaces = ko.computed(function() {
        var filter = self.placeSearch().toLowerCase();
        return ko.utils.arrayFilter(self.placeList(), function(item) {
            var doesMatch = item.name.toLowerCase().indexOf(filter) !== -1;
            item.isVisible(doesMatch);
            return doesMatch;
        });
    });


};

function initMap() {
    var mapDiv = document.getElementById('map');
    map = new google.maps.Map( mapDiv, {
        center: {lat: 41.94303, lng: -87.64657},
        zoom: 13,
        scrollwheel: false,
        mapTypeControl: false,
        streetViewControl: false,
        scaleControl: false,
        rotateControl: false,
        zoomControl: false
    });
    infoWindow = new google.maps.InfoWindow();
}

