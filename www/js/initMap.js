$(document).ready(function() {


    // Change filters event
    $("select").change(function() {
        var from = $("#filterFrom").val()
        var to = $("#filterTo").val()
        initData(window.DRCData, from, to)
        $("#filterTo>option").map(function() {
            console.log($(this).val(), parseInt(from))
            if ($(this).val() > parseInt(from)) {
                $(this).attr('disabled')
            } else {
                $("#errFilter").fadeOut()
            }
        });
    });



    $.get("db/dataprototypedashboardwithlatlon.json", function(data) {
        $(".result").html(data);
        // Data raw
        initData(data.rows)

    });


    function initData(data, from, to) {


        var DRCData = data;
        window.DRCData = DRCData
        var dataLocations = [];
        var dataDestirnations = []
            // Route and markers quantity loop ( 20 is ok )
        for (var i = 0; i <= 200; i++) {

            if (from && to) {
                if (DRCData[i].quarter >= parseInt(from) && DRCData[i].quarter <= parseInt(to)) {
                    if (dataDestirnations.length == 20 && dataLocations.length == 20) {
                        break
                    };
                    // Markers
                    dataLocations.push(generateLocation(DRCData[i]))
                        // Routes
                    dataDestirnations.push(generateDestirnation(DRCData[i]));

                }
            } else {
                if (i == 20) {
                    break
                };
                // Markers
                dataLocations.push(generateLocation(DRCData[i]))
                    // Routes
                dataDestirnations.push(generateDestirnation(DRCData[i]));
            }

        };

        dataDestirnations.push(generateDestirnation('default'));
        initializeMap(dataLocations, dataDestirnations);
    }

});




// Generate destirnation data for polyline generation

function generateDestirnation(data) {

    var dataDestirnationObj = {}

    if (data === 'default') {

        var markerDestirnation = new google.maps.LatLng(-3.693714, 23.991271);
        dataDestirnationObj.location = markerDestirnation;
        dataDestirnationObj.country = 'Democratic republic of Congo';
    } else {
        var markerDestirnation = new google.maps.LatLng(data.lat, data.lon);
        dataDestirnationObj.location = markerDestirnation;
        dataDestirnationObj.country = data.destination_country;
    }
    return dataDestirnationObj

}

// Generate location date

function generateLocation(data) {

    var dataLocation = {}
    dataLocation.country = data.destination_country
    dataLocation.location = [
        new google.maps.LatLng(-3.693714, 23.991271),
        new google.maps.LatLng(data.lat, data.lon)

    ]

    return dataLocation

}


// Map initialization


function initializeMap(dataLocations, dataDestirnations) {

    var mapOptions = {
        center: dataDestirnations[dataDestirnations.length - 1].location,
        zoom: 3,
        mapTypeId: google.maps.MapTypeId.ROADMAP,

        styles: [{
            "featureType": "landscape",
            "stylers": [{
                "saturation": -100
            }, {
                "lightness": 65
            }, {
                "visibility": "on"
            }]
        }, {
            "featureType": "poi",
            "stylers": [{
                "saturation": -100
            }, {
                "lightness": 51
            }, {
                "visibility": "simplified"
            }]
        }, {
            "featureType": "road.highway",
            "stylers": [{
                "saturation": -100
            }, {
                "visibility": "simplified"
            }]
        }, {
            "featureType": "road.arterial",
            "stylers": [{
                "saturation": -100
            }, {
                "lightness": 30
            }, {
                "visibility": "on"
            }]
        }, {
            "featureType": "road.local",
            "stylers": [{
                "saturation": -100
            }, {
                "lightness": 40
            }, {
                "visibility": "on"
            }]
        }, {
            "featureType": "transit",
            "stylers": [{
                "saturation": -100
            }, {
                "visibility": "simplified"
            }]
        }, {
            "featureType": "administrative.province",
            "stylers": [{
                "visibility": "off"
            }]
        }, {
            "featureType": "water",
            "elementType": "labels",
            "stylers": [{
                "visibility": "on"
            }, {
                "lightness": -25
            }, {
                "saturation": -100
            }]
        }, {
            "featureType": "water",
            "elementType": "geometry",
            "stylers": [{
                "hue": "#ffff00"
            }, {
                "lightness": -25
            }, {
                "saturation": -97
            }]
        }]

    };
    var map = new google.maps.Map(document.getElementById("map_canvas"),
        mapOptions);



    var infowindow = new google.maps.InfoWindow({});


    var lineSymbol = {
        path: google.maps.SymbolPath.FORWARD_OPEN_ARROW
    };

    var markers = []

    // Route generation
    _.each(dataDestirnations, function(item) {

        var marker = new google.maps.Marker({
            position: item.location,
            map: map,
            title: item.country
        });
        markers.push(marker)

        window.markers = markers

        google.maps.event.addListener(marker, 'click', function() {
            setInfoWindows(this.title)

        });

    });

    // Set infowindows
    function setInfoWindows(country) {
        var routeClicked = country
        _.each(window.markers, function(item) {
            if (item.title == routeClicked) {
                setContent(routeClicked)
                infowindow.open(map, item);
            };
        });

        var shippers = []
        var i = 0
        _.each(window.DRCData, function(item) {
            console.log(item)
            var shipperEach = {}
            i++
            if (item.destination_country == routeClicked) {
                shipperEach.name = item.shipper
                shipperEach.type = item.shipper_type
                shipperEach.weight = item.weight_rwe
                shipperEach.description = item.shipper_description
                shippers.push(shipperEach)
            };

            if (i == window.DRCData.length) {
                generateShipperList()
            };

        });

        window.shippers = shippers

        generateShipperList()

        $("#country").text(country)
    }


    // Set content for infowindow
    function setContent(country) {
        var contentString = '<div id="content">' +
            '<div id="siteNotice">' +
            '</div>' +
            '<h1 id="firstHeading" class="firstHeading"> ' + country + ' </h1>' +
            '<div id="bodyInfoWindowContent">' +
            '<h5 id="amountTotalTooltip"></h5>' +
            '<h5>Species shipped :</h5>' +
            '<h5 id="speciesTooltip"></h5>' +
            '</div>' +
            '</div>';

        infowindow.setContent(contentString);
        var totalWeight = 0;
        var species = [];
        _.each(window.DRCData, function(countryEach) {
            if (countryEach.destination_country == country) {
                totalWeight = totalWeight + parseFloat(countryEach.weight_rwe)
                $("#amountTotalTooltip").text('Total amount of shipped timber : ' + parseInt(totalWeight) + ' tons ')
                species.push(countryEach.species)
            };
        });

        var uniqueSpecies = _.uniq(species);
        _.each(uniqueSpecies, function(item) {
            $("#speciesTooltip").append('<p>' + item + '</p>')
        });
    }


    // Markers generation
    _.each(dataLocations, function(item) {

        var route = new google.maps.Polyline({
            path: item.location,
            icons: [{
                icon: lineSymbol,
                offset: '100%'
            }],
            geodesic: true,
            strokeColor: '#272727',
            strokeOpacity: 1,
            strokeWeight: 4,
            country: item.country
        });

        route.setMap(map);




        google.maps.event.addListener(route, 'click', function() {
            setInfoWindows(this.country)
                // mymap represents the map you created using google.maps.Map
        });




    });


}



function generateShipperList(type) {
    $('.custom-button').css({
        background: '#dddddd',
        color: '#252525'
    });
    $("#" + type).css({
        background: '#e00613',
        color: '#fff'
    });
    var shippers = window.shippers
    $(".scrollit").empty()
    _.each(shippers, function(shipper) {
        if (shipper.type.toLowerCase() != type && typeof type != 'undefined') {
            return

        }

        $(".scrollit").append('<div class = "col-lg-11 col-centered shipper-data" ><h3> Company ' + shipper.name + ' </h3> <h5> <span class = "semibold">Volume</span> : ' + shipper.weight + ' Tons</h5> <h5> <span class = "semibold" > Description </span> : ' + shipper.description + '</h5></div> ');




    });
}
